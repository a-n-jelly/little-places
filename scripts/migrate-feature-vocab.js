#!/usr/bin/env node
/**
 * migrate-feature-vocab.js
 *
 * Remaps child_friendly_features values in Supabase to the unified FEATURE_VOCAB.
 * Also moves accessibility tags out of child_friendly_features into accessibility_features.
 *
 * Renames:
 *   stroller-friendly → stroller-accessible
 *
 * Removes from child_friendly_features (were accessibility tags, now dormant):
 *   wheelchair, changing_places, sensory_friendly, autism_friendly, quiet_space, blue_badge
 *
 * No AI calls — string remapping only.
 *
 * Usage:
 *   node scripts/migrate-feature-vocab.js [--dry-run] [--verbose]
 *
 * (reads SUPABASE_SERVICE_ROLE_KEY from .env)
 */

import 'dotenv/config.js'
import { createClient } from '@supabase/supabase-js'

// ── Remap rules ───────────────────────────────────────────────────────────────

const RENAME = {
  'stroller-accessible':    'stroller-friendly',
  'pram-accessible':        'stroller-friendly',
  'Pram Accessible':        'stroller-friendly',
  'High Chairs':            'high-chairs',
  'Soft Play':              'soft-play',
  'Nursing Area':           'nursing-room',
  'Changing Facilities':    'changing-table',
  'Free Entry':             'free-entry',
  'Café On Site':           'cafe-on-site',
  'Fenced Area':            'enclosed-outdoor-space',
  'Enclosed Outdoor Space': 'enclosed-outdoor-space',
  'fenced':                 'enclosed-outdoor-space',
  'Sensory Sessions':       'sensory-sessions',
}

// Accessibility tags that may exist in child_friendly_features — drop them (no data, dormant)
const ACCESSIBILITY_TAGS = new Set([
  'wheelchair', 'changing_places', 'sensory_friendly', 'autism_friendly', 'quiet_space', 'blue_badge',
])

function remapFeatures(features) {
  if (!Array.isArray(features)) return { features: [] }

  const remapped = features
    .filter((f) => !ACCESSIBILITY_TAGS.has(f))
    .map((f) => RENAME[f] ?? f)

  return { features: [...new Set(remapped)] }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function parseCLI(argv) {
  const args = argv.slice(2)
  return {
    dryRun:  args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

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

  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, child_friendly_features')
    .not('child_friendly_features', 'eq', '{}')

  if (error) {
    console.error(`❌  Failed to load places: ${error.message}`)
    process.exit(1)
  }

  console.log(`📂  Loaded ${places.length} places with features`)

  let changed = 0, unchanged = 0, failed = 0

  for (const place of places) {
    const original = place.child_friendly_features ?? []
    const { features } = remapFeatures(original)

    const featuresChanged = JSON.stringify(original.slice().sort()) !== JSON.stringify(features.slice().sort())

    if (!featuresChanged) {
      unchanged++
      continue
    }

    if (verbose || dryRun) {
      console.log(`  ${dryRun ? '[DRY RUN] ' : ''}UPDATE "${place.name}"`)
      console.log(`    features: ${JSON.stringify(original)} → ${JSON.stringify(features)}`)
    }

    changed++

    if (!dryRun) {
      const update = { child_friendly_features: features }

      const { error: updateErr } = await supabase
        .from('places')
        .update(update)
        .eq('id', place.id)

      if (updateErr) {
        console.error(`  ❌  Failed to update "${place.name}" — ${updateErr.message}`)
        failed++
      }
    }
  }

  if (dryRun) {
    console.log(`\n✅  Dry run: ${changed} would be updated, ${unchanged} already clean`)
  } else {
    console.log(`\n✅  Done: ${changed - failed} updated, ${unchanged} already clean, ${failed} failed`)
  }
}

main().catch((err) => {
  console.error('❌ ', err.message)
  process.exit(1)
})
