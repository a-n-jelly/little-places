import { useState } from 'react'
import { usePlaces } from './hooks/usePlaces'
import BrowseLayout from './components/BrowseLayout'
import SubmitBottomSheet from './components/SubmitBottomSheet'

function App() {
  const [panelMode, setPanelMode] = useState('search')
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

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col font-sans text-foreground">
      <main className="flex-1 overflow-hidden">
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
          onSubmitPlace={() => setShowSubmitForm(true)}
          panelMode={panelMode}
          setPanelMode={setPanelMode}
        />
      </main>

      <SubmitBottomSheet
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  )
}

export default App
