import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitTip, getTipsForPlace } from '../../lib/places'

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('../../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

// Builds a chainable mock query whose terminal call resolves with `result`.
// select/insert/eq/order all return `this`; single() resolves directly.
// The object itself is a thenable so await-ing the chain (without .single()) also works.
function makeChain(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return chain
}

// ── submitTip ────────────────────────────────────────────────────────────────

describe('submitTip', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts a tip row and returns it', async () => {
    const tip = { id: 'tip-1', place_id: 'place-1', tip_text: 'Great swings', display_name: 'Mama Bear', created_at: '2026-04-23' }
    mockFrom.mockReturnValue(makeChain({ data: tip, error: null }))

    const result = await submitTip('place-1', 'Great swings', 'Mama Bear')

    expect(mockFrom).toHaveBeenCalledWith('tips')
    expect(result).toEqual(tip)
  })

  it('sends null display_name when display_name is an empty string', async () => {
    const chain = makeChain({ data: { id: 'tip-2' }, error: null })
    mockFrom.mockReturnValue(chain)

    await submitTip('place-1', 'Nice spot', '')

    expect(chain.insert).toHaveBeenCalledWith([
      expect.objectContaining({ display_name: null }),
    ])
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Insert failed' } }))
    await expect(submitTip('place-1', 'Nice', 'X')).rejects.toBeTruthy()
  })
})

// ── getTipsForPlace ───────────────────────────────────────────────────────────

describe('getTipsForPlace', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns tips for a place', async () => {
    const tips = [
      { id: 't2', tip_text: 'Great slides', display_name: 'Dad of 2', created_at: '2026-04-22' },
      { id: 't1', tip_text: 'Bring snacks', display_name: null, created_at: '2026-04-21' },
    ]
    mockFrom.mockReturnValue(makeChain({ data: tips, error: null }))

    const result = await getTipsForPlace('place-1')

    expect(mockFrom).toHaveBeenCalledWith('tips')
    expect(result).toEqual(tips)
  })

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))
    const result = await getTipsForPlace('place-1')
    expect(result).toEqual([])
  })

  it('throws when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Query failed' } }))
    await expect(getTipsForPlace('place-1')).rejects.toBeTruthy()
  })
})
