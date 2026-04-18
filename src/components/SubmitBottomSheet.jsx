import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import SubmitPlaceForm from './SubmitPlaceForm'

export default function SubmitBottomSheet({ isOpen, onClose, onSuccess }) {
  function handleSuccess(place) {
    onSuccess?.(place)
    onClose()
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40" style={{ background: 'var(--overlay)' }} />
        <Drawer.Content className="bg-card flex flex-col rounded-t-3xl fixed bottom-0 left-0 right-0 z-50 outline-none min-h-0 h-[min(85dvh,720px)] border-t border-border/60 shadow-lg md:bottom-6 md:left-1/2 md:right-auto md:w-[min(36rem,calc(100%-2rem))] md:-translate-x-1/2 md:rounded-3xl md:border md:border-border/60">
          <Drawer.Title className="sr-only">Add a place</Drawer.Title>
          <Drawer.Description className="sr-only">Submit a child-friendly spot to Little Places.</Drawer.Description>

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0">
            <h2 className="text-base font-bold text-foreground">Add a place</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors duration-100 ease-out"
              aria-label="Close"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable form — width constrained on wide viewports; full width on small screens */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
            <div className="mx-auto w-full max-w-xl md:max-w-[min(36rem,70vw)]">
              <SubmitPlaceForm onSuccess={handleSuccess} />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
