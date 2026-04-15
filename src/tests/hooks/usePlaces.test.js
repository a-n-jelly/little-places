import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePlaces } from '../../hooks/usePlaces'

const mockGetPlaces = vi.hoisted(() => vi.fn())

vi.mock('../../lib/places', () => ({
  getPlaces: mockGetPlaces,
  searchPlaces: vi.fn().mockResolvedValue([]),
}))

const seedPlaces = [
  { id: '1', name: 'Green Lake Park', type: 'Park' },
]

describe('usePlaces — T11 unhappy states', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets error state when getPlaces throws', async () => {
    mockGetPlaces.mockRejectedValueOnce(new Error('DB is down'))
    const { result } = renderHook(() => usePlaces())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('DB is down')
    expect(result.current.places).toEqual([])
  })

  it('retry via load() clears the error and reloads places', async () => {
    mockGetPlaces
      .mockRejectedValueOnce(new Error('DB is down'))
      .mockResolvedValueOnce(seedPlaces)

    const { result } = renderHook(() => usePlaces())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('DB is down')

    await act(async () => {
      result.current.load()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.places).toEqual(seedPlaces)
  })
})
