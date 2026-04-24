export const STAGES = [
  { id: 'baby',      label: '👶 Baby',      range: '0–12m' },
  { id: 'toddler',   label: '🧒 Toddler',   range: '1–3y'  },
  { id: 'preschool', label: '🎨 Preschool', range: '3–5y'  },
  { id: 'bigkids',   label: '🧗 Big Kids',  range: '5–8y'  },
  { id: 'tweens',    label: '🎮 Tweens+',   range: '8–12y' },
]

// Dormant — no data yet, not wired to UI or agent
export const ACCESSIBILITY_TAGS = [
  { id: 'wheelchair',       label: '♿ Wheelchair Accessible' },
  { id: 'changing_places',  label: '🚿 Changing Places'       },
  { id: 'sensory_friendly', label: '🌿 Sensory Friendly'      },
  { id: 'autism_friendly',  label: '💙 Autism Friendly'       },
  { id: 'quiet_space',      label: '🤫 Quiet Space'           },
  { id: 'blue_badge',       label: '🅿️ Blue Badge Parking'   },
]

export const FEATURE_VOCAB = {
  Playground: [
    'climbing', 'swings', 'splash-pad', 'baby-swings', 'enclosed-outdoor-space',
    'accessible-equipment', 'sand-pit', 'nature-play', 'skate-park',
  ],
  Park: [
    'paved-paths', 'shade', 'restrooms-nearby', 'stroller-friendly',
    'beach-access', 'easy-grade', 'picnic-area', 'swimming',
    'splash-pad', 'enclosed-outdoor-space', 'nature-play',
  ],
  Beach: [
    'stroller-friendly', 'restrooms-nearby', 'shade', 'picnic-area',
    'swimming', 'enclosed-outdoor-space', 'paved-paths', 'free-entry',
  ],
  Farm: [
    'stroller-friendly', 'restrooms-nearby', 'picnic-area', 'paved-paths',
    'enclosed-outdoor-space', 'free-entry', 'nature-play',
  ],
  'Café': [
    'high-chairs', 'kids-menu', 'booster-seats', 'changing-table',
    'stroller-friendly', 'outdoor-seating', 'crayons-activities',
    'noise-tolerant', 'kids-eat-free', 'nursing-room',
  ],
  Restaurant: [
    'high-chairs', 'kids-menu', 'booster-seats', 'changing-table',
    'stroller-friendly', 'outdoor-seating', 'crayons-activities',
    'noise-tolerant', 'kids-eat-free', 'nursing-room',
  ],
  Bar: [
    'high-chairs', 'kids-menu', 'outdoor-seating', 'stroller-friendly', 'noise-tolerant',
  ],
  Bakery: [
    'high-chairs', 'kids-menu', 'outdoor-seating', 'stroller-friendly', 'changing-table',
  ],
  Museum: [
    'hands-on-exhibits', 'kids-programs', 'stroller-friendly',
    'nursing-room', 'interactive-displays', 'family-discount',
    'free-entry', 'sensory-friendly', 'cafe-on-site',
  ],
  Library: [
    'storytime', 'kids-section', 'quiet-room', 'family-events',
    'free-entry', 'reading-programs', 'maker-space', 'multilingual',
    'cafe-on-site', 'sensory-sessions',
  ],
  Attraction: [
    'soft-play', 'age-sections', 'cafe-on-site', 'party-rooms',
    'sensory-friendly', 'toddler-sessions', 'adult-seating',
    'socks-required', 'hands-on-exhibits', 'stroller-friendly',
    'family-discount', 'free-entry', 'nursing-room', 'sensory-sessions',
  ],
  Aquarium: [
    'hands-on-exhibits', 'stroller-friendly', 'family-discount', 'free-entry',
    'nursing-room', 'kids-programs', 'interactive-displays', 'cafe-on-site', 'changing-table',
  ],
  Zoo: [
    'stroller-friendly', 'family-discount', 'free-entry', 'nursing-room',
    'kids-programs', 'paved-paths', 'picnic-area', 'cafe-on-site', 'changing-table',
  ],
  'Indoor Play': [
    'stroller-friendly', 'kids-programs', 'family-discount', 'nursing-room',
    'age-sections', 'changing-table', 'adult-seating', 'soft-play',
  ],
  Other: [
    'stroller-friendly', 'family-friendly', 'kids-welcome',
    'changing-table', 'free-entry', 'high-chairs', 'soft-play', 'nursing-room',
  ],
}

export const PLACE_TYPES = [
  'Park',
  'Playground',
  'Beach',
  'Farm',
  'Café',
  'Restaurant',
  'Bar',
  'Bakery',
  'Museum',
  'Library',
  'Attraction',
  'Aquarium',
  'Zoo',
  'Indoor Play',
  'Other',
]

export const TYPE_GROUPS = {
  Outdoors:   ['Park', 'Playground', 'Beach', 'Farm'],
  Eating:     ['Café', 'Restaurant', 'Bar', 'Bakery'],
  Culture:    ['Museum', 'Library'],
  Activities: ['Attraction', 'Aquarium', 'Zoo', 'Indoor Play'],
}

/**
 * Maps each `place.type` to a `theme.css` `--cat-*` bucket (T26 — single source of truth for hexes).
 * Colours live only in `theme.css`; consumers use `placeTypeColorVar()` / `placeTypeCategoryVarName()`.
 */
const PLACE_TYPE_CAT = {
  Park: 'parks',
  Playground: 'playgrounds',
  Beach: 'nature',
  Farm: 'nature',
  Café: 'cafes',
  Restaurant: 'cafes',
  Bar: 'cafes',
  Bakery: 'cafes',
  Museum: 'museums',
  Library: 'libraries',
  Attraction: 'attractions',
  Aquarium: 'attractions',
  Zoo: 'attractions',
  'Indoor Play': 'indoor-play',
}

/** @param {string | undefined} placeType */
export function placeTypeCategoryVarName(placeType) {
  const cat = PLACE_TYPE_CAT[placeType]
  if (!cat) return '--cat-other'
  return `--cat-${cat}`
}

/** @param {string | undefined} placeType */
export function placeTypeColorVar(placeType) {
  return `var(${placeTypeCategoryVarName(placeType)})`
}

/**
 * Soft tinted surface for list/detail emoji tiles — reads category from tokens.
 * @param {string | undefined} placeType
 * @param {string} mix e.g. '22%'
 */
export function placeTypeIconSurface(placeType, mix = '22%') {
  return `color-mix(in srgb, ${placeTypeColorVar(placeType)} ${mix}, var(--card))`
}

export const FEATURE_FILTER_CHIPS = [
  { id: 'stroller-friendly',  label: 'Stroller Friendly' },
  { id: 'high-chairs',        label: 'High Chairs'       },
  { id: 'hands-on-exhibits',  label: 'Hands-On Exhibits' },
  { id: 'storytime',          label: 'Storytime'         },
  { id: 'free-entry',         label: 'Free Entry'        },
]


/** Emoji only — colours come from `placeTypeColorVar(place.type)` (theme.css `--cat-*`). */
export const CAT_CFG = {
  Park:       { emoji: '🌿' },
  Playground: { emoji: '🛝' },
  Beach:      { emoji: '🏖️' },
  Farm:       { emoji: '🚜' },
  Café:       { emoji: '☕' },
  Restaurant: { emoji: '🍽️' },
  Bar:        { emoji: '🍺' },
  Bakery:     { emoji: '🥐' },
  Museum:     { emoji: '🏛️' },
  Library:    { emoji: '📚' },
  Attraction: { emoji: '⭐' },
  Aquarium:   { emoji: '🐟' },
  Zoo:        { emoji: '🦁' },
  'Indoor Play': { emoji: '🤸' },
  Other:      { emoji: '📍' },
}
