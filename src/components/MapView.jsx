import { useState, useCallback } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TYPE_COLORS, CAT_CFG } from '../lib/constants'

const SEATTLE_CENTER = { longitude: -122.33, latitude: 47.60 }

function DropPin({ color, emoji, selected }) {
  const W = selected ? 38 : 32
  const H = selected ? 48 : 40
  const emojiSize = selected ? 16 : 13
  const bulbTopPct = (11 / 30) * 100

  return (
    <div style={{ position: 'relative', width: W, height: H, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))', cursor: 'pointer' }}>
      <svg width={W} height={H} viewBox="0 0 24 30" fill="none">
        <path d="M12 30C12 30 22 19 22 11C22 5.47715 17.5228 1 12 1C6.47715 1 2 5.47715 2 11C2 19 12 30 12 30Z" fill={color} />
        <circle cx="12" cy="11" r="8.5" fill="white" />
      </svg>
      <span style={{
        position: 'absolute',
        top: `${bulbTopPct}%`,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: emojiSize,
        lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {emoji}
      </span>
    </div>
  )
}

export default function MapView({ places = [], onSelectPlace, selectedPlace }) {
  const [popupPlace, setPopupPlace] = useState(null)

  const handleMarkerClick = useCallback((e, place) => {
    e.originalEvent?.stopPropagation()
    setPopupPlace(place)
    onSelectPlace?.(place)
  }, [onSelectPlace])

  const placesWithCoords = places.filter(
    (p) => p.lat != null && p.lng != null
  )

  return (
    <Map
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{ ...SEATTLE_CENTER, zoom: 12 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {placesWithCoords.map((place) => (
        <Marker
          key={place.id}
          longitude={place.lng}
          latitude={place.lat}
          anchor="bottom"
          onClick={(e) => handleMarkerClick(e, place)}
        >
          <button aria-label={place.name} title={place.name} className="focus:outline-none">
            <DropPin
              color={selectedPlace?.id === place.id ? 'var(--coral)' : (TYPE_COLORS[place.type] ?? 'var(--muted-foreground)')}
              emoji={CAT_CFG[place.type]?.emoji ?? '📍'}
              selected={selectedPlace?.id === place.id}
            />
          </button>
        </Marker>
      ))}

      {popupPlace && (
        <Popup
          longitude={popupPlace.lng}
          latitude={popupPlace.lat}
          anchor="top"
          onClose={() => setPopupPlace(null)}
          closeOnClick={false}
        >
          <div className="p-1 min-w-[160px]">
            <p className="font-semibold text-foreground text-sm leading-tight">{popupPlace.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{popupPlace.type}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{popupPlace.address}</p>
          </div>
        </Popup>
      )}
    </Map>
  )
}
