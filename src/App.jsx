import { useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Sparkles, Map, PlusCircle, Home as HomeIcon } from 'lucide-react'
import { usePlaces } from './hooks/usePlaces'
import BrowseLayout from './components/BrowseLayout'
import SubmitBottomSheet from './components/SubmitBottomSheet'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const BrandIcon = ({ className = 'w-10 h-10' }) => (
  <div className={cn('bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/20', className)}>
    <HomeIcon className="text-primary-foreground w-5 h-5" strokeWidth={2.5} />
  </div>
)

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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-card sticky top-0 z-50 border-b border-border">
        <div className="flex items-center gap-3">
          <BrandIcon />
          <span className="font-bold text-xl tracking-tight text-foreground">Little Places</span>
        </div>

        <nav className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => setShowSubmitForm(true)}
            className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-[color,background-color,box-shadow,transform] duration-100 ease-out active:scale-95 flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Add Place
          </button>
        </nav>
      </header>

      <main className="flex-1 overflow-auto pb-24 md:pb-0">
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-10 pb-8 pt-4 flex justify-between items-center z-50 shadow-lg">
        <button
          type="button"
          onClick={() => setPanelMode('ask')}
          className={cn('flex flex-col items-center gap-1 transition-[color,transform] duration-100 ease-out', panelMode === 'ask' ? 'text-primary scale-110' : 'text-muted-foreground')}
        >
          <Sparkles size={24} strokeWidth={panelMode === 'ask' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Ask</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSubmitForm(true)}
          className="relative -top-10 bg-primary text-primary-foreground p-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-[color,background-color,transform,box-shadow] duration-100 ease-out ring-4 ring-background"
          aria-label="Add a place"
        >
          <PlusCircle size={28} />
        </button>

        <button
          type="button"
          onClick={() => setPanelMode('search')}
          className={cn('flex flex-col items-center gap-1 transition-[color,transform] duration-100 ease-out', panelMode === 'search' ? 'text-secondary scale-110' : 'text-muted-foreground')}
        >
          <Map size={24} strokeWidth={panelMode === 'search' ? 2.5 : 2} />
          <span className="text-[10px] font-bold uppercase tracking-wide">Explore</span>
        </button>
      </nav>

      <SubmitBottomSheet
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  )
}

export default App
