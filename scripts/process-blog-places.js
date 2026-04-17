#!/usr/bin/env node
/**
 * process-blog-places.js
 *
 * Reads a manually curated list of places from input/blog_places.txt,
 * looks up coordinates via Nominatim (free, no API key), then enriches
 * via Claude (same logic as enrich-places.js).
 *
 * Usage:
 *   node scripts/process-blog-places.js
 *
 * (reads ANTHROPIC_API_KEY from .env)
 *
 * Input format (input/blog_places.txt):
 *   One place per line: Name | Type | Address (optional)
 *   Lines starting with # are comments and are ignored.
 *   Blank lines are ignored.
 *
 * Output:
 *   output/blogs/blog_places_enriched.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

const INPUT_PATH = path.join(ROOT, 'input', 'blog_places.txt')
if (!fs.existsSync(INPUT_PATH)) {
  console.error(`❌  Input file not found: ${INPUT_PATH}`)
  console.error('   Create input/blog_places.txt — see the template for format.')
  process.exit(1)
}

const BATCH_SIZE = 10
const NOMINATIM_DELAY_MS = 1100 // Nominatim rate limit: 1 req/sec
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ── Feature vocabulary (mirrors enrich-places.js) ────────────────────────────

const FEATURE_VOCAB = {
  Playground: ['climbing', 'swings', 'splash-pad', 'baby-swings', 'fenced', 'accessible-equipment', 'sand-pit', 'nature-play', 'skate-park'],
  Park:       ['paved-paths', 'shade', 'restrooms-nearby', 'stroller-friendly', 'beach-access', 'easy-grade', 'picnic-area', 'swimming', 'splash-pad', 'fenced', 'nature-play'],
  'Café':     ['high-chairs', 'kids-menu', 'booster-seats', 'changing-table', 'stroller-accessible', 'outdoor-seating', 'crayons-activities', 'noise-tolerant', 'kids-eat-free'],
  Museum:     ['hands-on-exhibits', 'kids-programs', 'stroller-friendly', 'nursing-room', 'interactive-displays', 'family-discount', 'free-entry', 'sensory-friendly'],
  Library:    ['storytime', 'kids-section', 'quiet-room', 'family-events', 'free-entry', 'reading-programs', 'maker-space', 'multilingual'],
  Attraction: ['soft-play', 'age-sections', 'cafe-on-site', 'party-rooms', 'sensory-friendly', 'toddler-sessions', 'adult-seating', 'socks-required', 'hands-on-exhibits', 'stroller-friendly', 'family-discount', 'free-entry'],
  Other:      ['stroller-accessible', 'family-friendly', 'kids-welcome', 'changing-table', 'free-entry'],
}

const STAGES_LIST = ['infant', 'toddler', 'preschool', 'school-age', 'all-ages']

// ── Parse input file ──────────────────────────────────────────────────────────

function parseInputFile(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim())
      return {
        name:    parts[0] ?? '',
        type:    parts[1] ?? 'Other',
        address: parts[2] ?? '',
      }
    })
    .filter((p) => p.name)
}

// ── Nominatim geocoding ───────────────────────────────────────────────────────

async function geocode(name, address) {
  const query = address
    ? `${address} Seattle`
    : `${name} Seattle`

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'LittlePlaces/1.0 (data pipeline; contact@littleplaces.app)',
    },
  })

  if (!res.ok) return { lat: null, lng: null, resolvedAddress: address }

  const data = await res.json()
  if (!data.length) return { lat: null, lng: null, resolvedAddress: address }

  const result = data[0]
  const resolvedAddress = address || result.display_name.split(',').slice(0, 3).join(',').trim()

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    resolvedAddress,
  }
}

// ── Claude enrichment ─────────────────────────────────────────────────────────

async function enrichBatch(places) {
  const vocab = (type) => (FEATURE_VOCAB[type] ?? FEATURE_VOCAB.Other).join(', ')

  const placeList = places
    .map(
      (p, i) =>
        `${i + 1}. Name: ${p.name}
   Type: ${p.type}
   Address: ${p.address || 'Seattle, WA'}
   Available child_friendly_features for this type: ${vocab(p.type)}`
    )
    .join('\n\n')

  const prompt = `You are helping populate a Seattle family-friendly places directory called Little Places.

For each place below, return a JSON array with one object per place. Each object must have exactly these fields:
- "description": 1-2 warm, specific sentences about why this place is great for families with kids. Write in second person ("You'll find…", "Kids love…"). Do not use generic phrases.
- "stages": array of applicable age stages from: ${STAGES_LIST.join(', ')}. Use your knowledge of the place.
- "child_friendly_features": array of 2-5 tags chosen ONLY from the available features listed for each place's type.
- "tags": array of 2-4 lowercase tags for neighbourhood/vibe/occasion (e.g. "ballard", "rainy-day", "free", "outdoor", "toddler-favourite").

Return ONLY the JSON array, no other text.

Places:
${placeList}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((b) => b.type === 'text')?.text ?? '[]'
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    console.warn('  ⚠️  Failed to parse Claude response — skipping batch')
    return places.map(() => ({ description: '', stages: [], child_friendly_features: [], tags: [] }))
  }
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function escapeCsv(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf8')
  const places = parseInputFile(raw)
  console.log(`📂  Loaded ${places.length} places from input/blog_places.txt`)

  // Step 1: geocode all places
  console.log('\n🗺️  Geocoding…')
  const geocoded = []
  for (const place of places) {
    process.stdout.write(`  ${place.name}… `)
    const { lat, lng, resolvedAddress } = await geocode(place.name, place.address)
    geocoded.push({ ...place, lat, lng, address: resolvedAddress })
    process.stdout.write(lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}\n` : 'not found\n')
    await new Promise((r) => setTimeout(r, NOMINATIM_DELAY_MS))
  }

  const notFound = geocoded.filter((p) => !p.lat).length
  if (notFound > 0) {
    console.log(`\n  ⚠️  ${notFound} place(s) not geocoded — lat/lng will be empty. Check manually.`)
  }

  // Step 2: enrich in batches
  const enriched = []
  console.log('\n🤖  Enriching…')

  for (let i = 0; i < geocoded.length; i += BATCH_SIZE) {
    const batch = geocoded.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(geocoded.length / BATCH_SIZE)
    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} places)`)

    let results
    try {
      results = await enrichBatch(batch)
    } catch (err) {
      console.warn(`  ⚠️  Batch failed — ${err.message}. Filling with blanks.`)
      results = batch.map(() => ({ description: '', stages: [], child_friendly_features: [], tags: [] }))
    }

    for (let j = 0; j < batch.length; j++) {
      const original = batch[j]
      const enrichment = results[j] ?? {}
      enriched.push({
        name:                    original.name,
        type:                    original.type,
        address:                 original.address,
        description:             enrichment.description ?? '',
        stages:                  JSON.stringify(enrichment.stages ?? []),
        child_friendly_features: JSON.stringify(enrichment.child_friendly_features ?? []),
        tags:                    JSON.stringify(enrichment.tags ?? []),
        lat:                     original.lat ?? '',
        lng:                     original.lng ?? '',
        submitted_by:            'admin',
        rating:                  0,
        is_seed:                 false,
      })
    }

    if (i + BATCH_SIZE < geocoded.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Step 3: write output
  const outPath = path.join(ROOT, 'output', 'blogs', 'blog_places_enriched.csv')
  const headers = ['name', 'type', 'address', 'description', 'stages', 'child_friendly_features', 'tags', 'lat', 'lng', 'submitted_by', 'rating', 'is_seed']
  const header = headers.join(',')
  const lines = enriched.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))

  fs.writeFileSync(outPath, [header, ...lines].join('\n') + '\n', 'utf8')

  console.log(`\n✅  ${enriched.length} enriched places written to output/blogs/blog_places_enriched.csv`)
  console.log('   Review the CSV before importing to Supabase.')
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
