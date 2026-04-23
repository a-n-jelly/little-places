import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BrowseLayout from '../../components/BrowseLayout'

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

  it('clicking Ask AI tab requests ask mode', () => {
    render(<BrowseLayout {...defaultProps} />)
    fireEvent.click(screen.getAllByRole('tab', { name: /ask ai/i })[0])
    expect(defaultProps.setPanelMode).toHaveBeenCalledWith('ask')
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
})
