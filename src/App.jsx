import { useState } from 'react'
import { usePlaces } from './hooks/usePlaces'
import PlaceCard from './components/PlaceCard'
import SearchBar from './components/SearchBar'
import FilterBar from './components/FilterBar'
import SubmitPlaceForm from './components/SubmitPlaceForm'

function App() {
  const [showForm, setShowForm] = useState(false)
  const {
    places,
    loading,
    error,
    search,
    setSearch,
    selectedStages,
    selectedAccess,
    selectedTypes,
    toggleStage,
    toggleAccess,
    toggleType,
  } = usePlaces()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Little Places 🗺️</h1>
              <p className="text-sm text-slate-400">Child-friendly spots in Seattle, by parents</p>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-sm"
            >
              {showForm ? 'Cancel' : '+ Add place'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Add a place</h2>
            <SubmitPlaceForm
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          selectedStages={selectedStages}
          selectedAccess={selectedAccess}
          selectedTypes={selectedTypes}
          onStageToggle={toggleStage}
          onAccessToggle={toggleAccess}
          onTypeToggle={toggleType}
        />

        {loading && (
          <p className="text-center text-slate-400 py-12">Loading places…</p>
        )}

        {error && (
          <p className="text-center text-red-400 py-12">Error: {error}</p>
        )}

        {!loading && !error && places.length === 0 && (
          <p className="text-center text-slate-400 py-12">No places found. Try a different search.</p>
        )}

        {!loading && !error && places.length > 0 && (
          <p className="text-xs text-slate-400">
            {places.length} {places.length === 1 ? 'place' : 'places'} found
          </p>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
