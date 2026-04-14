import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubmitPlaceForm from '../../components/SubmitPlaceForm'

const mockSubmitPlace = vi.hoisted(() => vi.fn())

vi.mock('../../lib/places', () => ({
  submitPlace: mockSubmitPlace,
}))

const newPlace = { id: 'abc', name: 'Woodland Park Zoo', type: 'Park', address: '5500 Phinney Ave N' }

const nominatimResult = [{
  place_id: 1,
  display_name: 'Woodland Park Zoo, Phinney Ave N, Seattle, WA, USA',
  lat: '47.6685',
  lon: '-122.3503',
}]

function mockFetch(response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: async () => response,
  }))
}

function mockFetchFailing() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
}

function fillRequired(nameValue = 'Test Place') {
  fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
    target: { value: nameValue },
  })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })
}

describe('SubmitPlaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: Nominatim returns nothing
    mockFetch([])
  })

  // ── T09: submit behaviour ────────────────────────────────────────────────

  it('calls onSuccess with the returned place on successful submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)
    const onSuccess = vi.fn()

    render(<SubmitPlaceForm onSuccess={onSuccess} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(newPlace))
  })

  it('resets the form after successful submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired('Some Place')
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    expect(screen.getByPlaceholderText(/search for a venue/i).value).toBe('')
    expect(screen.getByRole('combobox').value).toBe('')
  })

  it('shows an error message when submitPlace throws', async () => {
    mockSubmitPlace.mockRejectedValueOnce(new Error('Supabase is down'))

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => screen.getByText('Supabase is down'))
  })

  it('does not call onSuccess when submitPlace throws', async () => {
    mockSubmitPlace.mockRejectedValueOnce(new Error('Network error'))
    const onSuccess = vi.fn()

    render(<SubmitPlaceForm onSuccess={onSuccess} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => screen.getByText('Network error'))
    expect(onSuccess).not.toHaveBeenCalled()
  })

  // ── T10: geocoding ───────────────────────────────────────────────────────

  it('selecting a venue from Nominatim populates lat and lng on submit', async () => {
    mockFetch(nominatimResult)
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)

    // Type enough to trigger the debounced search
    fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
      target: { value: 'Woodland Park Zoo' },
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })

    // Wait for Nominatim results to appear and select one
    await waitFor(() => screen.getByText(/Woodland Park Zoo, Phinney Ave N/))
    fireEvent.click(screen.getByText(/Woodland Park Zoo, Phinney Ave N/))

    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    const submitted = mockSubmitPlace.mock.calls[0][0]
    expect(submitted.lat).toBeCloseTo(47.6685, 3)
    expect(submitted.lng).toBeCloseTo(-122.3503, 3)
  })

  it('submits without coordinates when Nominatim fetch fails', async () => {
    mockFetchFailing()
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired('Some Place')
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    const submitted = mockSubmitPlace.mock.calls[0][0]
    expect(submitted.lat).toBeNull()
    expect(submitted.lng).toBeNull()
  })

  it('submits without coordinates when user types a name but selects no result', async () => {
    mockFetch(nominatimResult)
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    // Type but don't click any result
    fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
      target: { value: 'Some obscure place' },
    })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    const submitted = mockSubmitPlace.mock.calls[0][0]
    expect(submitted.lat).toBeNull()
    expect(submitted.lng).toBeNull()
  })
})
