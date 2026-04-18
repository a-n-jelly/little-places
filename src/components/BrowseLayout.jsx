import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Star, X, Sparkles, Map as MapIcon } from 'lucide-react'
import MapView from './MapView'
import { CATEGORY_CHIPS, CAT_CFG, TYPE_COLORS } from '../lib/constants'
import { useAgentChat } from '../hooks/useAgentChat'
import { AGENT_SUGGESTIONS } from '../lib/agentSuggestions'

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

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(rating) ? 'text-yellow fill-current' : 'text-foreground/10'} />
      ))}
      <span className="text-sm font-bold text-foreground ml-1">{rating > 0 ? rating : '—'}</span>
    </div>
  )
}

function PlaceDetail({ place }) {
  const cfg = CAT_CFG[place.type] ?? { emoji: '📍', color: TYPE_COLORS.Other }

  return (
    <div className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ width: 50, height: 50, background: `${cfg.color}33` }}
        >
          <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-black text-foreground leading-tight text-lg">{place.name}</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">{place.type} · {place.address}</p>
        </div>
      </div>

      {place.rating > 0 && <div className="mb-3"><StarRow rating={place.rating} /></div>}

      <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-4">{place.description}</p>

      {place.stages?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
    </div>
  )
}

function PlaceListRow({ place, isSelected, onClick }) {
  const cfg = CAT_CFG[place.type] ?? { emoji: '📍', color: TYPE_COLORS.Other }
  const accessTags = (place.tags ?? []).filter(tag =>
    ['accessible', 'stroller', 'sensory', 'elevator', 'wheelchair'].some(k => tag.toLowerCase().includes(k))
  )

  return (
    <motion.button
      whileHover={{ x: 2, transition: { type: 'tween', duration: 0.08, ease: 'easeOut' } }}
      onClick={onClick}
      className={`flex items-center gap-3.5 px-5 py-4 w-full text-left border-b border-border/50 transition-colors duration-100 ease-out ${
        isSelected ? 'bg-coral/[0.05] border-l-[3px] border-l-coral pl-[17px]' : 'hover:bg-muted/40'
      }`}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, background: `${cfg.color}33` }}
      >
        <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">{place.name}</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{place.address}</p>
        {accessTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {accessTags.map(tag => (
              <span key={tag} className="text-[9px] font-black text-sage bg-sage/10 px-1.5 py-0.5 rounded border border-sage/15 uppercase tracking-wide">
                {tag}
              </span>
            ))}
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
  selectedStages,
  selectedAccess,
  selectedTypes,
  onStageToggle,
  onAccessToggle,
  onTypeToggle,
  onSubmitPlace,
  panelMode,
  setPanelMode,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null)
  /** null = no category chip (show all places from search pipeline) */
  const [activeCat, setActiveCat] = useState(null)
  const searchInputDesktopRef = useRef(null)
  const searchInputMobileRef = useRef(null)
  const askInputDesktopRef = useRef(null)
  const askInputMobileRef = useRef(null)
  const prevPanelMode = useRef(panelMode)

  const {
    query: agentQuery,
    setQuery: setAgentQuery,
    response: agentResponse,
    loading: agentLoading,
    error: agentError,
    handleSubmit: handleAgentSubmit,
  } = useAgentChat()

  const filteredPlaces =
    activeCat == null ? places : places.filter((p) => p.type === activeCat)

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
      if (isDesktop) askInputDesktopRef.current?.focus()
      else askInputMobileRef.current?.focus()
    } else {
      if (isDesktop) searchInputDesktopRef.current?.focus()
      else searchInputMobileRef.current?.focus()
    }
    prevPanelMode.current = panelMode
  }, [panelMode])

  function handleSelectPlace(place) {
    setSelectedPlace(place)
    setPanelMode('search')
  }

  function handleBackToList() {
    setSelectedPlace(null)
  }

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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" size={14} />
          <input
            ref={searchInputDesktopRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by name or type…"
            autoComplete="off"
            className="w-full bg-off-white rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50"
          />
        </div>
      ) : (
        <form onSubmit={handleAgentSubmit} className="relative flex gap-1.5">
          <div className="relative flex-1 min-w-0">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/70 pointer-events-none" size={14} />
            <input
              ref={askInputDesktopRef}
              type="text"
              value={agentQuery}
              onChange={e => setAgentQuery(e.target.value)}
              placeholder="Rainy day with a toddler near Ballard?"
              disabled={agentLoading}
              autoComplete="off"
              className="w-full bg-off-white rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={!agentQuery.trim() || agentLoading}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black bg-coral text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-100"
          >
            {agentLoading ? '…' : 'Ask'}
          </button>
        </form>
      )}
    </div>
  )

  const agentExploreBody = (
    <div className="px-5 pt-2 pb-6 flex flex-col min-h-0">
      {agentError && (
        <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {agentError}
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAgentQuery(s.label)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border border-border/50 ${s.color}`}
          >
            <s.icon size={14} strokeWidth={2.5} />
            {s.label}
          </motion.button>
        ))}
      </div>
    </div>
  )

  const categoryChips = (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {CATEGORY_CHIPS.map((cat) => {
        const isActive = activeCat === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() =>
              setActiveCat((prev) => (prev === cat.id ? null : cat.id))
            }
            className={`flex-shrink-0 flex items-center gap-1.5 pl-2 pr-3 py-[7px] rounded-full text-xs font-bold transition-[color,background-color,box-shadow] duration-100 ease-out ${
              isActive
                ? 'bg-coral text-white'
                : 'bg-white text-muted-foreground hover:text-foreground'
            }`}
            style={{
              boxShadow: isActive ? 'var(--shadow-coral)' : 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: 13 }}>{cat.emoji}</span>
            {cat.label}
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
          <div className="px-5 pt-5 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
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
                    <PlaceDetail place={selectedPlace} />
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
                        {loading ? 'Loading…' : `${filteredPlaces.length} spot${filteredPlaces.length !== 1 ? 's' : ''} nearby`}
                      </p>
                    </div>
                    {error && (
                      <p className="text-center text-destructive py-8 text-sm px-5">{error}</p>
                    )}
                    {!loading && !error && filteredPlaces.length === 0 && (
                      <div className="text-center py-16 px-6">
                        <p className="font-bold text-foreground text-sm mb-1">No spots found</p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCat(null)
                            setSearch('')
                          }}
                          className="mt-2 text-xs font-bold text-coral underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                    {filteredPlaces.map(place => (
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
          <MapView places={filteredPlaces} onSelectPlace={handleSelectPlace} selectedPlace={selectedPlace} />

          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="pointer-events-auto px-4">
              {categoryChips}
            </div>
          </div>

          <button
            onClick={onSubmitPlace}
            aria-label="Add a place"
            className="absolute bottom-8 right-4 z-10 flex items-center justify-center rounded-full bg-coral text-white active:scale-90 transition-[color,background-color,transform,box-shadow] duration-100 ease-out"
            style={{ width: 52, height: 52, boxShadow: 'var(--shadow-coral)' }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="md:hidden relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <MapView places={filteredPlaces} onSelectPlace={handleSelectPlace} selectedPlace={selectedPlace} />
        </div>

        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="pointer-events-auto px-4 overflow-x-auto" style={{ scrollbarWidth: 'none', maxWidth: '100%' }}>
            {categoryChips}
          </div>
        </div>

        <div
          className="absolute top-[56px] left-4 right-4 z-10 rounded-2xl p-3 bg-white/95 backdrop-blur-sm border border-border/50"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          {segmentBar}
          <div className="mt-2">
            {panelMode === 'search' ? (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/45 pointer-events-none" size={14} />
                <input
                  ref={searchInputMobileRef}
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter by name or type…"
                  autoComplete="off"
                  className="w-full bg-off-white rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50"
                />
              </div>
            ) : (
              <form onSubmit={handleAgentSubmit} className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/70 pointer-events-none" size={14} />
                  <input
                    ref={askInputMobileRef}
                    type="text"
                    value={agentQuery}
                    onChange={e => setAgentQuery(e.target.value)}
                    placeholder="Rainy day with a toddler near Ballard?"
                    disabled={agentLoading}
                    autoComplete="off"
                    className="w-full bg-off-white rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-border/50 disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!agentQuery.trim() || agentLoading}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black bg-coral text-white shadow-sm disabled:opacity-40"
                >
                  {agentLoading ? '…' : 'Ask'}
                </button>
              </form>
            )}
          </div>
        </div>

        {panelMode === 'ask' && (
          <div
            className="absolute left-4 right-4 z-10 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-sm border border-border/50 p-4"
            style={{
              top: '11.5rem',
              bottom: '5.75rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {agentExploreBody}
          </div>
        )}

        <button
          onClick={onSubmitPlace}
          aria-label="Add a place"
          className="absolute right-4 z-10 flex items-center justify-center rounded-full bg-coral text-white active:scale-90 transition-[color,background-color,transform,box-shadow] duration-100 ease-out"
          style={{ width: 52, height: 52, boxShadow: 'var(--shadow-coral)', bottom: panelMode === 'ask' ? '5.75rem' : '5.5rem' }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              key={selectedPlace.id}
              initial={{ y: '108%' }}
              animate={{ y: 0 }}
              exit={{ y: '108%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-white overflow-hidden"
              style={{ borderRadius: '28px 28px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', paddingBottom: '5rem' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-border" />
              </div>
              <button
                onClick={handleBackToList}
                aria-label="Back to list"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center z-10 transition-colors duration-100 ease-out"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
              <PlaceDetail place={selectedPlace} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
