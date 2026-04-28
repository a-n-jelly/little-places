import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowseLayout from '../../components/BrowseLayout'

const mockGetTips = vi.hoisted(() => vi.fn())
const mockSubmitTip = vi.hoisted(() => vi.fn())
vi.mock('../../lib/places', () => ({
  getTipsForPlace: mockGetTips,
  submitTip: mockSubmitTip,
}))

vi.mock('../../components/MapView', () => ({
  default: ({ places, onSelectPlace }) => (
    <div data-testid="map-view">
      {places.map((p) => (
        <button key={p.id} onClick={() => onSelectPlace(p)} aria-label={`Select ${p.name}`}>
          {p.name}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../../hooks/useAgentChat', () => ({
  useAgentChat: () => ({
    query: '',
    setQuery: vi.fn(),
    response: null,
    loading: false,
    error: null,
    handleSubmit: vi.fn(),
    foundPlaces: [],
  }),
}))

vi.mock('vaul', () => ({
  Drawer: {
    Root: ({ children }) => <>{children}</>,
    Portal: ({ children }) => <>{children}</>,
    Content: ({ children, className, style }) => (
      <div className={className} style={style}>{children}</div>
    ),
    Overlay: () => null,
  },
}))

const places = [
  { id: '1', name: 'Green Lake Park', type: 'Park', address: '7201 E Green Lake Dr N', description: 'Great loop.', stages: [], child_friendly_features: [], tags: [], rating: 0 },
  { id: '2', name: 'Seattle Aquarium', type: 'Attraction', address: '1483 Alaskan Way', description: 'Marine life.', stages: [], child_friendly_features: [], tags: [], rating: 0 },
]

const defaultProps = {
  places,
  loading: false,
  error: null,
  search: '',
  setSearch: vi.fn(),
  selectedStages: [],
  selectedAccess: [],
  onStageToggle: vi.fn(),
  onAccessToggle: vi.fn(),
  onSubmitPlace: vi.fn(),
  panelMode: 'search',
  setPanelMode: vi.fn(),
}

describe('BrowseLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTips.mockResolvedValue([])
  })

  it('renders the place list by default', () => {
    render(<BrowseLayout {...defaultProps} />)
    expect(screen.getAllByText('Green Lake Park').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Seattle Aquarium').length).toBeGreaterThan(0)
  })

  it('selecting a place switches the sidebar to detail view', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    expect(screen.getAllByRole('button', { name: /back to list/i }).length).toBeGreaterThan(0)
  })

  it('"← Back to list" restores the place list', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /back to list/i })[0])
    expect(screen.getAllByText('Green Lake Park').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Seattle Aquarium').length).toBeGreaterThan(0)
  })

  it('filtered places update the list and marker count', () => {
    const filtered = [places[0]]
    render(<BrowseLayout {...defaultProps} places={filtered} />)
    expect(screen.getAllByText('Green Lake Park').length).toBeGreaterThan(0)
    expect(screen.queryByText('Seattle Aquarium')).not.toBeInTheDocument()
    // Map receives the filtered set
    expect(screen.getAllByRole('button', { name: 'Select Green Lake Park' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Select Seattle Aquarium' })).not.toBeInTheDocument()
  })

  it('clicking Ask AI button opens the Ask AI overlay', async () => {
    render(<BrowseLayout {...defaultProps} />)
    // Mobile Ask AI button is a regular <button> (not role="tab"); desktop tab uses role="tab"
    const askBtns = screen.getAllByRole('button', { name: /ask ai/i })
    expect(askBtns.length).toBeGreaterThan(0)
    fireEvent.click(askBtns[0])
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /back to explore/i })).toBeTruthy()
    )
  })

  it('back arrow in Ask AI overlay closes the overlay', async () => {
    render(<BrowseLayout {...defaultProps} />)
    const askBtns = screen.getAllByRole('button', { name: /ask ai/i })
    fireEvent.click(askBtns[0])
    const backBtn = await waitFor(() => screen.getByRole('button', { name: /back to explore/i }))
    fireEvent.click(backBtn)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /back to explore/i })).toBeNull()
    )
  })

  it('calls onSubmitPlace when FAB is clicked', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /add a place/i })[0])
    expect(defaultProps.onSubmitPlace).toHaveBeenCalledTimes(1)
  })

  it('renders feature chips on the map, not category chips', () => {
    render(<BrowseLayout {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /parks/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cafes/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /stroller friendly/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /free entry/i }).length).toBeGreaterThan(0)
  })

  it('selecting a feature chip filters the place list', () => {
    const placesWithFeatures = [
      { ...places[0], child_friendly_features: ['stroller-friendly'] },
      { ...places[1], child_friendly_features: [] },
    ]
    render(<BrowseLayout {...defaultProps} places={placesWithFeatures} />)
    fireEvent.click(screen.getAllByRole('button', { name: /stroller friendly/i })[0])
    expect(screen.getAllByText('Green Lake Park').length).toBeGreaterThan(0)
    expect(screen.queryByText('Seattle Aquarium')).not.toBeInTheDocument()
  })

  it('peek sheet renders place cards in the drawer portal', async () => {
    render(<BrowseLayout {...defaultProps} />)
    await waitFor(() => {
      const names = Array.from(document.body.querySelectorAll('*'))
        .filter(el => el.textContent === 'Green Lake Park' || el.textContent === 'Seattle Aquarium')
      expect(names.length).toBeGreaterThan(0)
    })
  })

  // ── Add a tip from PlaceDetail ────────────────────────────────────────────

  it('shows an "Add a tip" button in detail view', async () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    await waitFor(() => expect(screen.getAllByRole('button', { name: /add a tip/i }).length).toBeGreaterThan(0))
  })

  it('clicking "Add a tip" reveals the tip form', async () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    await waitFor(() => screen.getAllByRole('button', { name: /add a tip/i })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /add a tip/i })[0])
    expect(screen.getByPlaceholderText(/what makes it great/i)).toBeTruthy()
  })

  it('submitting the tip form calls submitTip with place id and text', async () => {
    mockSubmitTip.mockResolvedValueOnce({})
    mockGetTips.mockResolvedValue([])

    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    await waitFor(() => screen.getAllByRole('button', { name: /add a tip/i })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /add a tip/i })[0])

    fireEvent.change(screen.getByPlaceholderText(/what makes it great/i), {
      target: { value: 'Great swings for toddlers' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit tip/i }))

    await waitFor(() => expect(mockSubmitTip).toHaveBeenCalledWith(
      '1', 'Great swings for toddlers', expect.any(String)
    ))
  })

  it('tip form collapses after successful submit', async () => {
    mockSubmitTip.mockResolvedValueOnce({})
    mockGetTips.mockResolvedValue([])

    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Select Green Lake Park' })[0])
    await waitFor(() => screen.getAllByRole('button', { name: /add a tip/i })[0])
    fireEvent.click(screen.getAllByRole('button', { name: /add a tip/i })[0])

    fireEvent.change(screen.getByPlaceholderText(/what makes it great/i), {
      target: { value: 'Nice spot' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit tip/i }))

    await waitFor(() => expect(screen.queryByPlaceholderText(/what makes it great/i)).toBeNull())
  })
})
