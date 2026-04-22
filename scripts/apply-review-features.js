#!/usr/bin/env node
/**
 * apply-review-features.js
 *
 * Reads review_features.csv and unions the extracted features into
 * existing Supabase records. Matches by normalised name.
 *
 * Usage:
 *   node scripts/apply-review-features.js [--dry-run] [--verbose]
 *
 * (reads SUPABASE_SERVICE_ROLE_KEY from .env)
 *
 * Input: output/enriched/review_features.csv
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const INPUT_PATH = path.join(ROOT, 'output', 'enriched', 'review_features.csv')

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseCLI(argv) {
  const args = argv.slice(2)
  return {
    dryRun:  args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  }
}

// ── Env ───────────────────────────────────────────────────────────────────────

function validateEnv(dryRun) {
  const required = ['VITE_SUPABASE_URL']
  if (!dryRun) required.push('SUPABASE_SERVICE_ROLE_KEY')
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`❌  Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
}

// ── CSV ───────────────────────────────────────────────────────────────────────

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

// ── Name normalisation (mirrors import-to-supabase.js) ────────────────────────

const TYPE_SUFFIXES = /\s*(playground|park|playfield|play area|garden|center|centre|library|museum|cafe|café)\s*$/i

function normaliseName(name) {
  return name
    .toLowerCase()
    .replace(TYPE_SUFFIXES, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Array union ───────────────────────────────────────────────────────────────

function unionArrays(...arrays) {
  return [...new Set(arrays.flat().filter(Boolean))]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { dryRun, verbose } = parseCLI(process.argv)
  validateEnv(dryRun)

  if (dryRun) console.log('🔍  DRY RUN — nothing will be written\n')

  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌  Input not found: ${INPUT_PATH}`)
    console.error('   Run extract-features-from-reviews.js first.')
    process.exit(1)
  }

  const supabaseKey = dryRun
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY)
    : process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(process.env.VITE_SUPABASE_URL, supabaseKey)

  // Load review features
  const reviewRows = parseCsv(fs.readFileSync(INPUT_PATH, 'utf8'))
  console.log(`📂  Loaded ${reviewRows.length} rows from review_features.csv`)

  // Filter to rows that actually have something to add
  const toApply = reviewRows.filter((r) => {
    try {
      return JSON.parse(r.additional_features ?? '[]').length > 0
    } catch { return false }
  })

  console.log(`   ${toApply.length} rows have features to apply`)

  if (toApply.length === 0) {
    console.log('   Nothing to do.')
    return
  }

  console.log('📡  Loading existing records from Supabase…')
  const { data: existing, error } = await supabase
    .from('places')
    .select('id, name, child_friendly_features')

  if (error) {
    console.error(`❌  Failed to load places: ${error.message}`)
    process.exit(1)
  }
  console.log(`   Found ${existing.length} records`)

  // Build name → record map
  const byName = new Map()
  for (const record of existing) {
    byName.set(normaliseName(record.name), record)
  }

  // Match and build update plan
  let matched = 0, unmatched = 0, updated = 0, failed = 0

  for (const row of toApply) {
    const key    = normaliseName(row.name)
    const record = byName.get(key)

    if (!record) {
      if (verbose) console.log(`  ⚠️  No match for "${row.name}" (normalised: "${key}")`)
      unmatched++
      continue
    }

    let additionalFeatures
    try {
      additionalFeatures = JSON.parse(row.additional_features ?? '[]')
    } catch {
      if (verbose) console.log(`  ⚠️  Bad JSON for "${row.name}" — skipping`)
      continue
    }

    const mergedFeatures  = unionArrays(record.child_friendly_features ?? [], additionalFeatures)
    const newFeatureCount = mergedFeatures.length - (record.child_friendly_features ?? []).length

    if (newFeatureCount === 0) {
      if (verbose) console.log(`  ✓  "${record.name}" — already has all features`)
      matched++
      continue
    }

    if (verbose || dryRun) {
      console.log(`  ${dryRun ? '[DRY RUN] ' : ''}UPDATE "${record.name}" — +${newFeatureCount} features: ${additionalFeatures.join(', ')}`)
    }

    matched++

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from('places')
        .update({
          child_friendly_features: mergedFeatures,
          embedding_status:        'pending',
        })
        .eq('id', record.id)

      if (updateErr) {
        console.error(`  ❌  Failed to update "${record.name}" — ${updateErr.message}`)
        failed++
      } else {
        updated++
      }
    }
  }

  // Summary
  if (dryRun) {
    console.log(`\n✅  Dry run complete: ${matched} would be updated, ${unmatched} unmatched`)
  } else {
    console.log(`\n✅  Done: ${updated} updated, ${unmatched} unmatched, ${failed} failed`)
  }


  if (unmatched > 0 && !verbose) {
    console.log(`   Run with --verbose to see which names didn't match`)
  }
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
