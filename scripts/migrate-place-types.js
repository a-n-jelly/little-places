#!/usr/bin/env node
/**
 * migrate-place-types.js
 *
 * Re-types specific seed records to use the expanded PLACE_TYPES vocabulary
 * introduced in T23. Targets known records by name.
 *
 * Re-typings:
 *   "Woodland Park Zoo"              Attraction → Zoo
 *   "Seattle Aquarium"               Attraction → Aquarium
 *   "Alki Beach Park"                Park       → Beach
 *   "Oxbow Farm & Conservation Center" Attraction → Farm
 *
 * Usage:
 *   node scripts/migrate-place-types.js [--dry-run] [--verbose]
 *
 * (reads SUPABASE_SERVICE_ROLE_KEY from .env)
 */

import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const RETYPES = [
  { name: 'Woodland Park Zoo',               newType: 'Zoo'      },
  { name: 'Seattle Aquarium',                newType: 'Aquarium' },
  { name: 'Alki Beach Park',                 newType: 'Beach'    },
  { name: 'Oxbow Farm & Conservation Center', newType: 'Farm'    },
]

function parseCLI(argv) {
  const args = argv.slice(2)
  return {
    dryRun:  args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  }
}

async function main() {
  const { dryRun, verbose } = parseCLI(process.argv)

  const required = ['VITE_SUPABASE_URL']
  if (!dryRun) required.push('SUPABASE_SERVICE_ROLE_KEY')
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`❌  Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  if (dryRun) console.log('🔍  DRY RUN — nothing will be written\n')

  const supabaseKey = dryRun
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY)
    : process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(process.env.VITE_SUPABASE_URL, supabaseKey)

  let changed = 0, notFound = 0, failed = 0

  for (const { name, newType } of RETYPES) {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, type')
      .eq('name', name)
      .maybeSingle()

    if (error) {
      console.error(`❌  Query failed for "${name}": ${error.message}`)
      failed++
      continue
    }

    if (!data) {
      if (verbose || dryRun) console.log(`  ⚠️  Not found: "${name}"`)
      notFound++
      continue
    }

    if (data.type === newType) {
      if (verbose) console.log(`  ✓  Already "${newType}": "${name}"`)
      continue
    }

    if (dryRun || verbose) {
      console.log(`  ${dryRun ? '[DRY RUN] ' : ''}UPDATE "${name}": ${data.type} → ${newType}`)
    }

    changed++

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from('places')
        .update({ type: newType })
        .eq('id', data.id)

      if (updateErr) {
        console.error(`  ❌  Failed to update "${name}": ${updateErr.message}`)
        failed++
        changed--
      }
    }
  }

  if (dryRun) {
    console.log(`\n✅  Dry run: ${changed} would be updated, ${notFound} not found`)
  } else {
    console.log(`\n✅  Done: ${changed - failed} updated, ${notFound} not found, ${failed} failed`)
  }
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
