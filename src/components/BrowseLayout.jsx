import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Star, X, ChevronRight, Sparkles, Map as MapIcon, Heart } from 'lucide-react'
import MapView from './MapView'
import { CATEGORY_CHIPS, CAT_CFG, TYPE_COLORS } from '../lib/constants'

const STAGE_LABELS = {
  baby:      'Baby',
  toddler:   'Toddler',
  preschool: 'Preschool',
  bigkids:   'Big Kids',
  tweens:    'Tweens+',
}

const STAGE_COLORS = {
  baby:      'bg-yellow/70 text-amber-800',
  toddler:   'bg-sage/20 text-green-800',
  preschool: 'bg-coral/15 text-red-700',
  bigkids:   'bg-purple-100 text-purple-700',
  tweens:    'bg-blue-100 text-blue-700',
}

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-black/10'} />
      ))}
      <span className="text-sm font-bold text-foreground ml-1">{rating > 0 ? rating : '—'}</span>
    </div>
  )
}

function PlaceDetail({ place, likedIds, onToggleLike }) {
  const cfg = CAT_CFG[place.type] ?? { emoji: '📍', color: TYPE_COLORS.Other }
  const isLiked = likedIds.includes(place.id)

  return (
    <div className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ width: 50, height: 50, background: `${cfg.color}20` }}
        >
          <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="font-black text-foreground leading-tight text-lg">{place.name}</h3>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">{place.type} · {place.address}</p>
        </div>
        <button
          onClick={e => onToggleLike(place.id, e)}
          className="w-9 h-9 rounded-full bg-black/[0.04] hover:bg-black/[0.07] flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
        >
          <Heart size={15} className={isLiked ? 'text-coral fill-current' : 'text-muted-foreground'} />
        </button>
      </div>

      {place.rating > 0 && <div className="mb-3"><StarRow rating={place.rating} /></div>}

      <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-4">{place.description}</p>

      {place.stages?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {place.stages.map(stage => (
            <span key={stage} className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STAGE_COLORS[stage] ?? 'bg-gray-100 text-gray-600'}`}>
              {STAGE_LABELS[stage] ?? stage}
            </span>
          ))}
        </div>
      )}

      <button
        className="w-full bg-coral text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        style={{ boxShadow: '0 6px 20px rgba(242,139,110,0.30)' }}
      >
        View full details
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>
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
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`flex items-center gap-3.5 px-5 py-4 w-full text-left border-b border-black/[0.04] transition-colors ${
        isSelected ? 'bg-coral/[0.05] border-l-[3px] border-l-coral pl-[17px]' : 'hover:bg-black/[0.01]'
      }`}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, background: `${cfg.color}20` }}
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
  allPlaces,
  loading,
  error,
  onRetry,
  search,
  setSearch,
  selectedStages,
  selectedAccess,
  selectedTypes,
  onStageToggle,
  onAccessToggle,
  onTypeToggle,
  onHome,
  onSubmitPlace,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [sheetState, setSheetState] = useState('peek')
  const [likedIds, setLikedIds] = useState([])
  const [activeCat, setActiveCat] = useState('all')

  const filteredPlaces = places || activeCat === 'all'
    ? places
    : places.filter(p => p.type === activeCat)

  function handleSelectPlace(place) {
    setSelectedPlace(place)
    setSheetState('detail')
  }

  function handleBackToList() {
    setSelectedPlace(null)
    setSheetState('list')
  }

  function toggleLike(id, e) {
    e.stopPropagation()
    setLikedIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])
  }

  const categoryChips = (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {CATEGORY_CHIPS.map(cat => {
        const isActive = activeCat === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 pl-2 pr-3 py-[7px] rounded-full text-xs font-bold transition-all ${
              isActive
                ? 'bg-coral text-white'
                : 'bg-white/95 text-muted-foreground hover:bg-white hover:text-foreground'
            }`}
            style={{
              boxShadow: isActive
                ? '0 3px 12px rgba(242,139,110,0.38)'
                : '0 2px 10px rgba(0,0,0,0.11)',
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
          style={{ boxShadow: '4px 0 32px rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.04)' }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex-shrink-0 border-b border-black/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-black text-foreground tracking-tight">Little Places</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onHome}
                  aria-label="Home"
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:bg-black/[0.04] transition-colors"
                >
                  Ask AI
                </button>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-coral text-white shadow-sm">
                  Explore
                </span>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" size={14} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Parks, cafes, museums…"
                className="w-full bg-off-white/80 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none placeholder:text-muted-foreground/40 text-foreground border border-black/[0.05]"
              />
            </div>
          </div>

          {/* List / detail */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.08) transparent' }}>
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
                    className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold text-muted-foreground hover:text-foreground w-full text-left border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors"
                  >
                    ← Back to list
                  </button>
                  <PlaceDetail place={selectedPlace} likedIds={likedIds} onToggleLike={toggleLike} />
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
                  {loading && (
                    <div className="px-5 pt-2 space-y-3" aria-label="Loading places">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                          <div className="w-10 h-10 rounded-xl bg-black/[0.07] flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-black/[0.07] rounded-full w-3/4" />
                            <div className="h-2.5 bg-black/[0.05] rounded-full w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading && error && (
                    <div className="text-center py-12 px-6">
                      <p className="text-sm text-destructive mb-3">{error}</p>
                      <button
                        onClick={onRetry}
                        className="text-xs font-bold text-coral underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {!loading && !error && filteredPlaces.length === 0 && (
                    <div className="text-center py-16 px-6">
                      {allPlaces.length === 0 ? (
                        <p className="font-bold text-foreground text-sm">No places in the directory yet</p>
                      ) : (
                        <>
                          <p className="font-bold text-foreground text-sm mb-1">No spots match your filters</p>
                          <button onClick={() => setActiveCat('all')} className="mt-2 text-xs font-bold text-coral underline">
                            Clear filters
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {!loading && !error && filteredPlaces.map(place => (
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
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView places={filteredPlaces} onSelectPlace={handleSelectPlace} selectedPlace={selectedPlace} />

          {/* Category chips */}
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="pointer-events-auto px-4">
              {categoryChips}
            </div>
          </div>

          {/* FAB */}
          <button
            onClick={onSubmitPlace}
            aria-label="Add a place"
            className="absolute bottom-8 right-4 z-10 flex items-center justify-center rounded-full bg-coral text-white active:scale-90 transition-all"
            style={{ width: 52, height: 52, boxShadow: '0 6px 24px rgba(242,139,110,0.46)' }}
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

        {/* Category chips */}
        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="pointer-events-auto px-4 overflow-x-auto" style={{ scrollbarWidth: 'none', maxWidth: '100%' }}>
            {categoryChips}
          </div>
        </div>

        {/* Search bar */}
        <div className="absolute top-[60px] left-4 right-4 z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/45 pointer-events-none" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Parks, cafes, museums…"
              className="w-full bg-white/96 backdrop-blur-2xl rounded-2xl pl-9 pr-4 py-3 text-sm font-medium outline-none placeholder:text-muted-foreground/38 text-foreground"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.75)' }}
            />
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={onSubmitPlace}
          aria-label="Add a place"
          className="absolute right-4 z-10 flex items-center justify-center rounded-full bg-coral text-white active:scale-90 transition-all"
          style={{ width: 52, height: 52, boxShadow: '0 6px 24px rgba(242,139,110,0.46)', bottom: '5.5rem' }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Bottom sheet — place detail */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              key={selectedPlace.id}
              initial={{ y: '108%' }}
              animate={{ y: 0 }}
              exit={{ y: '108%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
              className="absolute bottom-0 left-0 right-0 z-20 bg-white overflow-hidden"
              style={{ borderRadius: '28px 28px 0 0', boxShadow: '0 -6px 40px rgba(0,0,0,0.14)', paddingBottom: '5rem' }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-black/10" />
              </div>
              <button
                onClick={handleBackToList}
                aria-label="Back to list"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.09] flex items-center justify-center z-10 transition-colors"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
              <PlaceDetail place={selectedPlace} likedIds={likedIds} onToggleLike={toggleLike} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom nav */}
        <nav
          className="absolute bottom-0 left-0 right-0 z-10 flex justify-between items-center px-10 pb-8 pt-3.5 bg-white/96"
          style={{ backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 -4px 18px rgba(0,0,0,0.06)' }}
        >
          <button
            onClick={onHome}
            aria-label="Home"
            className="flex flex-col items-center gap-0.5 text-muted-foreground transition-all"
          >
            <Sparkles size={21} strokeWidth={2} />
            <span className="text-[9px] font-black uppercase tracking-wide">Ask</span>
          </button>
          <button
            disabled
            className="flex flex-col items-center gap-0.5 text-coral scale-110 transition-all"
          >
            <MapIcon size={21} strokeWidth={2.5} />
            <span className="text-[9px] font-black uppercase tracking-wide">Explore</span>
          </button>
          <button
            onClick={onSubmitPlace}
            aria-label="Add a place"
            className="flex flex-col items-center gap-0.5 text-muted-foreground transition-all"
          >
            <Plus size={21} strokeWidth={2} />
            <span className="text-[9px] font-black uppercase tracking-wide">Add</span>
          </button>
        </nav>
      </div>
    </>
  )
}
