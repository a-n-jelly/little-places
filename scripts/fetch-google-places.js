#!/usr/bin/env node
/**
 * fetch-google-places.js
 *
 * Fetches raw place data from Google Places API (Text Search) for
 * child-friendly categories in Seattle. One-time use for initial DB population.
 *
 * Usage:
 *   node scripts/fetch-google-places.js
 *
 * (reads GOOGLE_PLACES_API_KEY from .env)
 *
 * Output:
 *   output/google/raw_places.csv
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

const SEATTLE_CENTER = '47.6062,-122.3321'
const RADIUS_METERS = 20000
const RESULTS_PER_QUERY = 20 // Google Text Search max per page

/**
 * Queries to run, each with a target type label for our schema.
 * type must match PLACE_TYPES in constants.js:
 *   Park | Café | Museum | Attraction | Library | Playground | Other
 */
const QUERIES = [
  // Restaurants & cafes
  { query: 'kid friendly cafe Seattle',             type: 'Café'       },
  { query: 'family friendly restaurant Seattle',    type: 'Café'       },
  { query: 'child friendly brunch Seattle',         type: 'Café'       },

  // Museums & indoor culture
  { query: "children's museum Seattle",             type: 'Museum'     },
  { query: 'science center Seattle families',       type: 'Museum'     },
  { query: 'interactive museum kids Seattle',       type: 'Museum'     },
  { query: 'aquarium Seattle',                      type: 'Attraction' },

  // Libraries — SPL has 27 branches; this will catch most of them
  { query: 'Seattle Public Library',                type: 'Library'    },

  // Indoor play
  { query: 'indoor play centre Seattle kids',       type: 'Attraction' },
  { query: 'trampoline park Seattle',               type: 'Attraction' },
  { query: 'soft play Seattle toddler',             type: 'Attraction' },
  { query: 'kids gym Seattle',                      type: 'Attraction' },

  // Nature, parks & trails
  { query: 'family park splash pad Seattle',        type: 'Park'       },
  { query: 'nature trail family friendly Seattle',  type: 'Park'       },
  { query: 'beach family picnic Seattle',           type: 'Park'       },
  { query: 'botanic garden Seattle families',       type: 'Park'       },
]

// ── Google Places Text Search ─────────────────────────────────────────────────

async function textSearch(query) {
  const params = new URLSearchParams({
    query,
    location: SEATTLE_CENTER,
    radius: RADIUS_METERS,
    key: API_KEY,
  })

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for query: "${query}"`)

  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`API error (${data.status}): ${data.error_message ?? ''}`)
  }

  return data.results ?? []
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

function toCsvRow(cols) {
  return cols.map(escapeCsv).join(',')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const seenIds = new Set()
  const rows = []

  for (const { query, type } of QUERIES) {
    console.log(`🔍  ${query}`)

    let results
    try {
      results = await textSearch(query)
    } catch (err) {
      console.warn(`  ⚠️  Skipping — ${err.message}`)
      continue
    }

    let added = 0
    for (const place of results) {
      if (seenIds.has(place.place_id)) continue
      seenIds.add(place.place_id)

      rows.push({
        name:              place.name,
        type,
        address:           place.formatted_address ?? '',
        lat:               place.geometry?.location?.lat ?? '',
        lng:               place.geometry?.location?.lng ?? '',
        place_id:          place.place_id,
        google_types:      (place.types ?? []).join('|'),
        rating:            place.rating ?? 0,
        user_ratings_total: place.user_ratings_total ?? 0,
      })
      added++
    }

    console.log(`  ✓  ${results.length} results, ${added} new`)

    // Avoid hammering the API
    await new Promise((r) => setTimeout(r, 300))
  }

  // Write CSV
  const outPath = path.join(ROOT, 'output', 'google', 'raw_places.csv')
  const header = toCsvRow(['name', 'type', 'address', 'lat', 'lng', 'place_id', 'google_types', 'rating', 'user_ratings_total'])
  const lines = rows.map((r) =>
    toCsvRow([r.name, r.type, r.address, r.lat, r.lng, r.place_id, r.google_types, r.rating, r.user_ratings_total])
  )

  fs.writeFileSync(outPath, [header, ...lines].join('\n') + '\n', 'utf8')

  console.log(`\n✅  ${rows.length} places written to output/google/raw_places.csv`)
  console.log(`   Next step: node scripts/enrich-places.js output/google/raw_places.csv`)
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
