import { describe, it, expect } from 'vitest'
import { formatStageSpan, getStandoutFeatureShort } from '../../lib/placeListRow'

describe('formatStageSpan', () => {
  it('returns null for empty or invalid', () => {
    expect(formatStageSpan(null)).toBe(null)
    expect(formatStageSpan([])).toBe(null)
    expect(formatStageSpan(['unknown'])).toBe(null)
  })

  it('returns single label when one stage', () => {
    expect(formatStageSpan(['toddler'])).toBe('Toddler')
  })

  it('returns Youth span from baby to tweens', () => {
    expect(formatStageSpan(['baby', 'tweens'])).toBe('Baby–Tweens+')
  })

  it('uses min/max ignoring order passed in', () => {
    expect(formatStageSpan(['bigkids', 'toddler'])).toBe('Toddler–Big Kids')
  })
})

describe('getStandoutFeatureShort', () => {
  it('returns Indoor for Indoor Play type', () => {
    expect(getStandoutFeatureShort({ type: 'Indoor Play', child_friendly_features: [] })).toBe('Indoor')
  })

  it('returns first matched feature by priority', () => {
    expect(
      getStandoutFeatureShort({
        type: 'Park',
        child_friendly_features: ['free-entry', 'stroller-friendly'],
      }),
    ).toBe('Stroller')
  })

  it('handles sensory_friendly from seed data', () => {
    expect(
      getStandoutFeatureShort({
        type: 'Museum',
        child_friendly_features: ['sensory_friendly'],
      }),
    ).toBe('Sensory')
  })

  it('returns null when no standout', () => {
    expect(getStandoutFeatureShort({ type: 'Bar', child_friendly_features: [] })).toBe(null)
  })
})
