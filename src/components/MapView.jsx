import { useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { TYPE_COLORS, CAT_CFG } from '../lib/constants'

const SEATTLE_CENTER = { longitude: -122.33, latitude: 47.60 }

/** Drop shadows aligned with theme.css --shadow-md / --shadow-coral (shape-aware filter) */
const SHADOW_DEFAULT = 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.10))'
const SHADOW_SELECTED = 'drop-shadow(0 6px 18px rgba(242, 139, 110, 0.35))'

/** Bing-style: round disk + thin stem; anchor = bottom of stem (viewBox bottom). */
const VB_W = 24
const VB_H = 25
const HEAD_CX = 12
const HEAD_CY = 10
const HEAD_R = 9
const INNER_R = 6.75
/** Bottom of circle y = HEAD_CY + HEAD_R */
const STEM_TOP = HEAD_CY + HEAD_R
const STEM_BOTTOM = 23.25

/** Fixed pin size; selection reads via coral ring + one-shot scale pop (anchored at stem tip). */
const PIN_W = 34

function DropPin({ typeColor, emoji, selected }) {
  const reducedMotion = useReducedMotion()
  const H = Math.round((PIN_W * VB_H) / VB_W)
  const bulbTopPct = (HEAD_CY / VB_H) * 100
  const fillColor = selected ? 'var(--coral)' : typeColor

  return (
    <motion.div
      key={selected ? 'selected' : 'idle'}
      className="relative"
      initial={{ scale: 1 }}
      animate={
        selected && !reducedMotion
          ? { scale: [1, 1.14, 1] }
          : { scale: 1 }
      }
      transition={
        selected && !reducedMotion
          ? { duration: 0.5, times: [0, 0.38, 1], ease: ['easeOut', 'easeOut'] }
          : { duration: 0.12 }
      }
      whileHover={selected ? undefined : { scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      style={{
        width: PIN_W,
        height: H,
        transformOrigin: '50% 100%',
        filter: selected ? SHADOW_SELECTED : SHADOW_DEFAULT,
        cursor: 'pointer',
      }}
    >
      <svg width={PIN_W} height={H} viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none" aria-hidden>
        <ellipse cx={HEAD_CX} cy={VB_H - 0.35} rx="2.2" ry="0.7" fill="var(--foreground)" opacity={0.12} />
        {selected && (
          <circle
            cx={HEAD_CX}
            cy={HEAD_CY}
            r={HEAD_R + 2.25}
            fill="none"
            stroke="var(--coral)"
            strokeWidth={2}
            opacity={0.95}
          />
        )}
        {/* Colored disk (Bing-style solid head) */}
        <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={fillColor} />
        {/* White inner for emoji */}
        <circle cx={HEAD_CX} cy={HEAD_CY} r={INNER_R} fill="var(--card)" />
        {/* Thin stem — map anchor is bottom of SVG = stem end */}
        <line
          x1={HEAD_CX}
          y1={STEM_TOP}
          x2={HEAD_CX}
          y2={STEM_BOTTOM}
          stroke={fillColor}
          strokeWidth={2.25}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: `${bulbTopPct}%`,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 13,
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {emoji}
      </span>
    </motion.div>
  )
}

export default function MapView({ places = [], onSelectPlace, selectedPlace }) {
  const handleMarkerClick = useCallback((e, place) => {
    e.originalEvent?.stopPropagation()
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
            type="button"
            aria-label={place.name}
            title={place.name}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm transition-transform duration-100 ease-out active:scale-95"
          >
            <DropPin
              typeColor={TYPE_COLORS[place.type] ?? TYPE_COLORS.Other}
              emoji={CAT_CFG[place.type]?.emoji ?? '📍'}
              selected={selectedPlace?.id === place.id}
            />
          </button>
        </Marker>
      ))}
    </Map>
  )
}
