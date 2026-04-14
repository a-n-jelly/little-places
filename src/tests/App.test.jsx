import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

// ── Dependency mocks ────────────────────────────────────────────────────────

const mockGetPlaces = vi.hoisted(() => vi.fn())
const mockSubmitPlace = vi.hoisted(() => vi.fn())

vi.mock('../lib/places', () => ({
  getPlaces: mockGetPlaces,
  submitPlace: mockSubmitPlace,
  searchPlaces: vi.fn().mockResolvedValue([]),
}))

// Silence the Anthropic SDK in App tests — AgentPanel is not under test here
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: vi.fn() } }
  }),
}))

// MapView uses react-map-gl which requires a WebGL context
vi.mock('../components/MapView', () => ({
  default: () => <div data-testid="map-view" />,
}))

// vaul Drawer uses portals and ResizeObserver — render children inline
vi.mock('vaul', () => ({
  Drawer: {
    Root: ({ children, open }) => (open ? <div>{children}</div> : null),
    Portal: ({ children }) => <div>{children}</div>,
    Overlay: () => null,
    Content: ({ children }) => <div>{children}</div>,
    Title: ({ children }) => <span>{children}</span>,
    Description: ({ children }) => <span>{children}</span>,
  },
}))

// Nominatim fetch — silence during submit tests
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => [] }))

// ── Fixtures ────────────────────────────────────────────────────────────────

const seedPlaces = [
  { id: '1', name: 'Green Lake Park', type: 'Park', address: '7201 E Green Lake Dr N', description: 'Great lake loop.', stages: [], accessibility: [], tags: [], rating: 0 },
]

const newPlace = {
  id: '2', name: 'Woodland Park Zoo', type: 'Park', address: '5500 Phinney Ave N', description: 'Amazing zoo.', stages: [], accessibility: [], tags: [], rating: 0,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function navigateToBrowse() {
  fireEvent.click(screen.getByRole('button', { name: /browse the map/i }))
}

function openSubmitSheet() {
  // Both desktop and mobile FABs are in the DOM simultaneously — grab the first
  fireEvent.click(screen.getAllByRole('button', { name: /add a place/i })[0])
}

function fillAndSubmitForm(name = 'Woodland Park Zoo') {
  fireEvent.change(screen.getByPlaceholderText(/search for a venue/i), {
    target: { value: name },
  })
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Park' } })
  fireEvent.click(screen.getByRole('button', { name: /submit place/i }))
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('App — T09 submission flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPlaces.mockResolvedValue(seedPlaces)
  })

  it('app opens on AgentPanel', () => {
    render(<App />)
    expect(screen.getByRole('textbox')).toBeInTheDocument() // agent input
    expect(screen.queryByTestId('map-view')).not.toBeInTheDocument()
  })

  it('submitting a place adds it to the top of the list in browse view', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)
    render(<App />)

    // Wait for initial places to load
    await waitFor(() => expect(mockGetPlaces).toHaveBeenCalledTimes(1))

    navigateToBrowse()
    openSubmitSheet()
    fillAndSubmitForm('Woodland Park Zoo')

    await waitFor(() =>
      expect(screen.getByText('Woodland Park Zoo')).toBeInTheDocument()
    )

    // Original place still present
    expect(screen.getByText('Green Lake Park')).toBeInTheDocument()
  })

  it('sheet closes after a successful submit', async () => {
    mockSubmitPlace.mockResolvedValueOnce(newPlace)
    render(<App />)

    await waitFor(() => expect(mockGetPlaces).toHaveBeenCalledTimes(1))

    navigateToBrowse()
    openSubmitSheet()

    expect(screen.getByPlaceholderText(/search for a venue/i)).toBeInTheDocument()

    fillAndSubmitForm('Woodland Park Zoo')

    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/search for a venue/i)).not.toBeInTheDocument()
    )
  })

  it('sheet stays open and shows error when submitPlace throws', async () => {
    mockSubmitPlace.mockRejectedValueOnce(new Error('Supabase is down'))
    render(<App />)

    await waitFor(() => expect(mockGetPlaces).toHaveBeenCalledTimes(1))

    navigateToBrowse()
    openSubmitSheet()
    fillAndSubmitForm()

    await waitFor(() => screen.getByText('Supabase is down'))
    // Sheet still open — form still mounted
    expect(screen.getByPlaceholderText(/search for a venue/i)).toBeInTheDocument()
  })
})
