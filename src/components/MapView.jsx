import { useState, useRef, useMemo, useCallback } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import useSupercluster from 'use-supercluster'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CAT_CFG, placeTypeColorVar } from '../lib/constants'

/** Clusters collapse into individual pins at this zoom level and above. */
const CLUSTER_MAX_ZOOM = 11

const SEATTLE_CENTER = { longitude: -122.33, latitude: 47.60 }

/** Default Mapbox streets; basemap tuning deferred. */
const MAP_STYLE = 'mapbox://styles/mapbox/standard'

/** viewBox — ring + stem layout (matches product reference: idle = coloured ring + white disc + emoji). */
const VB_W = 32
const VB_H = 36
const PIN_W = 36

const HEAD_CX = 16
const HEAD_CY = 14
const HEAD_R = 10
/** Ring thickness for idle state (stroke centred on r). */
const RING_STROKE = 2.35
const STEM_TOP = HEAD_CY + HEAD_R
const STEM_BOTTOM = 31

/** Emoji ~50–55% of inner white diameter (inner ≈ 2(HEAD_R − RING_STROKE/2) in viewBox units). */
const EMOJI_FONT_PX = 10.5

/** Shape-aware shadow (follows alpha); avoids rectangular `box-shadow` on the pin wrapper. */
const FILTER_SHADOW_IDLE =
  'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.12)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.08))'
const FILTER_SHADOW_SELECTED =
  'drop-shadow(0 5px 14px rgba(255, 68, 68, 0.32)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08))'

/**
 * @param {object} p
 * @param {string} p.typeColorVar CSS `var(--cat-…)` from `placeTypeColorVar`
 * @param {string} p.emoji
 * @param {boolean} p.selected
 * @param {string} p.gradientId stable id for SVG defs (e.g. place id)
 */
function DropPin({ typeColorVar, emoji, selected, gradientId }) {
  const reducedMotion = useReducedMotion()
  const H = Math.round((PIN_W * VB_H) / VB_W)
  const headCxPx = (HEAD_CX / VB_W) * PIN_W
  const headCyPx = (HEAD_CY / VB_H) * H
  const gid = `mp-${gradientId}`

  return (
    <motion.div
      className="relative block leading-none"
      animate={{ scale: selected ? 1.22 : 1, y: selected ? -5 : 0 }}
      transition={reducedMotion ? { duration: 0 } : {
        type: 'spring',
        stiffness: 480,
        damping: 22,
        mass: 0.6,
      }}
      whileHover={selected ? undefined : { scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      style={{
        width: PIN_W,
        height: H,
        transformOrigin: '50% 100%',
        filter: selected ? FILTER_SHADOW_SELECTED : FILTER_SHADOW_IDLE,
        cursor: 'pointer',
        background: 'transparent',
      }}
    >
      <svg
        width={PIN_W}
        height={H}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none"
        aria-hidden
        className="block align-top"
      >
        <defs />
        <ellipse cx={HEAD_CX} cy={VB_H - 0.45} rx="3.2" ry="0.9" fill="var(--foreground)" opacity={0.1} />
        <line
          x1={HEAD_CX}
          y1={STEM_TOP}
          x2={HEAD_CX}
          y2={STEM_BOTTOM}
          stroke={selected ? 'var(--marker-selected)' : typeColorVar}
          strokeWidth={2.35}
          strokeLinecap="round"
        />
        {selected ? (
          <>
            {/* Outer red disc */}
            <circle
              cx={HEAD_CX}
              cy={HEAD_CY}
              r={HEAD_R}
              fill="var(--marker-selected)"
            />
            {/* Lighter inner disc — creates visible darker ring at edge */}
            <circle
              cx={HEAD_CX}
              cy={HEAD_CY}
              r={6.8}
              fill="#FF9696"
              style={{ pointerEvents: 'none' }}
            />
          </>
        ) : (
          <circle
            cx={HEAD_CX}
            cy={HEAD_CY}
            r={HEAD_R}
            fill="var(--card)"
            stroke={typeColorVar}
            strokeWidth={RING_STROKE}
          />
        )}
      </svg>
      {!selected && (
        <span
          style={{
            position: 'absolute',
            left: headCxPx,
            top: headCyPx,
            transform: 'translate(-50%, -50%)',
            fontSize: EMOJI_FONT_PX,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          {emoji}
        </span>
      )}
    </motion.div>
  )
}

const MARKER_STYLE = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  margin: 0,
  boxShadow: 'none',
  lineHeight: 0,
}

export default function MapView({ places = [], onSelectPlace, selectedPlace, onBoundsChange }) {
  const mapRef = useRef()
  const [zoom, setZoom] = useState(12)
  const [bounds, setBounds] = useState(null)

  const onMove = useCallback((evt) => {
    setZoom(evt.viewState.zoom)
    if (mapRef.current) {
      const b = mapRef.current.getMap().getBounds()
      const next = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      setBounds(next)
      onBoundsChange?.(next)
    }
  }, [onBoundsChange])

  // GeoJSON points — exclude selected place (always rendered individually below)
  const points = useMemo(() =>
    places
      .filter(p => p.lat != null && p.lng != null && p.id !== selectedPlace?.id)
      .map(p => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { cluster: false, placeId: p.id, place: p },
      })),
    [places, selectedPlace]
  )

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: CLUSTER_MAX_ZOOM },
  })

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      initialViewState={{ ...SEATTLE_CENTER, zoom: 12 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLE}
      config={{ basemap: { theme: 'faded', lightPreset: 'day' } }}
      onMove={onMove}
      logoPosition="bottom-left"
      attributionControl={false}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates

        if (cluster.properties.cluster) {
          const { cluster_id, point_count } = cluster.properties
          return (
            <Marker
              key={`cluster-${cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
              style={MARKER_STYLE}
            >
              <button
                type="button"
                data-testid="cluster-bubble"
                aria-label={`${point_count} places in this area`}
                onClick={() => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster_id),
                    20
                  )
                  mapRef.current?.getMap().flyTo({ center: [lng, lat], zoom: expansionZoom })
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--card)',
                  color: 'var(--primary)',
                  border: '2px solid var(--primary)',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {point_count}
              </button>
            </Marker>
          )
        }

        const { place } = cluster.properties
        return (
          <Marker
            key={place.id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            style={MARKER_STYLE}
          >
            <button
              type="button"
              aria-label={place.name}
              onClick={(e) => { e.stopPropagation(); onSelectPlace?.(place) }}
              className="m-0 inline-flex cursor-pointer appearance-none items-end justify-center border-0 bg-transparent p-0 leading-none shadow-none transition-transform duration-100 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 active:scale-95"
            >
              <DropPin
                typeColorVar={placeTypeColorVar(place.type)}
                emoji={CAT_CFG[place.type]?.emoji ?? '📍'}
                selected={false}
                gradientId={String(place.id)}
              />
            </button>
          </Marker>
        )
      })}

      {/* Selected place always rendered as individual pin on top */}
      {selectedPlace?.lat != null && selectedPlace?.lng != null && (
        <Marker
          key={`selected-${selectedPlace.id}`}
          longitude={selectedPlace.lng}
          latitude={selectedPlace.lat}
          anchor="bottom"
          style={MARKER_STYLE}
        >
          <button
            type="button"
            aria-label={selectedPlace.name}
            onClick={(e) => { e.stopPropagation(); onSelectPlace?.(selectedPlace) }}
            className="m-0 inline-flex cursor-pointer appearance-none items-end justify-center border-0 bg-transparent p-0 leading-none shadow-none transition-transform duration-100 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 active:scale-95"
          >
            <DropPin
              typeColorVar={placeTypeColorVar(selectedPlace.type)}
              emoji={CAT_CFG[selectedPlace.type]?.emoji ?? '📍'}
              selected={true}
              gradientId={`selected-${selectedPlace.id}`}
            />
          </button>
        </Marker>
      )}
    </Map>
  )
}
