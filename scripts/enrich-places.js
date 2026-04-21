#!/usr/bin/env node
/**
 * enrich-places.js
 *
 * Takes a CSV with at minimum: name, type, address, lat, lng
 * Calls Claude (haiku) in batches to generate:
 *   - description (1-2 sentences, child-focused)
 *   - stages (array from: infant, toddler, preschool, school-age, all-ages)
 *   - child_friendly_features (type-specific feature tags)
 *   - tags (neighbourhood / vibe / occasion tags)
 *
 * Usage:
 *   node scripts/enrich-places.js <input.csv>
 *
 * (reads ANTHROPIC_API_KEY from .env)
 *
 * Output:
 *   output/enriched/<input_basename>_enriched.csv
 *
 * Examples:
 *   node scripts/enrich-places.js output/google/raw_places.csv
 *   node scripts/enrich-places.js input/blog_places.csv
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

const INPUT_PATH = process.argv[2]
if (!INPUT_PATH) {
  console.error('❌  Usage: node scripts/enrich-places.js <input.csv>')
  process.exit(1)
}

const BATCH_SIZE = 10

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ── Feature vocabulary per type ───────────────────────────────────────────────

const FEATURE_VOCAB = {
  Playground: [
    'climbing', 'swings', 'splash-pad', 'baby-swings', 'fenced',
    'accessible-equipment', 'sand-pit', 'nature-play', 'skate-park',
  ],
  Park: [
    'paved-paths', 'shade', 'restrooms-nearby', 'stroller-friendly',
    'beach-access', 'easy-grade', 'picnic-area', 'swimming',
    'splash-pad', 'fenced', 'nature-play',
  ],
  'Café': [
    'high-chairs', 'kids-menu', 'booster-seats', 'changing-table',
    'stroller-accessible', 'outdoor-seating', 'crayons-activities',
    'noise-tolerant', 'kids-eat-free',
  ],
  Museum: [
    'hands-on-exhibits', 'kids-programs', 'stroller-friendly',
    'nursing-room', 'interactive-displays', 'family-discount',
    'free-entry', 'sensory-friendly',
  ],
  Library: [
    'storytime', 'kids-section', 'quiet-room', 'family-events',
    'free-entry', 'reading-programs', 'maker-space', 'multilingual',
  ],
  Attraction: [
    'soft-play', 'age-sections', 'cafe-on-site', 'party-rooms',
    'sensory-friendly', 'toddler-sessions', 'adult-seating',
    'socks-required', 'hands-on-exhibits', 'stroller-friendly',
    'family-discount', 'free-entry',
  ],
  Other: [
    'stroller-accessible', 'family-friendly', 'kids-welcome',
    'changing-table', 'free-entry',
  ],
}

const STAGES_LIST = ['baby', 'toddler', 'preschool', 'bigkids', 'tweens']

// ── CSV parse (minimal, handles quoted fields) ────────────────────────────────

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = splitCsvRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitCsvRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

function splitCsvRow(row) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function escapeCsv(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ── Claude enrichment ─────────────────────────────────────────────────────────

async function enrichBatch(places) {
  const vocab = (type) =>
    (FEATURE_VOCAB[type] ?? FEATURE_VOCAB.Other).join(', ')

  const placeList = places
    .map(
      (p, i) =>
        `${i + 1}. Name: ${p.name}
   Type: ${p.type}
   Address: ${p.address}
   Available child_friendly_features for this type: ${vocab(p.type)}`
    )
    .join('\n\n')

  const prompt = `You are helping populate a Seattle family-friendly places directory called Little Places.

For each place below, return a JSON array with one object per place. Each object must have exactly these fields:
- "description": 1-2 warm, specific sentences about why this place is great for families with kids. Write in second person ("You'll find…", "Kids love…"). Do not use generic phrases.
- "stages": array of applicable age stages from: ${STAGES_LIST.join(', ')}. Use your knowledge of the place type and name.
- "child_friendly_features": array of 2-5 tags chosen ONLY from the available features listed for each place's type.
- "tags": array of 2-4 lowercase tags for neighbourhood/vibe/occasion (e.g. "ballard", "rainy-day", "free", "outdoor", "sensory-friendly", "toddler-favourite").

Return ONLY the JSON array, no other text.

Places:
${placeList}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content.find((b) => b.type === 'text')?.text ?? '[]'

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    console.warn('  ⚠️  Failed to parse Claude response — skipping batch')
    console.warn('  Raw:', text.slice(0, 200))
    return places.map(() => ({ description: '', stages: [], child_friendly_features: [], tags: [] }))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const inputAbs = path.resolve(INPUT_PATH)
  if (!fs.existsSync(inputAbs)) {
    console.error(`❌  File not found: ${inputAbs}`)
    process.exit(1)
  }

  const rawCsv = fs.readFileSync(inputAbs, 'utf8')
  const places = parseCsv(rawCsv)
  console.log(`📂  Loaded ${places.length} places from ${path.basename(inputAbs)}`)

  const enriched = []

  for (let i = 0; i < places.length; i += BATCH_SIZE) {
    const batch = places.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(places.length / BATCH_SIZE)

    console.log(`🤖  Enriching batch ${batchNum}/${totalBatches} (${batch.length} places)…`)

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
        rating:                  original.rating ?? 0,
        is_seed:                 false,
      })
    }

    // Brief pause between batches to stay well inside rate limits
    if (i + BATCH_SIZE < places.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Write output CSV
  const baseName = path.basename(inputAbs, path.extname(inputAbs))
  const outPath = path.join(ROOT, 'output', 'enriched', `${baseName}_enriched.csv`)

  const headers = ['name', 'type', 'address', 'description', 'stages', 'child_friendly_features', 'tags', 'lat', 'lng', 'submitted_by', 'rating', 'is_seed']
  const header = headers.join(',')
  const lines = enriched.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))

  fs.writeFileSync(outPath, [header, ...lines].join('\n') + '\n', 'utf8')

  console.log(`\n✅  ${enriched.length} enriched places written to output/enriched/${baseName}_enriched.csv`)
  console.log('   Review the CSV before importing to Supabase.')
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
