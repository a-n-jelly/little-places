import { STAGES } from './constants'

/** Short labels matching PlaceDetail vibe, without emoji — for list-row stage span pill. */
export const LIST_ROW_STAGE_LABEL = {
  baby: 'Baby',
  toddler: 'Toddler',
  preschool: 'Preschool',
  bigkids: 'Big Kids',
  tweens: 'Tweens+',
}

/** Single-line span from youngest→oldest in STAGES order (e.g. "Toddler–Big Kids"). */
export function formatStageSpan(stageIds) {
  if (!stageIds?.length) return null
  const order = STAGES.map(s => s.id)
  const valid = stageIds.filter(s => order.includes(s))
  if (!valid.length) return null
  const idx = valid.map(id => order.indexOf(id))
  const iMin = Math.min(...idx)
  const iMax = Math.max(...idx)
  const minId = STAGES[iMin].id
  const maxId = STAGES[iMax].id
  const a = LIST_ROW_STAGE_LABEL[minId] ?? minId
  const b = LIST_ROW_STAGE_LABEL[maxId] ?? maxId
  return iMin === iMax ? a : `${a}–${b}`
}

/** Prefer short highlights; Indoor Play venue type overrides feature scan. */
const STANDOUT_FEATURE_ORDER = [
  { match: id => id === 'stroller-friendly', short: 'Stroller' },
  { match: id => id === 'wheelchair', short: 'Accessible' },
  { match: id => id === 'sensory_friendly' || id === 'sensory-friendly', short: 'Sensory' },
  { match: id => id === 'free-entry', short: 'Free' },
  { match: id => id === 'changing-table', short: 'Changing' },
  { match: id => id === 'nursing-room', short: 'Nursing' },
  { match: id => id === 'hands-on-exhibits', short: 'Hands-on' },
  { match: id => id === 'storytime', short: 'Storytime' },
]

export function getStandoutFeatureShort(place) {
  if (place?.type === 'Indoor Play') return 'Indoor'
  const features = place?.child_friendly_features ?? []
  for (const { match, short } of STANDOUT_FEATURE_ORDER) {
    if (features.some(f => match(f))) return short
  }
  return null
}
