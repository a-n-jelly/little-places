import { useState } from 'react'
import { usePlaces } from './hooks/usePlaces'
import AgentPanel from './components/AgentPanel'
import BrowseLayout from './components/BrowseLayout'
import SubmitBottomSheet from './components/SubmitBottomSheet'

function App() {
  const [view, setView] = useState('agent') // 'agent' | 'map'
  const [showSubmitForm, setShowSubmitForm] = useState(false)
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
    addPlace,
  } = usePlaces()

  function handleSubmitSuccess(place) {
    addPlace(place)
    setShowSubmitForm(false)
  }

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
          <AgentPanel onBrowse={() => setView('map')} onSubmitPlace={() => setShowSubmitForm(true)} />
        </main>
        <SubmitBottomSheet
          isOpen={showSubmitForm}
          onClose={() => setShowSubmitForm(false)}
          onSuccess={handleSubmitSuccess}
        />
      </div>
    )
  }

  return (
    <>
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
        onSubmitPlace={() => setShowSubmitForm(true)}
      />
      <SubmitBottomSheet
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        onSuccess={handleSubmitSuccess}
      />
    </>
  )
}

export default App
