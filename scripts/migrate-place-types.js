#!/usr/bin/env node
/**
 * migrate-place-types.js
 *
 * Rule-based reclassification of all places to the expanded PLACE_TYPES
 * vocabulary introduced in T23. Matches against place name (case-insensitive).
 *
 * Rules are evaluated in order; first match wins.
 * Only places whose current type differs from the matched type are updated.
 *
 * Usage:
 *   node scripts/migrate-place-types.js [--dry-run] [--verbose]
 *
 * (reads SUPABASE_SERVICE_ROLE_KEY from .env)
 */

import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

const RULES = [
  { pattern: /\bzoo\b/i,                                        newType: 'Zoo'        },
  { pattern: /\baquarium\b/i,                                   newType: 'Aquarium'   },
  { pattern: /\bbeach\b/i,                                      newType: 'Beach'      },
  { pattern: /\bfarm\b/i,                                       newType: 'Farm'       },
  { pattern: /\bbakery\b|bakehouse|patisserie/i,                newType: 'Bakery'     },
  { pattern: /\bbrewery\b|\btaproom\b|\btavern\b|\bpub\b/i,    newType: 'Bar'        },
  { pattern: /\brestaurant\b/i,                                 newType: 'Restaurant' },
  { pattern: /\bkids?\s+gym\b|\bchildren'?s?\s+gym\b|\bjump\b|\btrampoline\b|\bgymnastics\b|\bsoft\s+play\b|\bindoor\s+play\b/i, newType: 'Indoor Play' },
]

function classify(name) {
  for (const { pattern, newType } of RULES) {
    if (pattern.test(name)) return newType
  }
  return null
}

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
    console.error(`Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  if (dryRun) console.log('DRY RUN — nothing will be written\n')

  const supabaseKey = dryRun
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY)
    : process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(process.env.VITE_SUPABASE_URL, supabaseKey)

  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, type')
    .order('name')

  if (error) {
    console.error(`Failed to fetch places: ${error.message}`)
    process.exit(1)
  }

  console.log(`Fetched ${places.length} places\n`)

  let changed = 0, skipped = 0, failed = 0

  for (const place of places) {
    const newType = classify(place.name)
    if (!newType || newType === place.type) {
      skipped++
      continue
    }

    if (dryRun || verbose) {
      console.log(`  ${dryRun ? '[DRY RUN] ' : ''}UPDATE "${place.name}": ${place.type} → ${newType}`)
    }

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from('places')
        .update({ type: newType })
        .eq('id', place.id)

      if (updateErr) {
        console.error(`  Failed to update "${place.name}": ${updateErr.message}`)
        failed++
        continue
      }
    }

    changed++
  }

  if (dryRun) {
    console.log(`\nDry run complete: ${changed} would be updated, ${skipped} unchanged`)
  } else {
    console.log(`\nDone: ${changed} updated, ${skipped} unchanged, ${failed} failed`)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
