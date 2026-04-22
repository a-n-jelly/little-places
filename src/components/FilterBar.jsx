import { STAGES, ACCESSIBILITY_TAGS, FEATURE_FILTER_CHIPS } from '../lib/constants'

export default function FilterBar({ selectedStages, selectedAccess, selectedTypes, onStageToggle, onAccessToggle, onTypeToggle }) {
  return (
    <div className="space-y-3" data-testid="filter-bar">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-1.5 shrink-0">Age</span>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStageToggle(s.id)}
              data-testid={`stage-filter-${s.id}`}
              className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors duration-100 ease-out"
              data-active={selectedStages.includes(s.id)}
              style={
                selectedStages.includes(s.id)
                  ? { background: 'var(--btn-secondary-bg)', borderColor: 'var(--btn-secondary-border)', color: 'var(--btn-secondary-text)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {s.label} {s.range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-1.5 shrink-0">Features</span>
        <div className="flex flex-wrap gap-2">
          {FEATURE_FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onAccessToggle(chip.id)}
              data-testid={`feature-filter-${chip.id}`}
              className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors duration-100 ease-out"
              data-active={selectedAccess.includes(chip.id)}
              style={
                selectedAccess.includes(chip.id)
                  ? { background: 'var(--btn-secondary-bg)', borderColor: 'var(--btn-secondary-border)', color: 'var(--btn-secondary-text)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-1.5 shrink-0">Access</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_TAGS.map((a) => (
            <button
              key={a.id}
              onClick={() => onAccessToggle(a.id)}
              data-testid={`access-filter-${a.id}`}
              className="text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors duration-100 ease-out"
              data-active={selectedAccess.includes(a.id)}
              style={
                selectedAccess.includes(a.id)
                  ? { background: 'var(--btn-secondary-bg)', borderColor: 'var(--btn-secondary-border)', color: 'var(--btn-secondary-text)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
