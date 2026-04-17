import { describe, it, expect } from 'vitest'

// Pure filtering logic extracted so it can be tested without React
function filterPlaces(places, { search = '', stages = [], access = [] }) {
  let results = places

  if (search.trim()) {
    const q = search.toLowerCase()
    results = results.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (stages.length > 0) {
    results = results.filter((p) => stages.some((s) => p.stages?.includes(s)))
  }

  if (access.length > 0) {
    results = results.filter((p) => access.every((a) => p.child_friendly_features?.includes(a)))
  }

  return results
}

const PLACES = [
  {
    id: 1,
    name: 'Green Lake Park',
    type: 'Park',
    description: 'Beautiful lake with pram-friendly paths.',
    stages: ['toddler', 'preschool'],
    child_friendly_features: ['wheelchair', 'blue_badge'],
    tags: ['Pram Accessible', 'Free Entry'],
  },
  {
    id: 2,
    name: 'Seattle Children\'s Museum',
    type: 'Museum',
    description: 'Hands-on exhibits for young children.',
    stages: ['baby', 'toddler'],
    child_friendly_features: ['wheelchair', 'sensory_friendly', 'autism_friendly'],
    tags: ['Soft Play', 'Nursing Area'],
  },
  {
    id: 3,
    name: 'Ballard Commons Park',
    type: 'Park',
    description: 'Splash pad and great playground.',
    stages: ['toddler', 'bigkids'],
    child_friendly_features: ['wheelchair'],
    tags: ['Free Entry', 'Fenced Area'],
  },
]

describe('filterPlaces', () => {
  it('returns all places when no filters applied', () => {
    expect(filterPlaces(PLACES, {})).toHaveLength(3)
  })

  it('filters by name search', () => {
    const results = filterPlaces(PLACES, { search: 'Green Lake' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Green Lake Park')
  })

  it('filters by description keyword', () => {
    const results = filterPlaces(PLACES, { search: 'splash' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Ballard Commons Park')
  })

  it('filters by type', () => {
    const results = filterPlaces(PLACES, { search: 'museum' })
    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('Museum')
  })

  it('filters by tag', () => {
    const results = filterPlaces(PLACES, { search: 'soft play' })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Seattle Children's Museum")
  })

  it('returns empty array when no keyword matches', () => {
    const results = filterPlaces(PLACES, { search: 'xyznotfound' })
    expect(results).toHaveLength(0)
  })

  it('filters by single stage', () => {
    const results = filterPlaces(PLACES, { stages: ['baby'] })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Seattle Children's Museum")
  })

  it('filters by multiple stages (OR logic)', () => {
    const results = filterPlaces(PLACES, { stages: ['baby', 'bigkids'] })
    expect(results).toHaveLength(2)
  })

  it('filters by single child_friendly_features tag', () => {
    const results = filterPlaces(PLACES, { access: ['sensory_friendly'] })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Seattle Children's Museum")
  })

  it('filters by multiple child_friendly_features tags (AND logic)', () => {
    const results = filterPlaces(PLACES, { access: ['wheelchair', 'autism_friendly'] })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("Seattle Children's Museum")
  })

  it('combines search and stage filter', () => {
    const results = filterPlaces(PLACES, { search: 'park', stages: ['bigkids'] })
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Ballard Commons Park')
  })

  it('returns empty when filters are too restrictive', () => {
    const results = filterPlaces(PLACES, { stages: ['baby'], access: ['blue_badge'] })
    expect(results).toHaveLength(0)
  })

  it('is case insensitive', () => {
    const results = filterPlaces(PLACES, { search: 'GREEN LAKE' })
    expect(results).toHaveLength(1)
  })
})
