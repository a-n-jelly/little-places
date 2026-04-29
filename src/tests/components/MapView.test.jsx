import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('react-map-gl/mapbox', () => {
  const Map = ({ children, onMove, ref: _ref }) => (
    <div data-testid="map" onClick={() => onMove?.({ viewState: { zoom: 12 }, target: { getBounds: () => ({ getWest: () => -122.5, getSouth: () => 47.4, getEast: () => -122.1, getNorth: () => 47.8 }) } })}>
      {children}
    </div>
  )
  return {
    default: Map,
    Marker: ({ children, longitude, latitude }) => (
      <div data-testid="marker" data-lng={longitude} data-lat={latitude}>{children}</div>
    ),
    NavigationControl: () => null,
    GeolocateControl: () => null,
  }
})

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

const mockUseSupercluster = vi.fn()
vi.mock('use-supercluster', () => ({ default: (...args) => mockUseSupercluster(...args) }))

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCluster(id, count, lng, lat) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { cluster: true, cluster_id: id, point_count: count },
  }
}

function makePoint(place) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [place.lng, place.lat] },
    properties: { cluster: false, placeId: place.id, place },
  }
}

const PLACE_A = { id: 1, name: 'Park A', type: 'Park', lat: 47.6, lng: -122.33 }
const PLACE_B = { id: 2, name: 'Museum B', type: 'Museum', lat: 47.61, lng: -122.34 }

import MapView from '../../components/MapView'

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('MapView — clustering', () => {
  beforeEach(() => {
    mockUseSupercluster.mockReturnValue({
      clusters: [],
      supercluster: { getClusterExpansionZoom: vi.fn().mockReturnValue(14) },
    })
  })

  it('renders a cluster bubble with point count when supercluster returns a cluster', () => {
    mockUseSupercluster.mockReturnValue({
      clusters: [makeCluster(1, 5, -122.33, 47.6)],
      supercluster: { getClusterExpansionZoom: vi.fn().mockReturnValue(14) },
    })
    render(<MapView places={[PLACE_A, PLACE_B]} />)
    expect(screen.getByTestId('cluster-bubble')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('renders individual pins when supercluster returns individual points', () => {
    mockUseSupercluster.mockReturnValue({
      clusters: [makePoint(PLACE_A), makePoint(PLACE_B)],
      supercluster: { getClusterExpansionZoom: vi.fn().mockReturnValue(14) },
    })
    render(<MapView places={[PLACE_A, PLACE_B]} />)
    expect(screen.getByLabelText('Park A')).toBeTruthy()
    expect(screen.getByLabelText('Museum B')).toBeTruthy()
    expect(screen.queryByTestId('cluster-bubble')).toBeNull()
  })

  it('does not render individual pins for clustered places (non-selected)', () => {
    mockUseSupercluster.mockReturnValue({
      clusters: [makeCluster(1, 2, -122.33, 47.6)],
      supercluster: { getClusterExpansionZoom: vi.fn().mockReturnValue(14) },
    })
    render(<MapView places={[PLACE_A, PLACE_B]} />)
    expect(screen.queryByLabelText('Park A')).toBeNull()
    expect(screen.queryByLabelText('Museum B')).toBeNull()
  })

  it('always renders selected place as an individual pin, even when all others are clustered', () => {
    mockUseSupercluster.mockReturnValue({
      clusters: [makeCluster(1, 2, -122.33, 47.6)],
      supercluster: { getClusterExpansionZoom: vi.fn().mockReturnValue(14) },
    })
    render(<MapView places={[PLACE_A, PLACE_B]} selectedPlace={PLACE_A} />)
    // Cluster bubble still shows (for the other place)
    expect(screen.getByTestId('cluster-bubble')).toBeTruthy()
    // Selected place is always a pin
    expect(screen.getByLabelText('Park A')).toBeTruthy()
  })

  it('passes correct supercluster options — maxZoom 11 so zoom 12+ has no clusters', () => {
    render(<MapView places={[PLACE_A]} />)
    const callArgs = mockUseSupercluster.mock.calls[0]
    const options = callArgs[0].options // hook takes a single options object
    expect(options.maxZoom).toBe(11)
  })
})
