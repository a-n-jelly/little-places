import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, X, Sparkles, Home as HomeIcon, ArrowLeft, ArrowUp } from 'lucide-react'
import { Drawer } from 'vaul'
import MapView from './MapView'
import { FEATURE_FILTER_CHIPS, CAT_CFG, FEATURE_VOCAB, placeTypeIconSurface } from '../lib/constants'
import { formatStageSpan, getStandoutFeatureShort } from '../lib/placeListRow'
import { useAgentChat } from '../hooks/useAgentChat'
import { AGENT_SUGGESTIONS } from '../lib/agentSuggestions'
import { getTipsForPlace, submitTip } from '../lib/places'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'

function ErrorState({ onRetry }) {
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-destructive/15 bg-destructive/5 px-5 py-5 text-center">
      <p className="text-2xl mb-2">😔</p>
      <p className="text-sm font-bold text-foreground mb-1">Couldn't load places</p>
      <p className="text-xs text-muted-foreground mb-4">Something went wrong connecting to the server.</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-bold text-destructive underline underline-offset-2 hover:opacity-70 transition-opacity duration-100"
      >
        Try again
      </button>
    </div>
  )
}

function NoResultsState({ onClear }) {
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-border/50 bg-muted/40 px-5 py-8 text-center">
      <p className="text-2xl mb-2">🔍</p>
      <p className="text-sm font-bold text-foreground mb-1">No spots match your filters</p>
      <p className="text-xs text-muted-foreground mb-4">Try removing a filter or clearing your search.</p>
      <button
        type="button"
        onClick={onClear}
        className="text-xs font-bold text-primary underline underline-offset-2 hover:opacity-70 transition-opacity duration-100"
      >
        Clear all filters
      </button>
    </div>
  )
}

function EmptyAreaState() {
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-border/50 bg-muted/40 px-5 py-8 text-center">
      <p className="text-2xl mb-2">🗺️</p>
      <p className="text-sm font-bold text-foreground mb-1">No spots here yet</p>
      <p className="text-xs text-muted-foreground">Be the first to add a little place in this area.</p>
    </div>
  )
}

const STAGE_LABELS = {
  baby:      'Baby',
  toddler:   'Toddler',
  preschool: 'Preschool',
  bigkids:   'Big Kids',
  tweens:    'Tweens+',
}

const STAGE_STYLE = {
  baby:      { background: 'var(--stage-baby-bg)',      color: 'var(--stage-baby-text)'      },
  toddler:   { background: 'var(--stage-toddler-bg)',   color: 'var(--stage-toddler-text)'   },
  preschool: { background: 'var(--stage-preschool-bg)', color: 'var(--stage-preschool-text)' },
  bigkids:   { background: 'var(--stage-bigkids-bg)',   color: 'var(--stage-bigkids-text)'   },
  tweens:    { background: 'var(--stage-tweens-bg)',    color: 'var(--stage-tweens-text)'    },
}

function AddTipForm({ placeId, placeType, onSubmitted }) {
  const [tipText, setTipText] = useState('')
  const [displayName, setDisplayName] = useState(() => {
    try { return localStorage.getItem('little-places-display-name') ?? '' } catch { return '' }
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipText.trim()) return
    setSubmitting(true)
    try {
      await submitTip(placeId, tipText.trim(), displayName)
      if (displayName.trim()) {
        try { localStorage.setItem('little-places-display-name', displayName.trim()) } catch {}
      }
      supabase.functions.invoke('enrich-place', {
        body: { place_id: placeId, feature_vocab: FEATURE_VOCAB[placeType] ?? [] },
      }).catch(() => {})
      track('tip_submitted', { place_id: placeId, place_type: placeType })
      onSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        rows={2}
        value={tipText}
        onChange={e => setTipText(e.target.value)}
        placeholder="What makes it great for kids here?"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-ring/30 resize-none placeholder:text-muted-foreground/50"
      />
      <input
        type="text"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        placeholder="e.g. Mama Bear or Dad of 2 (optional)"
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-base md:text-sm outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/50"
      />
      <button
        type="submit"
        disabled={submitting || !tipText.trim()}
        className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-40 transition-opacity"
      >
        {submitting ? 'Submitting…' : 'Submit tip'}
      </button>
    </form>
  )
}

function PlaceDetail({ place, tips = [], onTipAdded }) {
  const cfg = CAT_CFG[place.type] ?? CAT_CFG.Other
  const [showTipForm, setShowTipForm] = useState(false)

  function handleTipSubmitted() {
    setShowTipForm(false)
    onTipAdded?.()
  }

  return (
    <div className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ width: 50, height: 50, background: placeTypeIconSurface(place.type, '24%') }}
        >
          <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-black text-foreground leading-tight text-lg">{place.name}</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">{place.type} · {place.address}</p>
        </div>
      </div>


      {place.description && (
        <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-4">{place.description}</p>
      )}

      {place.stages?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {place.stages.map(stage => (
            <span
              key={stage}
              className="text-[10px] font-black px-2.5 py-1 rounded-full"
              style={STAGE_STYLE[stage] ?? { background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              {STAGE_LABELS[stage] ?? stage}
            </span>
          ))}
        </div>
      )}

      {tips.length > 0 && (
        <div className="mt-2 mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Community tips
          </h4>
          <ul className="space-y-2">
            {tips.map(t => (
              <li key={t.id} className="text-sm text-foreground leading-relaxed">
                &ldquo;{t.tip_text}&rdquo;
                {t.display_name && (
                  <span className="ml-1 text-xs text-muted-foreground">— {t.display_name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showTipForm ? (
        <AddTipForm placeId={place.id} placeType={place.type} onSubmitted={handleTipSubmitted} />
      ) : (
        <button
          type="button"
          onClick={() => setShowTipForm(true)}
          className="mt-2 w-full rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors duration-100"
        >
          + Add a tip
        </button>
      )}
    </div>
  )
}

function PlaceListRow({ place, isSelected, onClick }) {
  const cfg = CAT_CFG[place.type] ?? CAT_CFG.Other
  const stageSpan = formatStageSpan(place.stages)
  const standout = getStandoutFeatureShort(place)
  const sublineType = place.type ?? 'Place'
  const sublineAddress = place.address ?? ''

  return (
    <motion.button
      whileHover={{ x: 2, transition: { type: 'tween', duration: 0.08, ease: 'easeOut' } }}
      onClick={onClick}
      className={`flex items-center gap-3.5 px-5 py-3.5 w-full text-left border-b border-border/50 transition-colors duration-100 ease-out ${
        isSelected ? 'bg-primary/[0.05] border-l-[3px] border-l-primary pl-[17px]' : 'hover:bg-muted/40'
      }`}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, background: placeTypeIconSurface(place.type, '22%') }}
      >
        <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">{place.name}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
          <span>{sublineType}</span>
          {sublineAddress ? <span> · {sublineAddress}</span> : null}
        </p>
        {(stageSpan || standout) && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {stageSpan && (
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)' }}
              >
                {stageSpan}
              </span>
            )}
            {standout && (
              <span className="text-[9px] font-black text-sage bg-sage/10 px-2 py-0.5 rounded border border-sage/15">
                {standout}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.button>
  )
}

export default function BrowseLayout({
  places,
  loading,
  error,
  search,
  setSearch,
  onSubmitPlace,
  panelMode,
  setPanelMode,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [tips, setTips] = useState([])
  const [activeChips, setActiveChips] = useState([])
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!search.trim()) return
    const t = setTimeout(() => track('browse_search', { query: search.trim() }), 800)
    return () => clearTimeout(t)
  }, [search])
  const searchInputDesktopRef = useRef(null)
  const searchInputMobileRef = useRef(null)
  const askInputDesktopRef = useRef(null)
  const askInputMobileRef = useRef(null)
  const prevPanelMode = useRef(panelMode)

  const LINE_HEIGHT = 22
  const MAX_LINES = 5

  const autoResize = useCallback((el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, LINE_HEIGHT * MAX_LINES)}px`
  }, [])

  function handleAskSubmit(e) {
    handleAgentSubmit(e)
    resetTextarea(askInputDesktopRef.current)
    resetTextarea(askInputMobileRef.current)
  }

  const resetTextarea = (el) => {
    if (!el) return
    el.style.height = 'auto'
  }

  const {
    query: agentQuery,
    setQuery: setAgentQuery,
    response: agentResponse,
    loading: agentLoading,
    error: agentError,
    handleSubmit: handleAgentSubmit,
    foundPlaces,
  } = useAgentChat()

  const [snapPoint, setSnapPoint] = useState('130px')
  const [askOpen, setAskOpen] = useState(false)
  const [mapBounds, setMapBounds] = useState(null)

  function setMode(next) {
    setPanelMode(next)
    if (next === 'ask') {
      setSelectedPlace(null)
    }
  }

  useEffect(() => {
    if (prevPanelMode.current === panelMode) return
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
    if (panelMode === 'ask') {
      if (isDesktop) {
        askInputDesktopRef.current?.focus()
        // textarea remounts on panel switch — restore height to match content
        requestAnimationFrame(() => autoResize(askInputDesktopRef.current))
      }
    } else {
      if (isDesktop) searchInputDesktopRef.current?.focus()
      else searchInputMobileRef.current?.focus()
    }
    prevPanelMode.current = panelMode
  }, [panelMode, autoResize])

  useEffect(() => {
    if (askOpen) askInputMobileRef.current?.focus()
  }, [askOpen])

  useEffect(() => {
    if (!selectedPlace) { setTips([]); return }
    getTipsForPlace(selectedPlace.id).then(setTips).catch(() => setTips([]))
  }, [selectedPlace])

  function handleSelectPlace(place) {
    setSelectedPlace(place)
    setSnapPoint('130px')
    setPanelMode('search')
    track('place_selected', { place_id: place.id, place_type: place.type, place_name: place.name })
  }

  function handleMapClick(e) {
    if (e.target.tagName === 'CANVAS' && (snapPoint === 0.75 || snapPoint === 1)) {
      setSnapPoint('130px')
    }
  }

  function handleBackToList() {
    setSelectedPlace(null)
  }

  const displayedPlaces = activeChips.length > 0
    ? places.filter(p => activeChips.every(c => (p.child_friendly_features ?? []).includes(c)))
    : places

  const visibleCount = mapBounds
    ? displayedPlaces.filter(p =>
        p.lat != null && p.lng != null &&
        p.lng >= mapBounds[0] && p.lat >= mapBounds[1] &&
        p.lng <= mapBounds[2] && p.lat <= mapBounds[3]
      ).length
    : displayedPlaces.length

  const sortedPlaces = mapBounds
    ? [...displayedPlaces].sort((a, b) => {
        const cLng = (mapBounds[0] + mapBounds[2]) / 2
        const cLat = (mapBounds[1] + mapBounds[3]) / 2
        const distA = (a.lng - cLng) ** 2 + (a.lat - cLat) ** 2
        const distB = (b.lng - cLng) ** 2 + (b.lat - cLat) ** 2
        return distA - distB
      })
    : displayedPlaces

  const segmentBar = (
    <div
      className="flex p-1 rounded-xl bg-muted/70 border border-border/40"
      role="tablist"
      aria-label="Filter places or ask the guide"
    >
      <button
        type="button"
        role="tab"
        aria-selected={panelMode === 'search'}
        onClick={() => setMode('search')}
        className={`flex-1 py-2 px-2 rounded-lg text-xs font-black transition-[color,background-color,box-shadow] duration-100 ease-out ${
          panelMode === 'search'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Search
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={panelMode === 'ask'}
        onClick={() => setMode('ask')}
        className={`flex-1 py-2 px-2 rounded-lg text-xs font-black transition-[color,background-color,box-shadow] duration-100 ease-out ${
          panelMode === 'ask'
            ? 'bg-white text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Ask AI
      </button>
    </div>
  )

  const unifiedInputDesktop = (
    <div className="mt-3">
      {panelMode === 'search' ? (
        <div className="relative">
          <Search className="absolute left-3.5 top-[11px] text-muted-foreground/40 pointer-events-none" size={14} />
          <textarea
            ref={searchInputDesktopRef}
            rows={1}
            value={search}
            onChange={e => { setSearch(e.target.value); autoResize(e.target) }}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
            placeholder="Filter by name or type…"
            autoComplete="off"
            className="w-full bg-off-white rounded-xl pl-9 pr-9 py-2.5 text-base md:text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50 resize-none overflow-hidden"
            style={{ lineHeight: `${LINE_HEIGHT}px` }}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); if (searchInputDesktopRef.current) { searchInputDesktopRef.current.style.height = 'auto'; searchInputDesktopRef.current.focus() } }}
              aria-label="Clear search"
              className="absolute right-3 top-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleAskSubmit} className="relative">
          <div className="relative">
            <Sparkles className="absolute left-3.5 top-[11px] text-primary/70 pointer-events-none" size={14} />
            <textarea
              ref={askInputDesktopRef}
              rows={1}
              value={agentQuery}
              onChange={e => { setAgentQuery(e.target.value); autoResize(e.target) }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (agentQuery.trim() && !agentLoading) handleAskSubmit(e)
                }
                if (e.key === 'Escape') e.target.blur()
              }}
              placeholder="Rainy day with a toddler?"
              disabled={agentLoading}
              autoComplete="off"
              className={`w-full bg-off-white rounded-xl pl-9 pr-20 py-2.5 text-base md:text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border transition-[border-color,box-shadow] duration-150 resize-none overflow-y-auto ask-textarea disabled:opacity-60 ${
                agentLoading
                  ? 'border-primary/40 shadow-[0_0_0_3px_rgba(55,48,163,0.08)]'
                  : 'border-border/50 focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(55,48,163,0.08)]'
              }`}
              style={{ lineHeight: `${LINE_HEIGHT}px`, maxHeight: `${LINE_HEIGHT * MAX_LINES}px` }}
            />
            <div className="absolute right-2 bottom-[11px] flex items-center gap-1">
              {agentQuery.trim() && (
                <button
                  type="button"
                  onClick={() => { setAgentQuery(''); resetTextarea(askInputDesktopRef.current); askInputDesktopRef.current?.focus() }}
                  aria-label="Clear"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors duration-100"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                disabled={!agentQuery.trim() || agentLoading}
                className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-100"
              >
                {agentLoading ? '…' : 'Ask'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )

  const agentExploreBody = (
    <div className="px-5 pt-2 pb-6 flex flex-col min-h-0">
      {agentError && (
        <div className="mb-4 rounded-2xl border border-border/50 bg-muted/40 px-4 py-4 text-center">
          <p className="text-xl mb-1">⏳</p>
          <p className="text-sm font-bold text-foreground mb-1">The guide is busy right now</p>
          <p className="text-xs text-muted-foreground">Try again in a moment — results may vary while still learning.</p>
        </div>
      )}
      {agentResponse && (
        <div className="mb-4 rounded-xl border border-border bg-off-white px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {agentResponse}
        </div>
      )}
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Try asking</p>
      <div className="flex flex-wrap gap-2">
        {AGENT_SUGGESTIONS.map((s) => (
          <motion.button
            key={s.label}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setAgentQuery(s.label)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border border-border/50 hover:opacity-80 transition-opacity duration-100 ${s.color}`}
          >
            <s.icon size={14} strokeWidth={2.5} />
            {s.label}
          </motion.button>
        ))}
      </div>
    </div>
  )

  const featureChips = (
    <div
      className="flex gap-2 overflow-x-auto px-1 py-2 max-w-[min(100%,42rem)]"
      style={{ scrollbarWidth: 'none' }}
      role="toolbar"
      aria-label="Filter by feature"
    >
      {FEATURE_FILTER_CHIPS.map((chip) => {
        const isActive = activeChips.includes(chip.id)
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              const next = activeChips.includes(chip.id)
                ? activeChips.filter(c => c !== chip.id)
                : [...activeChips, chip.id]
              setActiveChips(next)
              track('filter_chip_toggled', { chip: chip.id, active: !activeChips.includes(chip.id) })
            }}
            className={`flex-shrink-0 flex items-center px-3 py-[7px] rounded-full text-xs font-semibold border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-white ${
              isActive
                ? 'text-primary -translate-y-px'
                : 'text-foreground/90 hover:text-foreground hover:-translate-y-0.5 active:translate-y-0'
            }`}
            style={{
              borderColor: isActive ? 'var(--primary)' : 'transparent',
              boxShadow: isActive ? 'var(--shadow-focus)' : 'var(--shadow-chip)',
            }}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen">
        <aside
          className="w-[360px] flex-shrink-0 flex flex-col h-full bg-white relative z-20"
          style={{ boxShadow: 'var(--shadow-md)', borderRight: '1px solid var(--border-subtle)' }}
        >
          <div className="px-5 pt-4 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/20" style={{ width: 28, height: 28 }}>
                <HomeIcon size={14} className="text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-serif font-bold text-base tracking-tight text-foreground">Little Places</span>
            </div>
            {segmentBar}
            {unifiedInputDesktop}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border-subtle) transparent' }}>
            {panelMode === 'ask' ? (
              agentExploreBody
            ) : (
              <AnimatePresence>
                {selectedPlace ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                  >
                    <button
                      onClick={handleBackToList}
                      aria-label="Back to list"
                      className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground w-full text-left border-b border-border/50 hover:bg-muted/40 transition-colors duration-100 ease-out"
                    >
                      ← Back to list
                    </button>
                    <PlaceDetail place={selectedPlace} tips={tips} onTipAdded={() => getTipsForPlace(selectedPlace.id).then(setTips).catch(() => {})} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    <div className="px-5 pt-3.5 pb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {loading ? 'Loading…' : `${visibleCount} spot${visibleCount !== 1 ? 's' : ''} in this area`}
                      </p>
                    </div>

                    {error && <ErrorState onRetry={() => window.location.reload()} />}
                    {!loading && !error && displayedPlaces.length === 0 && places.length > 0 && (
                      <NoResultsState onClear={() => { setSearch(''); setActiveChips([]) }} />
                    )}
                    {!loading && !error && places.length === 0 && <EmptyAreaState />}

                    {sortedPlaces.map(place => (
                      <PlaceListRow
                        key={place.id}
                        place={place}
                        isSelected={selectedPlace?.id === place.id}
                        onClick={() => handleSelectPlace(place)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </aside>

        <div className="flex-1 relative">
          <MapView places={displayedPlaces} onSelectPlace={handleSelectPlace} selectedPlace={selectedPlace} onBoundsChange={setMapBounds} />

          <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
            <div className="pointer-events-auto px-4">
              {featureChips}
            </div>
          </div>

          <button
            onClick={onSubmitPlace}
            aria-label="Add a place"
            className="absolute bottom-8 right-4 z-10 flex items-center gap-2 px-4 rounded-xl bg-primary text-white text-sm font-black active:scale-95 transition-[color,background-color,transform,box-shadow] duration-100 ease-out"
            style={{ height: 44, boxShadow: 'var(--shadow-brand)' }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Add a place
          </button>
        </div>
      </div>

      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="md:hidden relative h-screen overflow-hidden">
        {/* Map layer */}
        <div className="absolute inset-0 mobile-map" onClick={handleMapClick}>
          <MapView places={displayedPlaces} onSelectPlace={handleSelectPlace} selectedPlace={selectedPlace} onBoundsChange={setMapBounds} />
        </div>

        {/* Search bar */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-[11px] text-muted-foreground/45 pointer-events-none" size={14} />
              <textarea
                ref={searchInputMobileRef}
                rows={1}
                value={search}
                onChange={e => { setSearch(e.target.value); autoResize(e.target) }}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                placeholder="Search places…"
                autoComplete="off"
                className="w-full bg-off-white rounded-xl pl-9 pr-9 py-2.5 text-base font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50 resize-none overflow-hidden"
                style={{ lineHeight: `${LINE_HEIGHT}px` }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); if (searchInputMobileRef.current) { searchInputMobileRef.current.style.height = 'auto'; searchInputMobileRef.current.focus() } }}
                  aria-label="Clear search"
                  className="absolute right-3 top-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-sm active:scale-95 transition-transform duration-100"
            >
              <Sparkles size={13} strokeWidth={2.5} />
              Ask AI
            </button>
          </div>
        </div>

        {/* Filter chips — floating over map */}
        <div className="absolute left-0 right-0 z-20 pt-2" style={{ top: 68 }}>
          <div className="overflow-x-auto px-4" style={{ scrollbarWidth: 'none' }}>
            {featureChips}
          </div>
        </div>


        {/* Vaul peek sheet — only mounted on mobile and when Ask AI overlay is closed */}
        {isMobile && !askOpen && <Drawer.Root
          open={true}
          onOpenChange={() => {}}
          dismissible={false}
          modal={false}
          snapPoints={['130px', 0.75, 1]}
          activeSnapPoint={snapPoint}
          setActiveSnapPoint={setSnapPoint}
          fadeFromIndex={1}
        >
          <Drawer.Portal>
            <Drawer.Content
              className="bg-card flex flex-col rounded-t-3xl fixed bottom-0 left-0 right-0 z-10 outline-none border-t border-border/60 h-[100dvh]"
              style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
            >
              {snapPoint === '130px' ? (
                <button
                  type="button"
                  onClick={() => setSnapPoint(0.75)}
                  aria-label="Expand place list"
                  className="w-full flex flex-col items-center pt-3 pb-2 flex-shrink-0"
                >
                  <div className="w-10 h-1 rounded-full bg-border" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                    {visibleCount} spot{visibleCount !== 1 ? 's' : ''} in this area
                  </p>
                </button>
              ) : (
                <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-border" />
                </div>
              )}
              <div className="mobile-bottom-sheet-scroll flex-1 overflow-y-auto overscroll-contain min-h-0">
                {error && <ErrorState onRetry={() => window.location.reload()} />}
                {!loading && !error && displayedPlaces.length === 0 && places.length > 0 && (
                  <NoResultsState onClear={() => { setSearch(''); setActiveChips([]) }} />
                )}
                {!loading && !error && places.length === 0 && <EmptyAreaState />}
                {sortedPlaces.map(place => (
                  <PlaceListRow
                    key={place.id}
                    place={place}
                    isSelected={selectedPlace?.id === place.id}
                    onClick={() => handleSelectPlace(place)}
                  />
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>}

        {/* FAB — visible only at peek */}
        <AnimatePresence>
          {snapPoint === '130px' && (
            <motion.button
              key="fab"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300 }}
              onClick={onSubmitPlace}
              aria-label="Add a place"
              className="absolute flex items-center gap-2 px-4 rounded-full bg-primary text-white text-sm font-black active:scale-95 transition-[color,background-color,transform,box-shadow] duration-100 ease-out"
              style={{
                bottom: 'calc(130px + 16px)',
                right: '1rem',
                zIndex: 15,
                height: 44,
                boxShadow: 'var(--shadow-brand)',
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add a place
            </motion.button>
          )}
        </AnimatePresence>

        {/* PlaceDetail bottom sheet */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              key={selectedPlace.id}
              initial={{ y: '108%' }}
              animate={{ y: 0 }}
              exit={{ y: '108%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
              className="absolute bottom-0 left-0 right-0 bg-white overflow-hidden"
              style={{ borderRadius: '28px 28px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', zIndex: 30 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-border" />
              </div>
              <button
                onClick={handleBackToList}
                aria-label="Back to list"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors duration-100 ease-out"
                style={{ zIndex: 10 }}
              >
                <X size={13} strokeWidth={2.5} />
              </button>
              <PlaceDetail place={selectedPlace} tips={tips} onTipAdded={() => getTipsForPlace(selectedPlace.id).then(setTips).catch(() => {})} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ask AI full-screen overlay */}
        <AnimatePresence>
          {askOpen && (
            <motion.div
              key="ask-overlay"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
              className="absolute inset-0 bg-white flex flex-col"
              style={{ zIndex: 60 }}
            >
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/40 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => { setAskOpen(false); setAgentQuery('') }}
                  aria-label="Back to Explore"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors duration-100"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
                <span className="font-bold text-foreground text-sm">Ask AI</span>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">
                {!agentResponse && !agentLoading && !agentError && (
                  <div className="pt-8 text-center">
                    <p className="text-lg font-bold text-foreground mb-6">What are you looking for?</p>
                    {/* TODO: replace with dynamic suggestions */}
                    <div className="flex flex-wrap justify-center gap-3">
                      {AGENT_SUGGESTIONS.map(s => (
                        <motion.button
                          key={s.label}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setAgentQuery(s.label)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold border border-border/50 ${s.color}`}
                        >
                          <s.icon size={14} strokeWidth={2.5} />
                          {s.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {agentError && (
                  <div className="mb-4 rounded-2xl border border-border/50 bg-muted/40 px-4 py-4 text-center">
                    <p className="text-xl mb-1">⏳</p>
                    <p className="text-sm font-bold text-foreground mb-1">The guide is busy right now</p>
                    <p className="text-xs text-muted-foreground">Try again in a moment — results may vary while still learning.</p>
                  </div>
                )}

                {agentResponse && (
                  <div className="mb-4 rounded-xl border border-border bg-off-white px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {agentResponse}
                  </div>
                )}

                {foundPlaces.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {foundPlaces.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedPlace(p); setAskOpen(false) }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform duration-100"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {agentLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                    <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Thinking…
                  </div>
                )}
              </div>

              <form
                onSubmit={handleAskSubmit}
                className="px-4 py-3 border-t border-border/40 bg-white flex-shrink-0"
              >
                <div className="relative">
                  <textarea
                    ref={askInputMobileRef}
                    rows={1}
                    value={agentQuery}
                    onChange={e => { setAgentQuery(e.target.value); autoResize(e.target) }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (agentQuery.trim() && !agentLoading) handleAskSubmit(e)
                      }
                      if (e.key === 'Escape') e.target.blur()
                    }}
                    placeholder="Ask about a place, vibe, or age group…"
                    disabled={agentLoading}
                    autoComplete="off"
                    className={`w-full bg-off-white rounded-xl pl-4 pr-20 py-3 text-base outline-none border transition-[border-color,box-shadow] duration-150 resize-none overflow-y-auto ask-textarea disabled:opacity-60 placeholder:text-muted-foreground/40 ${
                      agentLoading
                        ? 'border-primary/40 shadow-[0_0_0_3px_rgba(55,48,163,0.08)]'
                        : 'border-border/50 focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(55,48,163,0.08)]'
                    }`}
                    style={{ lineHeight: `${LINE_HEIGHT}px`, maxHeight: `${LINE_HEIGHT * MAX_LINES}px` }}
                  />
                  <div className="absolute right-2 bottom-[11px] flex items-center gap-1">
                    {agentQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => { setAgentQuery(''); resetTextarea(askInputMobileRef.current); askInputMobileRef.current?.focus() }}
                        aria-label="Clear"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors duration-100"
                      >
                        <X size={13} />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!agentQuery.trim() || agentLoading}
                      className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-[opacity,transform] duration-100"
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
