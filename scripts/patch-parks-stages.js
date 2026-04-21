#!/usr/bin/env node
/**
 * patch-parks-stages.js
 *
 * Reads output/parks/play_areas_import.csv, derives stages from source-age tags,
 * and patches the stages column in Supabase for matching parks.
 *
 * Mapping (minimum age → stages):
 *   source-age:2 → toddler, preschool, bigkids, tweens
 *   source-age:5 → bigkids, tweens
 *
 * Usage:
 *   node scripts/patch-parks-stages.js           # dry run (default)
 *   node scripts/patch-parks-stages.js --apply   # write to Supabase
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const APPLY = process.argv.includes('--apply')

// Stage boundaries: minimum age (years) → stages from that age up
const AGE_TO_STAGES = {
  2: ['toddler', 'preschool', 'bigkids', 'tweens'],
  5: ['bigkids', 'tweens'],
}

// ── CSV parse ─────────────────────────────────────────────────────────────────

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
    const values = splitCsvRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

// ── Stage derivation ──────────────────────────────────────────────────────────

function deriveStages(tagsStr) {
  const tags = tagsStr.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim())
  const ages = tags
    .filter((t) => t.startsWith('source-age:'))
    .map((t) => parseInt(t.replace('source-age:', ''), 10))
    .filter((n) => !isNaN(n))

  if (!ages.length) return null

  const minAge = Math.min(...ages)
  return AGE_TO_STAGES[minAge] ?? AGE_TO_STAGES[2]
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(ROOT, 'output', 'parks', 'play_areas_import.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('❌  play_areas_import.csv not found')
    process.exit(1)
  }

  const places = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  console.log(`📂  Loaded ${places.length} parks from CSV`)

  const patches = []
  let skipped = 0

  for (const row of places) {
    const stages = deriveStages(row.tags ?? '')
    if (!stages) { skipped++; continue }
    patches.push({ name: row.name, stages })
  }

  console.log(`✅  ${patches.length} parks with stages to patch, ${skipped} skipped (no source-age tag)`)
  console.log()

  if (!APPLY) {
    console.log('DRY RUN — first 10 patches:')
    patches.slice(0, 10).forEach((p) => console.log(`  ${p.name} → [${p.stages.join(', ')}]`))
    console.log('\nRun with --apply to write to Supabase.')
    return
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let updated = 0
  let errors = 0

  for (const { name, stages } of patches) {
    const { error } = await supabase
      .from('places')
      .update({ stages })
      .eq('name', name)

    if (error) {
      console.warn(`  ⚠️  ${name}: ${error.message}`)
      errors++
    } else {
      updated++
    }
  }

  console.log(`\n✅  ${updated} parks updated, ${errors} errors`)
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
