import { useState } from 'react'
import MapView from './MapView'
import FilterPanel from './FilterPanel'
import PlaceCard from './PlaceCard'
import SearchBar from './SearchBar'

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
  onHome,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null)
  // Mobile bottom sheet: 'peek' | 'list' | 'detail'
  const [sheetState, setSheetState] = useState('peek')

  function handleSelectPlace(place) {
    setSelectedPlace(place)
    setSheetState('detail')
  }

  function handleBackToList() {
    setSelectedPlace(null)
    setSheetState('list')
  }

  const filterProps = {
    selectedStages,
    selectedAccess,
    selectedTypes,
    onStageToggle,
    onAccessToggle,
    onTypeToggle,
  }

  // ── Sidebar content ──────────────────────────────────────────────────────
  const sidebarContent = selectedPlace ? (
    <div className="flex flex-col h-full">
      <button
        onClick={handleBackToList}
        className="flex items-center gap-1 px-4 py-3 text-sm text-green-600 hover:text-green-700 font-medium border-b border-slate-100"
      >
        ← Back to list
      </button>
      <div className="overflow-y-auto flex-1 p-4">
        <PlaceCard place={selectedPlace} />
      </div>
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-100">
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <FilterPanel {...filterProps} />
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {loading && (
          <p className="text-center text-slate-400 py-8 text-sm">Loading…</p>
        )}
        {error && (
          <p className="text-center text-red-400 py-8 text-sm">Error: {error}</p>
        )}
        {!loading && !error && places.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">
            No places match your filters.
          </p>
        )}
        {!loading && !error && places.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onClick={handleSelectPlace}
          />
        ))}
      </div>
    </div>
  )

  // ── Mobile bottom sheet heights ──────────────────────────────────────────
  const sheetHeights = {
    peek: 'h-16',
    list: 'h-[60vh]',
    detail: 'h-[70vh]',
  }

  return (
    <>
      {/* ── Desktop layout ─────────────────────────────────────────────── */}
      <div className="hidden md:flex h-screen">
        {/* Header + sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
            <div>
              <h1 className="text-lg font-bold text-slate-800">Little Places 🗺️</h1>
              <p className="text-xs text-slate-400">Seattle, for families</p>
            </div>
            <button
              onClick={onHome}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Home
            </button>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            {sidebarContent}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView places={places} onSelectPlace={handleSelectPlace} />
        </div>
      </div>

      {/* ── Mobile layout ──────────────────────────────────────────────── */}
      <div className="md:hidden relative h-screen">
        {/* Map fills screen */}
        <div className="absolute inset-0">
          <MapView places={places} onSelectPlace={handleSelectPlace} />
        </div>

        {/* Home button overlay */}
        <button
          onClick={onHome}
          className="absolute top-4 left-4 z-10 bg-white rounded-full px-3 py-1.5 text-sm text-slate-600 shadow-md border border-slate-200"
        >
          ← Home
        </button>

        {/* Bottom sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-10 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ${sheetHeights[sheetState]} flex flex-col`}
        >
          {/* Drag handle + toggle */}
          <button
            onClick={() => setSheetState((s) => s === 'peek' ? 'list' : 'peek')}
            className="flex flex-col items-center pt-3 pb-2 w-full"
            aria-label={sheetState === 'peek' ? 'Show place list' : 'Collapse'}
          >
            <span className="w-10 h-1 bg-slate-200 rounded-full" />
            {sheetState === 'peek' && (
              <span className="text-xs text-slate-400 mt-1.5">
                {loading ? 'Loading…' : `${places.length} places`}
              </span>
            )}
          </button>

          {/* Sheet content */}
          {sheetState !== 'peek' && (
            <div className="flex-1 overflow-hidden">
              {sheetState === 'detail' && selectedPlace ? (
                <div className="flex flex-col h-full">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-1 px-4 py-2 text-sm text-green-600 font-medium border-b border-slate-100"
                  >
                    ← Back to list
                  </button>
                  <div className="overflow-y-auto flex-1 p-3">
                    <PlaceCard place={selectedPlace} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-slate-100">
                    <SearchBar value={search} onChange={setSearch} />
                  </div>
                  <FilterPanel {...filterProps} />
                  <div className="overflow-y-auto flex-1 p-3 space-y-2">
                    {places.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        onClick={handleSelectPlace}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
