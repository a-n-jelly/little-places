import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SubmitPlaceForm from '../../components/SubmitPlaceForm'

// happy-dom's localStorage stub is incomplete — replace it with a working in-memory mock
const _lsData = {}
vi.stubGlobal('localStorage', {
  getItem: (key) => _lsData[key] ?? null,
  setItem: (key, val) => { _lsData[key] = String(val) },
  removeItem: (key) => { delete _lsData[key] },
})

/** Must stay in sync with `setTimeout(..., ms)` in `SubmitPlaceForm.jsx` venue search debounce. */
const VENUE_SEARCH_DEBOUNCE_MS = 400

const mockSubmitPlace = vi.hoisted(() => vi.fn())
const mockSubmitTip = vi.hoisted(() => vi.fn())

vi.mock('../../lib/places', () => ({
  submitPlace: mockSubmitPlace,
  submitTip: mockSubmitTip,
}))

const newPlace = { id: 'abc', name: 'Woodland Park Zoo', type: 'Park', address: '5500 Phinney Ave N' }

const mapboxSuggestResult = {
  suggestions: [{
    mapbox_id: 'poi.abc123',
    name: 'Woodland Park Zoo',
    place_formatted: '5500 Phinney Ave N, Seattle, WA',
    full_address: 'Woodland Park Zoo, 5500 Phinney Ave N, Seattle, WA',
  }]
}

const mapboxRetrieveResult = {
  features: [{
    geometry: { coordinates: [-122.3503, 47.6685] },
    properties: {
      name: 'Woodland Park Zoo',
      full_address: 'Woodland Park Zoo, 5500 Phinney Ave N, Seattle, WA',
      place_formatted: '5500 Phinney Ave N, Seattle, WA',
    }
  }]
}

function mockFetch(...responses) {
  const fetchMock = vi.fn()
  responses.forEach(r => fetchMock.mockResolvedValueOnce({ json: async () => r }))
  vi.stubGlobal('fetch', fetchMock)
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

/** Flush venue-search debounce under fake timers, then restore real timers for `waitFor`. */
async function fireVenueSearch(query) {
  vi.useFakeTimers()
  fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
    target: { value: query },
  })
  await act(async () => {
    vi.advanceTimersByTime(VENUE_SEARCH_DEBOUNCE_MS + 50)
  })
  vi.useRealTimers()
}

describe('SubmitPlaceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mockFetch({ suggestions: [] })
    Object.keys(_lsData).forEach(k => delete _lsData[k])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Submit (no venue selection) ─────────────────────────────────────────

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

  // ── Mapbox venue search + retrieve ───────────────────────────────────────

  it('selecting a venue from Mapbox Search Box populates lat and lng on submit', async () => {
    mockFetch(mapboxSuggestResult, mapboxRetrieveResult)
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    await fireVenueSearch('Woodland Park Zoo')
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })

    fireEvent.click(screen.getByRole('button', { name: /Woodland Park Zoo/ }))
    await waitFor(() => screen.getByText(/✓ Location found/))

    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))
    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))

    const submitted = mockSubmitPlace.mock.calls[0][0]
    expect(submitted.lat).toBeCloseTo(47.6685, 3)
    expect(submitted.lng).toBeCloseTo(-122.3503, 3)
  })

  it('submits without coordinates when Mapbox fetch fails', async () => {
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

  it('selecting a venue populates the address field', async () => {
    mockFetch(mapboxSuggestResult, mapboxRetrieveResult)
    render(<SubmitPlaceForm onSuccess={vi.fn()} />)

    await fireVenueSearch('Woodland Park Zoo')
    fireEvent.click(screen.getByRole('button', { name: /Woodland Park Zoo/ }))
    await waitFor(() => screen.getByText(/✓ Location found/))

    expect(screen.getByPlaceholderText(/auto-filled when you select a venue/i).value)
      .toBe('5500 Phinney Ave N, Seattle, WA')
  })

  it('selecting a venue pre-selects type when Mapbox category maps to a known type', async () => {
    const retrieveWithPark = {
      features: [{ geometry: { coordinates: [-122.3503, 47.6685] },
        properties: { name: 'Woodland Park Zoo',
          place_formatted: '5500 Phinney Ave N, Seattle, WA',
          poi_category_ids: ['park'] } }]
    }
    mockFetch(mapboxSuggestResult, retrieveWithPark)
    render(<SubmitPlaceForm onSuccess={vi.fn()} />)

    await fireVenueSearch('Woodland Park Zoo')
    fireEvent.click(screen.getByRole('button', { name: /Woodland Park Zoo/ }))
    await waitFor(() => screen.getByText(/✓ Location found/))

    expect(screen.getByRole('combobox').value).toBe('Park')
  })

  it('submits without coordinates when user types a name but selects no result', async () => {
    mockFetch(mapboxSuggestResult)
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

  // ── Tips + display name ──────────────────────────────────────────────────

  it('does not render a description field', () => {
    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    expect(screen.queryByLabelText(/description/i)).toBeNull()
  })

  it('renders a tips textarea', () => {
    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    expect(screen.getByPlaceholderText(/dedicated baby swing/i)).toBeTruthy()
  })

  it('pre-fills display name from localStorage', () => {
    localStorage.setItem('little-places-display-name', 'Mama Bear')
    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    expect(screen.getByPlaceholderText(/mama bear/i).value).toBe('Mama Bear')
  })

  it('calls submitTip after submitPlace when tip_text is provided', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)
    mockSubmitTip.mockResolvedValueOnce({})

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired()
    fireEvent.change(screen.getByPlaceholderText(/dedicated baby swing/i), {
      target: { value: 'Great swings for toddlers' },
    })
    fireEvent.change(screen.getByPlaceholderText(/mama bear/i), {
      target: { value: 'Dad of 2' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitTip).toHaveBeenCalledWith(
      newPlace.id,
      'Great swings for toddlers',
      'Dad of 2',
    ))
  })

  it('does not call submitTip when tip_text is empty', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))
    expect(mockSubmitTip).not.toHaveBeenCalled()
  })

  it('saves display_name to localStorage on submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)

    render(<SubmitPlaceForm onSuccess={vi.fn()} />)
    fillRequired()
    fireEvent.change(screen.getByPlaceholderText(/mama bear/i), {
      target: { value: 'Park Dad' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit place/i }))

    await waitFor(() => expect(mockSubmitPlace).toHaveBeenCalledTimes(1))
    expect(localStorage.getItem('little-places-display-name')).toBe('Park Dad')
  })
})
