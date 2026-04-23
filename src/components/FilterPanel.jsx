import { useState } from 'react'
import { STAGES, ACCESSIBILITY_TAGS } from '../lib/constants'

function FilterGroup({ title, activeCount, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors duration-100 ease-out"
      >
        <span>{title}</span>
        <span className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)' }}
            >
              {activeCount}
            </span>
          )}
          <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  )
}

function Checkbox({ id, label, checked, onChange, color }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(id)}
        className="rounded border-border text-primary focus:ring-ring cursor-pointer"
      />
      {color && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-100 ease-out">
        {label}
      </span>
    </label>
  )
}

export default function FilterPanel({
  selectedStages,
  selectedAccess,
  selectedTypes,
  onStageToggle,
  onAccessToggle,
  onTypeToggle,
}) {
  return (
    <div className="border-y border-border bg-card">
      <FilterGroup title="Age" activeCount={selectedStages.length}>
        {STAGES.map((s) => (
          <Checkbox
            key={s.id}
            id={s.id}
            label={s.label}
            checked={selectedStages.includes(s.id)}
            onChange={onStageToggle}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Accessibility" activeCount={selectedAccess.length}>
        {ACCESSIBILITY_TAGS.map((a) => (
          <Checkbox
            key={a.id}
            id={a.id}
            label={a.label}
            checked={selectedAccess.includes(a.id)}
            onChange={onAccessToggle}
          />
        ))}
      </FilterGroup>
    </div>
  )
}
