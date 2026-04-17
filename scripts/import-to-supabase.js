#!/usr/bin/env node
/**
 * import-to-supabase.js
 *
 * Imports enriched place CSVs into Supabase. Handles merging across sources
 * (parks DB, Google Places, blog) so duplicates are combined rather than doubled.
 *
 * Prerequisites (run once before first import):
 *   1. In Supabase SQL editor: ALTER TABLE places ADD COLUMN IF NOT EXISTS source text;
 *   2. Add SUPABASE_SERVICE_ROLE_KEY to .env (anon key can't UPDATE due to RLS)
 *
 * Usage:
 *   node scripts/import-to-supabase.js [options] <csv1> [csv2...]
 *
 * Options:
 *   --dry-run        Print what would happen; write nothing to Supabase
 *   --verbose        Print every match/merge/insert decision
 *   --radius <m>     Geo match threshold in metres (default: 100)
 *
 * Recommended run order:
 *   node scripts/import-to-supabase.js \
 *     output/parks/play_areas_import.csv \
 *     output/enriched/raw_places_enriched.csv \
 *     output/blogs/blog_places_enriched.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ── CLI parsing ───────────────────────────────────────────────────────────────

function parseCLI(argv) {
  const args = argv.slice(2)
  const options = { dryRun: false, verbose: false, radius: 100 }
  const csvPaths = []

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true
    } else if (args[i] === '--verbose') {
      options.verbose = true
    } else if (args[i] === '--radius') {
      options.radius = parseInt(args[++i], 10)
      if (isNaN(options.radius)) {
        console.error('❌  --radius must be a number')
        process.exit(1)
      }
    } else {
      csvPaths.push(args[i])
    }
  }

  if (csvPaths.length === 0) {
    console.error('❌  Usage: node scripts/import-to-supabase.js [--dry-run] [--verbose] [--radius 100] <csv1> [csv2...]')
    process.exit(1)
  }

  return { csvPaths, options }
}

// ── Env validation ────────────────────────────────────────────────────────────

function validateEnv(dryRun) {
  const required = ['VITE_SUPABASE_URL']
  if (!dryRun) required.push('SUPABASE_SERVICE_ROLE_KEY')

  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`❌  Missing env vars: ${missing.join(', ')}`)
    if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.error('   Add SUPABASE_SERVICE_ROLE_KEY to .env (from Supabase project settings > API > service_role key)')
    }
    process.exit(1)
  }
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = splitCsvRow(lines[0])
  return lines.slice(1).map((line, i) => {
    if (!line.trim()) return null
    const values = splitCsvRow(line)
    const row = Object.fromEntries(headers.map((h, j) => [h.trim(), (values[j] ?? '').trim()]))
    row._lineNumber = i + 2
    return row
  }).filter(Boolean)
}

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

// ── Column normalisation ──────────────────────────────────────────────────────

function inferSource(csvPath) {
  const base = path.basename(csvPath, path.extname(csvPath)).toLowerCase()
  if (base.includes('play_areas') || base.includes('parks')) return 'parks-db'
  if (base.includes('google') || base.includes('raw_places')) return 'google-places'
  if (base.includes('blog')) return 'blog'
  return 'manual'
}

function parseArrayField(val) {
  if (!val || val.trim() === '') return []
  // Try JSON first
  if (val.trim().startsWith('[')) {
    try { return JSON.parse(val) } catch {}
  }
  // Fall back to comma-separated
  return val.split(',').map((s) => s.trim()).filter(Boolean)
}

const STRIP_TAGS = /^source-age:|^ada-compliant$/

function normaliseRow(row, source) {
  // Remap non-standard column names (parks CSV uses submittedby, isseed)
  const name = (row.name ?? '').trim()
  const type = (row.type ?? 'Other').trim()
  const address = (row.address ?? '').trim()
  const description = (row.description ?? '').trim()
  const lat = row.lat !== '' ? parseFloat(row.lat) : null
  const lng = row.lng !== '' ? parseFloat(row.lng) : null
  const rating = parseFloat(row.rating) || 0
  const submitted_by = (row.submitted_by ?? row.submittedby ?? 'admin').trim()
  const is_seed = (row.is_seed ?? row.isseed ?? 'false') === 'true'

  let stages = parseArrayField(row.stages)
  let child_friendly_features = parseArrayField(row.child_friendly_features)
  let tags = parseArrayField(row.tags).filter((t) => !STRIP_TAGS.test(t))

  return {
    name, type, address, description,
    stages, child_friendly_features, tags,
    lat, lng, rating,
    submitted_by, is_seed,
    source,
    embedding_status: 'pending',
    // explicitly omit id, created_at, search_summary, embedding — let Supabase handle these
  }
}

// ── Name normalisation for matching ──────────────────────────────────────────

const TYPE_SUFFIXES = /\s*(playground|park|playfield|play area|garden|center|centre|library|museum|cafe|café)\s*$/i

function normaliseName(name) {
  return name
    .toLowerCase()
    .replace(TYPE_SUFFIXES, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Geo distance ──────────────────────────────────────────────────────────────

function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ── Match registry ────────────────────────────────────────────────────────────

function buildRegistry(records) {
  const byName = new Map()
  const geoIndex = []

  for (const record of records) {
    const key = normaliseName(record.name)
    if (key && !byName.has(key)) byName.set(key, record)
    if (record.lat != null && record.lng != null) {
      geoIndex.push({ record, lat: record.lat, lng: record.lng })
    }
  }

  return { byName, geoIndex }
}

function addToRegistry(registry, record) {
  const key = normaliseName(record.name)
  if (key && !registry.byName.has(key)) registry.byName.set(key, record)
  if (record.lat != null && record.lng != null) {
    registry.geoIndex.push({ record, lat: record.lat, lng: record.lng })
  }
}

// ── Match algorithm ───────────────────────────────────────────────────────────

function findMatch(registry, row, options) {
  const { radius } = options
  const TIGHT = radius / 2  // high-confidence geo threshold

  const normName = normaliseName(row.name)
  const nameMatch = normName ? registry.byName.get(normName) ?? null : null

  // Geo candidates within radius
  let geoMatches = []
  if (row.lat != null && row.lng != null) {
    for (const entry of registry.geoIndex) {
      const dist = haversineMetres(row.lat, row.lng, entry.lat, entry.lng)
      if (dist <= radius) geoMatches.push({ record: entry.record, dist })
    }
    geoMatches.sort((a, b) => a.dist - b.dist)
  }

  const closestGeo = geoMatches[0] ?? null

  // Both signals point to same record → high confidence
  if (nameMatch && closestGeo && nameMatch.id === closestGeo.record.id) {
    return { record: nameMatch, matchType: 'geo+name' }
  }

  // Tight geo match (within half-radius) → accept regardless of name
  if (closestGeo && closestGeo.dist <= TIGHT) {
    return { record: closestGeo.record, matchType: 'geo' }
  }

  // Loose geo match (within radius) — only accept if name also aligns
  if (closestGeo && closestGeo.dist <= radius) {
    if (nameMatch && nameMatch.id === closestGeo.record.id) {
      return { record: nameMatch, matchType: 'geo+name' }
    }
    // Names don't align — too risky (two different places in same park)
    return null
  }

  // Name-only match (no coords on either side)
  if (nameMatch) {
    return { record: nameMatch, matchType: 'name' }
  }

  return null
}

// ── Boilerplate detection ─────────────────────────────────────────────────────

function isBoilerplate(description) {
  if (!description || description.trim().length < 5) return true
  if (/Equipment includes/i.test(description)) return true
  // Bare label like "B.F. Day Playground." or "Alki Playground."
  if (/^[\w\s'',.()-]{0,80}(Playground|Park|Playfield|Play Area)\.\s*$/.test(description.trim())) return true
  return false
}

// ── Merge strategy ────────────────────────────────────────────────────────────

function unionArrays(...arrays) {
  return [...new Set(arrays.flat().filter(Boolean))]
}

function mergeRecords(existing, incoming) {
  const patch = {}
  let changed = false

  // type: keep existing unless it's Other
  if (existing.type === 'Other' && incoming.type !== 'Other') {
    patch.type = incoming.type; changed = true
  }

  // address: keep existing unless blank
  if (!existing.address && incoming.address) {
    patch.address = incoming.address; changed = true
  }

  // description: replace only if existing is boilerplate
  if (isBoilerplate(existing.description) && !isBoilerplate(incoming.description)) {
    patch.description = incoming.description; changed = true
  }

  // arrays: union
  const mergedStages = unionArrays(existing.stages ?? [], incoming.stages ?? [])
  if (mergedStages.length > (existing.stages ?? []).length) {
    patch.stages = mergedStages; changed = true
  }

  const mergedFeatures = unionArrays(existing.child_friendly_features ?? [], incoming.child_friendly_features ?? [])
  if (mergedFeatures.length > (existing.child_friendly_features ?? []).length) {
    patch.child_friendly_features = mergedFeatures; changed = true
  }

  const mergedTags = unionArrays(existing.tags ?? [], incoming.tags ?? [])
  if (mergedTags.length > (existing.tags ?? []).length) {
    patch.tags = mergedTags; changed = true
  }

  // lat/lng: keep existing if present
  if (existing.lat == null && incoming.lat != null) { patch.lat = incoming.lat; changed = true }
  if (existing.lng == null && incoming.lng != null) { patch.lng = incoming.lng; changed = true }

  // rating: keep higher value
  if ((incoming.rating ?? 0) > (existing.rating ?? 0)) {
    patch.rating = incoming.rating; changed = true
  }

  // reset embedding if content changed
  if (changed && (patch.description || patch.stages || patch.tags || patch.child_friendly_features)) {
    patch.embedding_status = 'pending'
  }

  return changed ? patch : null
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function loadExistingPlaces(supabase) {
  const allRecords = []
  let from = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, type, address, description, stages, child_friendly_features, tags, lat, lng, rating, source, embedding_status, is_seed')
      .range(from, from + PAGE - 1)

    if (error) throw new Error(`Failed to load existing places: ${error.message}`)
    if (!data || data.length === 0) break
    allRecords.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  return allRecords
}

async function runWithConcurrency(tasks, concurrency) {
  const results = []
  let i = 0

  async function runNext() {
    while (i < tasks.length) {
      const idx = i++
      results[idx] = await tasks[idx]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, runNext))
  return results
}

// ── Plan execution ────────────────────────────────────────────────────────────

async function executePlan(plan, supabase) {
  const results = { merged: 0, inserted: 0, failed: [] }

  // Merges — individual updates, concurrency 5
  if (plan.merges.length > 0) {
    console.log(`\n🔀  Merging ${plan.merges.length} records…`)
    const tasks = plan.merges.map(({ id, name, patch }) => async () => {
      const { error } = await supabase.from('places').update(patch).eq('id', id)
      if (error) {
        results.failed.push({ name, operation: 'merge', error: error.message })
      } else {
        results.merged++
      }
    })
    await runWithConcurrency(tasks, 5)
  }

  // Inserts — batches of 50
  if (plan.inserts.length > 0) {
    console.log(`\n➕  Inserting ${plan.inserts.length} records…`)
    const BATCH = 50
    for (let i = 0; i < plan.inserts.length; i += BATCH) {
      const batch = plan.inserts.slice(i, i + BATCH)
      const { error } = await supabase.from('places').insert(batch)
      if (error) {
        // Try individually to isolate the bad record
        for (const record of batch) {
          const { error: err2 } = await supabase.from('places').insert([record])
          if (err2) {
            results.failed.push({ name: record.name, operation: 'insert', error: err2.message })
          } else {
            results.inserted++
          }
        }
      } else {
        results.inserted += batch.length
      }
    }
  }

  return results
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { csvPaths, options } = parseCLI(process.argv)
  const { dryRun, verbose, radius } = options

  validateEnv(dryRun)

  if (dryRun) console.log('🔍  DRY RUN — nothing will be written to Supabase\n')

  // Init Supabase (use service role for writes; anon is fine for reads in dry-run)
  const supabaseKey = dryRun
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY)
    : process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(process.env.VITE_SUPABASE_URL, supabaseKey)

  // Load existing records
  console.log('📡  Loading existing records from Supabase…')
  let existing
  try {
    existing = await loadExistingPlaces(supabase)
  } catch (err) {
    console.error(`❌  ${err.message}`)
    process.exit(1)
  }
  console.log(`   Found ${existing.length} existing records`)

  // Build registry
  const registry = buildRegistry(existing)

  // Plan accumulator
  const plan = { merges: [], inserts: [], skipped: [] }

  // Process CSVs in order
  for (const csvPath of csvPaths) {
    const absPath = path.resolve(csvPath)
    if (!fs.existsSync(absPath)) {
      console.error(`❌  File not found: ${absPath}`)
      process.exit(1)
    }

    const source = inferSource(csvPath)
    console.log(`\n📂  ${path.basename(csvPath)} (source: ${source})`)

    const rawRows = parseCsv(fs.readFileSync(absPath, 'utf8'))
    console.log(`   ${rawRows.length} rows`)

    for (const raw of rawRows) {
      if (!raw.name || !raw.type) {
        plan.skipped.push({ name: raw.name || '(blank)', reason: 'missing name or type', line: raw._lineNumber })
        if (verbose) console.log(`  ⚠️  Line ${raw._lineNumber}: skipping — missing name or type`)
        continue
      }

      let row
      try {
        row = normaliseRow(raw, source)
      } catch (err) {
        plan.skipped.push({ name: raw.name, reason: err.message, line: raw._lineNumber })
        if (verbose) console.log(`  ⚠️  Line ${raw._lineNumber} "${raw.name}": normalise error — ${err.message}`)
        continue
      }

      if (!row.address) {
        plan.skipped.push({ name: row.name, reason: 'missing address', line: raw._lineNumber })
        if (verbose) console.log(`  ⚠️  "${row.name}": skipping — missing address`)
        continue
      }

      const match = findMatch(registry, row, { radius })

      if (match) {
        const patch = mergeRecords(match.record, row)
        if (match.record.id) {
          // Supabase record — schedule an UPDATE
          if (patch) {
            plan.merges.push({ id: match.record.id, name: match.record.name, patch })
            if (verbose) {
              const fields = Object.keys(patch).filter((k) => k !== 'embedding_status')
              console.log(`  🔀  MERGE "${match.record.name}" ← "${row.name}" [${match.matchType}] (${fields.join(', ')})`)
            }
            Object.assign(match.record, patch)
          } else {
            if (verbose) console.log(`  ✓   MATCH "${match.record.name}" ← "${row.name}" [${match.matchType}] (no changes needed)`)
            plan.skipped.push({ name: row.name, reason: 'matched but no changes needed' })
          }
        } else {
          // Pending insert from earlier in this run — merge data into it directly
          if (patch) {
            Object.assign(match.record, patch)
            if (verbose) {
              const fields = Object.keys(patch).filter((k) => k !== 'embedding_status')
              console.log(`  🔀  ENRICH pending insert "${match.record.name}" ← "${row.name}" [${match.matchType}] (${fields.join(', ')})`)
            }
          } else {
            if (verbose) console.log(`  ✓   MATCH pending "${match.record.name}" ← "${row.name}" [${match.matchType}] (no changes needed)`)
          }
          plan.skipped.push({ name: row.name, reason: 'merged into pending insert' })
        }
      } else {
        plan.inserts.push(row)
        if (verbose) console.log(`  ➕  INSERT "${row.name}" (${source})`)
        // Add to registry so later CSVs can match against it
        addToRegistry(registry, row)
      }
    }
  }

  // Summary of plan
  console.log(`\n📋  Plan: ${plan.merges.length} merges, ${plan.inserts.length} inserts, ${plan.skipped.length} skipped`)

  if (plan.skipped.length > 0 && verbose) {
    console.log('\n  Skipped:')
    for (const s of plan.skipped) {
      console.log(`    • "${s.name}" — ${s.reason}`)
    }
  }

  if (dryRun) {
    console.log('\n✅  Dry run complete. Run without --dry-run to apply.')
    return
  }

  // Execute
  const results = await executePlan(plan, supabase)

  // Final summary
  console.log(`\n✅  Done: ${results.merged} merged, ${results.inserted} inserted, ${plan.skipped.length} skipped`)

  if (results.failed.length > 0) {
    console.error(`\n❌  ${results.failed.length} failures:`)
    for (const f of results.failed) {
      console.error(`    • [${f.operation}] "${f.name}" — ${f.error}`)
    }
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
