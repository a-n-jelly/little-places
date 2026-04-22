#!/usr/bin/env node
/**
 * extract-features-from-reviews.js
 *
 * Reads raw_places_with_reviews.csv and asks Claude to extract child-friendly
 * features that are explicitly confirmed by reviewers — not inferred.
 *
 * Usage:
 *   node scripts/extract-features-from-reviews.js
 *
 * (reads ANTHROPIC_API_KEY from .env)
 *
 * Input:  output/google/raw_places_with_reviews.csv
 * Output: output/enriched/review_features.csv
 *         columns: place_id, name, additional_features (JSON)
 *
 * Next step:
 *   node scripts/apply-review-features.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'
import Anthropic from '@anthropic-ai/sdk'
import { FEATURE_VOCAB } from '../src/lib/constants.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

const INPUT_PATH  = path.join(ROOT, 'output', 'google', 'raw_places_with_reviews.csv')
const OUTPUT_PATH = path.join(ROOT, 'output', 'enriched', 'review_features.csv')
const BATCH_SIZE  = 10

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ── CSV helpers ───────────────────────────────────────────────────────────────

function splitCsvRow(row) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = splitCsvRow(lines[0])
  return lines.slice(1).map((line) => {
    if (!line.trim()) return null
    const values = splitCsvRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  }).filter(Boolean)
}

function escapeCsv(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ── Claude extraction ─────────────────────────────────────────────────────────

async function extractBatch(places) {
  const placeList = places.map((p, i) => {
    const vocab = (FEATURE_VOCAB[p.type] ?? FEATURE_VOCAB.Other).join(', ')
    const reviews = (() => {
      try { return JSON.parse(p.reviews ?? '[]') } catch { return [] }
    })()

    if (reviews.length === 0) return null

    return `${i + 1}. Name: ${p.name}
   Type: ${p.type}
   Allowed features for this type: ${vocab}
   Reviews:
${reviews.map((r, j) => `     [${j + 1}] ${r}`).join('\n')}`
  })

  const withReviews = placeList.map((text, i) => ({ text, index: i, place: places[i] }))
    .filter(({ text }) => text !== null)

  if (withReviews.length === 0) {
    return places.map(() => ({ additional_features: [] }))
  }

  const prompt = `You are extracting child-friendly features from real user reviews of Seattle family-friendly places.

For each place below, identify features that reviewers explicitly confirm are present. Be conservative:
- Only include a feature if a reviewer clearly states or strongly implies it exists
- Do not infer features that aren't mentioned (e.g. if no one mentions high chairs, don't add high-chairs)
- Choose features ONLY from the allowed vocabulary listed for each place

Return a JSON array with one object per place in the order given. Each object:
{
  "additional_features": []   // subset of the allowed features list, confirmed by reviews
}

If reviews don't confirm any features, return empty arrays — do NOT make things up.

Return ONLY the JSON array, no other text.

Places:
${withReviews.map(({ text }) => text).join('\n\n')}`

  const response = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages:   [{ role: 'user', content: prompt }],
  })

  const text    = response.content.find((b) => b.type === 'text')?.text ?? '[]'
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.warn('  ⚠️  Failed to parse Claude response — returning empty results for batch')
    parsed = withReviews.map(() => ({ additional_features: [] }))
  }

  const results = places.map(() => ({ additional_features: [] }))
  withReviews.forEach(({ index }, j) => {
    results[index] = parsed[j] ?? { additional_features: [] }
  })
  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌  Input not found: ${INPUT_PATH}`)
    console.error('   Run fetch-google-details.js first.')
    process.exit(1)
  }

  const rows = parseCsv(fs.readFileSync(INPUT_PATH, 'utf8'))
  console.log(`📂  Loaded ${rows.length} places from raw_places_with_reviews.csv`)

  const withReviewCount = rows.filter((r) => {
    try { return JSON.parse(r.reviews ?? '[]').length > 0 } catch { return false }
  }).length
  console.log(`   ${withReviewCount} have at least one review`)

  const results = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch    = rows.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const total    = Math.ceil(rows.length / BATCH_SIZE)
    console.log(`🤖  Batch ${batchNum}/${total} (${batch.length} places)…`)

    let extracted
    try {
      extracted = await extractBatch(batch)
    } catch (err) {
      console.warn(`  ⚠️  Batch failed — ${err.message}. Using empty results.`)
      extracted = batch.map(() => ({ additional_features: [] }))
    }

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      const ext = extracted[j] ?? { additional_features: [] }
      const featCount = ext.additional_features.length
      if (featCount > 0) {
        console.log(`  ✓ "${row.name}" — +${featCount} features`)
      }
      results.push({
        place_id:            row.place_id ?? '',
        name:                row.name,
        type:                row.type,
        additional_features: JSON.stringify(ext.additional_features ?? []),
      })
    }

    if (i + BATCH_SIZE < rows.length) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  const headers = ['place_id', 'name', 'type', 'additional_features']
  const lines   = results.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))

  fs.writeFileSync(OUTPUT_PATH, [headers.join(','), ...lines].join('\n') + '\n', 'utf8')

  const enrichedCount = results.filter((r) => {
    try { return JSON.parse(r.additional_features).length > 0 } catch { return false }
  }).length

  console.log(`\n✅  ${results.length} places processed, ${enrichedCount} gained new features`)
  console.log(`   Output: output/enriched/review_features.csv`)
  console.log(`   Next: node scripts/apply-review-features.js`)
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
