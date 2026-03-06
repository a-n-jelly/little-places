import { STAGES, ACCESSIBILITY_TAGS } from '../lib/constants'

export default function FilterBar({ selectedStages, selectedAccess, onStageToggle, onAccessToggle }) {
  return (
    <div className="space-y-2" data-testid="filter-bar">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Age:</span>
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => onStageToggle(s.id)}
            data-testid={`stage-filter-${s.id}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              selectedStages.includes(s.id)
                ? 'bg-green-50 border-green-600 text-green-700'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Access:</span>
        {ACCESSIBILITY_TAGS.map((a) => (
          <button
            key={a.id}
            onClick={() => onAccessToggle(a.id)}
            data-testid={`access-filter-${a.id}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              selectedAccess.includes(a.id)
                ? 'bg-blue-50 border-blue-600 text-blue-700'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
