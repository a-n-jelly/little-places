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

export const TYPE_COLORS = {
  // Outdoors
  Park:       '#16A34A',
  Playground: '#F97316',
  Beach:      '#16A34A',
  Farm:       '#16A34A',
  // Eating
  Café:       '#0D9488',
  Restaurant: '#0D9488',
  Bar:        '#0D9488',
  Bakery:     '#0D9488',
  // Culture
  Museum:     '#9333EA',
  Library:    '#0284C7',
  // Activities
  Attraction: '#7C2D12',
  Aquarium:   '#7C2D12',
  Zoo:        '#7C2D12',
  'Indoor Play': '#7C2D12',
  // Fallback
  Other:      '#94a3b8',
}

export const FEATURE_FILTER_CHIPS = [
  { id: 'stroller-friendly',  label: 'Stroller Friendly' },
  { id: 'high-chairs',        label: 'High Chairs'       },
  { id: 'hands-on-exhibits',  label: 'Hands-On Exhibits' },
  { id: 'storytime',          label: 'Storytime'         },
  { id: 'free-entry',         label: 'Free Entry'        },
]

export const CATEGORY_CHIPS = [
  { id: 'Park',       label: 'Parks',       emoji: '🌿' },
  { id: 'Café',       label: 'Cafes',       emoji: '☕' },
  { id: 'Museum',     label: 'Museums',     emoji: '🏛️' },
  { id: 'Playground', label: 'Playgrounds', emoji: '🛝' },
  { id: 'Attraction', label: 'Attractions', emoji: '⭐' },
  { id: 'Library',    label: 'Libraries',   emoji: '📚' },
]

export const CAT_CFG = {
  // Outdoors
  Park:       { emoji: '🌿', color: '#16A34A', lightColor: '#BBF7D0' },
  Playground: { emoji: '🛝', color: '#F97316', lightColor: '#FDBA74' },
  Beach:      { emoji: '🏖️', color: '#16A34A', lightColor: '#BBF7D0' },
  Farm:       { emoji: '🚜', color: '#16A34A', lightColor: '#BBF7D0' },
  // Eating
  Café:       { emoji: '☕', color: '#0D9488', lightColor: '#99F6E4' },
  Restaurant: { emoji: '🍽️', color: '#0D9488', lightColor: '#99F6E4' },
  Bar:        { emoji: '🍺', color: '#0D9488', lightColor: '#99F6E4' },
  Bakery:     { emoji: '🥐', color: '#0D9488', lightColor: '#99F6E4' },
  // Culture
  Museum:     { emoji: '🏛️', color: '#9333EA', lightColor: '#E9D5FF' },
  Library:    { emoji: '📚', color: '#0284C7', lightColor: '#7DD3FC' },
  // Activities
  Attraction: { emoji: '⭐', color: '#7C2D12', lightColor: '#FDBA74' },
  Aquarium:   { emoji: '🐟', color: '#7C2D12', lightColor: '#FDBA74' },
  Zoo:        { emoji: '🦁', color: '#7C2D12', lightColor: '#FDBA74' },
  'Indoor Play': { emoji: '🤸', color: '#7C2D12', lightColor: '#FDBA74' },
  // Fallback
  Other:      { emoji: '📍', color: '#94a3b8', lightColor: null },
}
