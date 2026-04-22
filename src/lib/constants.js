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
  'Café': [
    'high-chairs', 'kids-menu', 'booster-seats', 'changing-table',
    'stroller-friendly', 'outdoor-seating', 'crayons-activities',
    'noise-tolerant', 'kids-eat-free', 'nursing-room',
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
  Other: [
    'stroller-friendly', 'family-friendly', 'kids-welcome',
    'changing-table', 'free-entry', 'high-chairs', 'soft-play', 'nursing-room',
  ],
}

export const PLACE_TYPES = [
  'Park',
  'Café',
  'Museum',
  'Attraction',
  'Library',
  'Playground',
  'Other',
]

export const TYPE_COLORS = {
  Park:       '#16A34A',
  Café:       '#0D9488',
  Museum:     '#9333EA',
  Attraction: '#7C2D12',
  Library:    '#0284C7',
  Playground: '#F97316',
  Other:      '#94a3b8',
}

export const CATEGORY_CHIPS = [
  { id: 'Park',       label: 'Parks',       emoji: '🌿' },
  { id: 'Café',       label: 'Cafes',       emoji: '☕' },
  { id: 'Museum',     label: 'Museums',     emoji: '🏛️' },
  { id: 'Playground', label: 'Playgrounds', emoji: '🛝' },
  { id: 'Attraction', label: 'Attractions', emoji: '⭐' },
  { id: 'Library',    label: 'Libraries',   emoji: '📚' },
]

export const CAT_CFG = {
  Park:       { emoji: '🌿', color: '#16A34A', lightColor: '#BBF7D0' },
  Café:       { emoji: '☕', color: '#0D9488', lightColor: '#99F6E4' },
  Museum:     { emoji: '🏛️', color: '#9333EA', lightColor: '#E9D5FF' },
  Attraction: { emoji: '⭐', color: '#7C2D12', lightColor: '#FDBA74' },
  Library:    { emoji: '📚', color: '#0284C7', lightColor: '#7DD3FC' },
  Playground: { emoji: '🛝', color: '#F97316', lightColor: '#FDBA74' },
  Other:      { emoji: '📍', color: '#94a3b8', lightColor: null },
}
