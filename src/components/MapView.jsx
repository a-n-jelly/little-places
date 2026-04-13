import { useState, useCallback } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TYPE_COLORS } from '../lib/constants'

const SEATTLE_CENTER = { longitude: -122.33, latitude: 47.60 }

export default function MapView({ places = [], onSelectPlace }) {
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
          <button
            aria-label={place.name}
            title={place.name}
            className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            style={{ backgroundColor: TYPE_COLORS[place.type] ?? '#94a3b8' }}
          />
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
            <p className="font-semibold text-slate-800 text-sm leading-tight">{popupPlace.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{popupPlace.type}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{popupPlace.address}</p>
          </div>
        </Popup>
      )}
    </Map>
  )
}
