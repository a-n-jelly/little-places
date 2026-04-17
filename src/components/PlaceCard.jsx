import { STAGES, ACCESSIBILITY_TAGS, TYPE_COLORS } from '../lib/constants'

export default function PlaceCard({ place, onClick }) {
  const color = TYPE_COLORS[place.type] || TYPE_COLORS.Other

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(place)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(place)}
      data-testid="place-card"
      className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow duration-100 ease-out cursor-pointer border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: color + '33', color }}
          >
            {place.type?.toUpperCase()}
          </span>
          <h3 className="mt-2 text-base font-bold text-foreground">{place.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">📍 {place.address}</p>
        </div>
        {place.rating > 0 && (
          <span className="text-yellow text-sm">
            {'★'.repeat(Math.floor(place.rating))}
            <span className="text-muted-foreground ml-1">{place.rating}</span>
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
        {place.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {place.stages?.map((s) => {
          const stage = STAGES.find((st) => st.id === s)
          return (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)' }}
            >
              {stage?.label}
            </span>
          )
        })}
        {place.child_friendly_features?.slice(0, 2).map((a) => {
          const tag = ACCESSIBILITY_TAGS.find((t) => t.id === a)
          return (
            <span
              key={a}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--btn-selected-bg)', color: 'var(--btn-selected-text)' }}
            >
              {tag?.label}
            </span>
          )
        })}
      </div>

      {place.submitted_by && (
        <p className="text-xs text-muted-foreground/50 mt-3">Added by {place.submitted_by}</p>
      )}
    </div>
  )
}
