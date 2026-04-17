#!/usr/bin/env node
/**
 * fetch-google-details.js
 *
 * Fetches Place Details (reviews only) for each place in raw_places.csv.
 * Reviews are used downstream to extract confirmed child-friendly features.
 *
 * Usage:
 *   node scripts/fetch-google-details.js
 *
 * (reads GOOGLE_PLACES_API_KEY from .env)
 *
 * Input:  output/google/raw_places.csv  (must have place_id column)
 * Output: output/google/raw_places_with_reviews.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
if (!API_KEY) {
  console.error('❌  GOOGLE_PLACES_API_KEY is not set')
  process.exit(1)
}

const INPUT_PATH  = path.join(ROOT, 'output', 'google', 'raw_places.csv')
const OUTPUT_PATH = path.join(ROOT, 'output', 'google', 'raw_places_with_reviews.csv')
const DELAY_MS    = 150  // stay well inside 10 req/sec default quota

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

// ── Google Place Details ──────────────────────────────────────────────────────

async function fetchReviews(placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields:   'reviews',
    key:      API_KEY,
  })

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`API error (${data.status}): ${data.error_message ?? ''}`)
  }

  const reviews = (data.result?.reviews ?? [])
    .map((r) => r.text?.trim())
    .filter(Boolean)

  return reviews
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌  Input not found: ${INPUT_PATH}`)
    console.error('   Run fetch-google-places.js first.')
    process.exit(1)
  }

  const rows = parseCsv(fs.readFileSync(INPUT_PATH, 'utf8'))
  console.log(`📂  Loaded ${rows.length} places from raw_places.csv`)

  // Load already-fetched place_ids from output file (resume support)
  const fetched = new Map()  // place_id → row with reviews
  if (fs.existsSync(OUTPUT_PATH)) {
    const existing = parseCsv(fs.readFileSync(OUTPUT_PATH, 'utf8'))
    for (const row of existing) {
      if (row.place_id) fetched.set(row.place_id, row)
    }
    if (fetched.size > 0) {
      console.log(`   Resuming — ${fetched.size} already fetched, skipping those`)
    }
  }

  const results = []
  let withReviews = 0
  let noReviews   = 0
  let skipped     = 0
  let errors      = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Resume: skip if already fetched
    if (row.place_id && fetched.has(row.place_id)) {
      results.push(fetched.get(row.place_id))
      skipped++
      continue
    }

    process.stdout.write(`  [${i + 1}/${rows.length}] ${row.name}… `)

    if (!row.place_id) {
      process.stdout.write('no place_id — skipping\n')
      results.push({ ...row, reviews: '[]' })
      continue
    }

    let reviews = []
    try {
      reviews = await fetchReviews(row.place_id)
      if (reviews.length > 0) {
        process.stdout.write(`${reviews.length} review(s)\n`)
        withReviews++
      } else {
        process.stdout.write('no reviews\n')
        noReviews++
      }
    } catch (err) {
      process.stdout.write(`error — ${err.message}\n`)
      errors++
    }

    const result = { ...row, reviews: JSON.stringify(reviews) }
    results.push(result)

    // Write incrementally so a crash doesn't lose progress
    const headers = [...Object.keys(rows[0]), 'reviews']
    const isFirst = results.length === 1 && skipped === 0
    if (isFirst) {
      fs.writeFileSync(OUTPUT_PATH, headers.join(',') + '\n', 'utf8')
    }
    fs.appendFileSync(OUTPUT_PATH, headers.map((h) => escapeCsv(result[h])).join(',') + '\n', 'utf8')

    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  // If we resumed, rewrite the full file in input order (already-fetched rows
  // were not re-appended above, so rebuild from results array)
  if (skipped > 0) {
    const headers = [...Object.keys(rows[0]), 'reviews']
    const lines   = results.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))
    fs.writeFileSync(OUTPUT_PATH, [headers.join(','), ...lines].join('\n') + '\n', 'utf8')
  }

  console.log(`\n✅  Done: ${withReviews} with reviews, ${noReviews} without, ${skipped} resumed, ${errors} errors`)
  console.log(`   Output: output/google/raw_places_with_reviews.csv`)
  console.log(`   Next: node scripts/extract-features-from-reviews.js`)
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
