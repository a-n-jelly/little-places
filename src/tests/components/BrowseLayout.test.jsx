import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowseLayout from '../../components/BrowseLayout'

vi.mock('../components/MapView', () => ({
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

const places = [
  { id: '1', name: 'Green Lake Park', type: 'Park', address: '7201 E Green Lake Dr N', description: 'Great loop.', stages: [], accessibility: [], tags: [], rating: 0 },
  { id: '2', name: 'Seattle Aquarium', type: 'Attraction', address: '1483 Alaskan Way', description: 'Marine life.', stages: [], accessibility: [], tags: [], rating: 0 },
]

const defaultProps = {
  places,
  allPlaces: places,
  loading: false,
  error: null,
  onRetry: vi.fn(),
  search: '',
  setSearch: vi.fn(),
  selectedStages: [],
  selectedAccess: [],
  selectedTypes: [],
  onStageToggle: vi.fn(),
  onAccessToggle: vi.fn(),
  onTypeToggle: vi.fn(),
  onHome: vi.fn(),
  onSubmitPlace: vi.fn(),
}

describe('BrowseLayout', () => {
  beforeEach(() => vi.clearAllMocks())

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

  it('calls onHome when "← Home" is clicked', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /home/i })[0])
    expect(defaultProps.onHome).toHaveBeenCalledTimes(1)
  })

  it('calls onSubmitPlace when FAB is clicked', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('button', { name: /add a place/i })[0])
    expect(defaultProps.onSubmitPlace).toHaveBeenCalledTimes(1)
  })

  // ── T11: unhappy states ──────────────────────────────────────────────────

  it('shows a loading skeleton while loading', () => {
    render(<BrowseLayout {...defaultProps} loading={true} places={[]} allPlaces={[]} />)
    expect(screen.getByLabelText('Loading places')).toBeInTheDocument()
  })

  it('shows error message and retry button on error', () => {
    const onRetry = vi.fn()
    render(<BrowseLayout {...defaultProps} loading={false} error="Failed to load" places={[]} allPlaces={[]} onRetry={onRetry} />)
    expect(screen.getAllByText('Failed to load').length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole('button', { name: /retry/i })[0])
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows "no places in the directory yet" when allPlaces is empty', () => {
    render(<BrowseLayout {...defaultProps} places={[]} allPlaces={[]} />)
    expect(screen.getAllByText(/no places in the directory yet/i).length).toBeGreaterThan(0)
  })

  it('shows "no spots match your filters" when allPlaces has items but filtered is empty', () => {
    render(<BrowseLayout {...defaultProps} places={[]} allPlaces={places} />)
    expect(screen.getAllByText(/no spots match your filters/i).length).toBeGreaterThan(0)
  })
})
