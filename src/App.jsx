import { useState } from 'react'
import { usePlaces } from './hooks/usePlaces'
import AgentPanel from './components/AgentPanel'
import BrowseLayout from './components/BrowseLayout'

function App() {
  const [view, setView] = useState('agent') // 'agent' | 'map'
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

  if (view === 'agent') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-100">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Little Places 🗺️</h1>
            <p className="text-sm text-slate-400">Child-friendly spots in Seattle, by parents</p>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4">
          <AgentPanel onBrowse={() => setView('map')} />
        </main>
      </div>
    )
  }

  return (
    <BrowseLayout
      places={places}
      loading={loading}
      error={error}
      search={search}
      setSearch={setSearch}
      selectedStages={selectedStages}
      selectedAccess={selectedAccess}
      selectedTypes={selectedTypes}
      onStageToggle={toggleStage}
      onAccessToggle={toggleAccess}
      onTypeToggle={toggleType}
      onHome={() => setView('agent')}
    />
  )
}

export default App
