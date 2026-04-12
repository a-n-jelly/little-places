import { STAGES, ACCESSIBILITY_TAGS, PLACE_TYPES, TYPE_COLORS } from '../lib/constants'

export default function FilterBar({ selectedStages, selectedAccess, selectedTypes, onStageToggle, onAccessToggle, onTypeToggle }) {
  return (
    <div className="space-y-3" data-testid="filter-bar">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1.5 shrink-0">Age</span>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => onStageToggle(s.id)}
              data-testid={`stage-filter-${s.id}`}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                selectedStages.includes(s.id)
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1.5 shrink-0">Type</span>
        <div className="flex flex-wrap gap-2">
          {PLACE_TYPES.map((type) => {
            const color = TYPE_COLORS[type]
            const active = selectedTypes.includes(type)
            return (
              <button
                key={type}
                onClick={() => onTypeToggle(type)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                  active ? '' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
                style={active
                  ? { background: color + '22', borderColor: color, color }
                  : {}
                }
                data-active={active}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-1.5 shrink-0">Access</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_TAGS.map((a) => (
            <button
              key={a.id}
              onClick={() => onAccessToggle(a.id)}
              data-testid={`access-filter-${a.id}`}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                selectedAccess.includes(a.id)
                  ? 'bg-teal-50 border-teal-500 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
