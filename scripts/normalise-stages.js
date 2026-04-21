#!/usr/bin/env node
/**
 * normalise-stages.js
 *
 * Finds all places in Supabase with legacy stage values and replaces them
 * with the canonical vocabulary.
 *
 * Mappings:
 *   infant    → baby
 *   school-age → bigkids, tweens
 *   all-ages  → baby, toddler, preschool, bigkids, tweens
 *
 * Usage:
 *   node scripts/normalise-stages.js           # dry run (default)
 *   node scripts/normalise-stages.js --apply   # write to Supabase
 */

import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')

const LEGACY_MAP = {
  'infant':     ['baby'],
  'school-age': ['bigkids', 'tweens'],
  'all-ages':   ['baby', 'toddler', 'preschool', 'bigkids', 'tweens'],
}

const LEGACY_KEYS = Object.keys(LEGACY_MAP)

function normalise(stages) {
  const result = new Set()
  for (const s of stages) {
    if (LEGACY_MAP[s]) LEGACY_MAP[s].forEach((v) => result.add(v))
    else result.add(s)
  }
  return [...result]
}

async function main() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('places')
    .select('id, name, stages')

  if (error) { console.error('❌ ', error.message); process.exit(1) }

  const toFix = data.filter((p) =>
    p.stages?.some((s) => LEGACY_KEYS.includes(s))
  )

  console.log(`Found ${toFix.length} places with legacy stage values (out of ${data.length} total)\n`)

  if (!APPLY) {
    toFix.slice(0, 15).forEach((p) => {
      console.log(`  ${p.name}`)
      console.log(`    before: [${p.stages.join(', ')}]`)
      console.log(`    after:  [${normalise(p.stages).join(', ')}]`)
    })
    if (toFix.length > 15) console.log(`  … and ${toFix.length - 15} more`)
    console.log('\nRun with --apply to write to Supabase.')
    return
  }

  let updated = 0
  let errors = 0

  for (const place of toFix) {
    const { error: err } = await supabase
      .from('places')
      .update({ stages: normalise(place.stages) })
      .eq('id', place.id)

    if (err) { console.warn(`  ⚠️  ${place.name}: ${err.message}`); errors++ }
    else updated++
  }

  console.log(`✅  ${updated} places updated, ${errors} errors`)
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
