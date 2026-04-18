export const STAGES = [
  { id: 'baby',      label: '👶 Baby',      range: '0–12m' },
  { id: 'toddler',   label: '🧒 Toddler',   range: '1–3y'  },
  { id: 'preschool', label: '🎨 Preschool', range: '3–5y'  },
  { id: 'bigkids',   label: '🧗 Big Kids',  range: '5–8y'  },
  { id: 'tweens',    label: '🎮 Tweens+',   range: '8–12y' },
]

export const ACCESSIBILITY_TAGS = [
  { id: 'wheelchair',      label: '♿ Wheelchair Accessible' },
  { id: 'changing_places', label: '🚿 Changing Places'       },
  { id: 'sensory_friendly',label: '🌿 Sensory Friendly'      },
  { id: 'autism_friendly', label: '💙 Autism Friendly'       },
  { id: 'quiet_space',     label: '🤫 Quiet Space'           },
  { id: 'blue_badge',      label: '🅿️ Blue Badge Parking'   },
]

export const PLACE_TAGS = [
  'High Chairs',
  'Pram Accessible',
  'Enclosed Outdoor Space',
  'Soft Play',
  'Nursing Area',
  'Changing Facilities',
  'Free Entry',
  'Café On Site',
  'Fenced Area',
  'Sensory Sessions',
]

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
  Park:       '#4ade80',
  Café:       '#fb923c',
  Museum:     '#a78bfa',
  Attraction: '#38bdf8',
  Library:    '#f472b6',
  Playground: '#facc15',
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
  Park:       { emoji: '🌿', color: '#4ade80' },
  Café:       { emoji: '☕', color: '#fb923c' },
  Museum:     { emoji: '🏛️', color: '#a78bfa' },
  Attraction: { emoji: '⭐', color: '#38bdf8' },
  Library:    { emoji: '📚', color: '#f472b6' },
  Playground: { emoji: '🛝', color: '#facc15' },
  Other:      { emoji: '📍', color: '#94a3b8' },
}
