import { useState, useRef } from 'react'
import { submitPlace, submitTip } from '../lib/places'
import { STAGES, FEATURE_VOCAB, PLACE_TYPES } from '../lib/constants'
import { supabase } from '../lib/supabase'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SEATTLE_PROXIMITY = '-122.3321,47.6062'

const MAPBOX_TYPE_MAP = {
  park: 'Park',
  playground: 'Playground',
  beach: 'Beach',
  farm: 'Farm',
  cafe: 'Café',
  coffee_shop: 'Café',
  restaurant: 'Restaurant',
  bar: 'Bar',
  bakery: 'Bakery',
  museum: 'Museum',
  library: 'Library',
  aquarium: 'Aquarium',
  zoo: 'Zoo',
  amusement_park: 'Indoor Play',
  tourist_attraction: 'Attraction',
  attraction: 'Attraction',
}

const EMPTY_FORM = {
  name: '',
  type: '',
  address: '',
  stages: [],
  child_friendly_features: [],
  submitted_by: '',
  tip_text: '',
  display_name: '',
  lat: null,
  lng: null,
}

export default function SubmitPlaceForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(() => {
    let storedName = ''
    try { storedName = localStorage.getItem('little-places-display-name') ?? '' } catch {}
    return { ...EMPTY_FORM, display_name: storedName }
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [venueQuery, setVenueQuery] = useState('')
  const [venueResults, setVenueResults] = useState([])
  const [venueSearching, setVenueSearching] = useState(false)
  const [venueSelected, setVenueSelected] = useState(false)
  const debounceRef = useRef(null)
  const sessionTokenRef = useRef(crypto.randomUUID())

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleArrayField(field, id) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id)
        ? f[field].filter((v) => v !== id)
        : [...f[field], id],
    }))
  }

  function handleVenueQueryChange(e) {
    const q = e.target.value
    setVenueQuery(q)
    setVenueSelected(false)
    setField('name', q)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim() || q.length < 3) {
      setVenueResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setVenueSearching(true)
      try {
        const res = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(q)}&access_token=${MAPBOX_TOKEN}&session_token=${sessionTokenRef.current}&country=us&proximity=${SEATTLE_PROXIMITY}&limit=5&language=en`
        )
        const data = await res.json()
        setVenueResults(data.suggestions ?? [])
      } catch {
        setVenueResults([])
      } finally {
        setVenueSearching(false)
      }
    }, 400)
  }

  async function selectVenue(suggestion) {
    setVenueSearching(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${MAPBOX_TOKEN}&session_token=${sessionTokenRef.current}`
      )
      const data = await res.json()
      const feature = data.features?.[0]
      const props = feature?.properties ?? {}
      const [lng, lat] = feature?.geometry?.coordinates ?? [null, null]
      const matchedType = (props.poi_category_ids ?? []).map(c => MAPBOX_TYPE_MAP[c]).find(Boolean) ?? null
      setVenueQuery(suggestion.name)
      setForm((f) => ({
        ...f,
        name: suggestion.name,
        address: (() => {
          const full = props.full_address ?? ''
          const withoutName = full.startsWith(suggestion.name)
            ? full.slice(suggestion.name.length).replace(/^,\s*/, '')
            : full
          const raw = withoutName || props.place_formatted || suggestion.place_formatted || ''
          return raw
            .replace(/\s*\d{5}(-\d{4})?/g, '')   // strip zip code
            .replace(/,?\s*United States\s*/g, '') // strip country
            .replace(/,\s*$/, '')                  // clean trailing comma
            .trim()
        })(),
        lat: lat ?? null,
        lng: lng ?? null,
        ...(matchedType ? { type: matchedType } : {}),
      }))
      setVenueResults([])
      setVenueSelected(true)
      sessionTokenRef.current = crypto.randomUUID()
    } catch {
      setVenueResults([])
    } finally {
      setVenueSearching(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { tip_text, display_name, ...placeData } = form
      const place = await submitPlace(placeData)
      if (tip_text.trim()) {
        await submitTip(place.id, tip_text.trim(), display_name)
      }
      supabase.functions.invoke('enrich-place', {
        body: {
          place_id: place.id,
          feature_vocab: FEATURE_VOCAB[placeData.type] ?? [],
        },
      }).catch(() => {})
      if (display_name.trim()) {
        try { localStorage.setItem('little-places-display-name', display_name.trim()) } catch {}
      }
      setForm({ ...EMPTY_FORM, display_name: display_name.trim() })
      setVenueQuery('')
      setVenueSelected(false)
      onSuccess?.(place)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Venue search */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1">
          Place name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          required
          value={venueQuery}
          onChange={handleVenueQueryChange}
          placeholder="Search for a venue…"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/50 text-foreground"
          autoComplete="off"
        />
        {venueSearching && (
          <p className="text-xs text-muted-foreground mt-1">Searching…</p>
        )}
        {venueResults.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-sm text-sm overflow-hidden">
            {venueResults.map((s) => (
              <li key={s.mapbox_id}>
                <button
                  type="button"
                  onClick={() => selectVenue(s)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted text-foreground truncate transition-colors duration-100 ease-out"
                >
                  {s.name}{s.place_formatted ? `, ${s.place_formatted}` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
        {venueSelected && (
          <p className="text-xs text-secondary mt-1 font-medium">✓ Location found</p>
        )}
      </div>

      {/* Address — auto-filled, editable */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Address <span className="text-muted-foreground font-normal">(auto-filled)</span>
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="Auto-filled when you select a venue"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/50 text-muted-foreground"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Type <span className="text-destructive">*</span>
        </label>
        <select
          required
          value={form.type}
          onChange={(e) => setField('type', e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">Select a type…</option>
          {PLACE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Tips */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Your tip <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.tip_text}
          onChange={(e) => setField('tip_text', e.target.value)}
          placeholder="e.g. There's a dedicated baby swing and the café has high chairs inside."
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 resize-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Developmental stages */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Good for which ages?
        </label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleArrayField('stages', s.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-100 ease-out"
              style={
                form.stages.includes(s.id)
                  ? { background: 'var(--btn-selected-bg)', borderColor: 'var(--btn-selected-border)', color: 'var(--btn-selected-text)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {s.label} <span className="opacity-60">{s.range}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      {form.type && FEATURE_VOCAB[form.type] && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Features
          </label>
          <div className="flex flex-wrap gap-2">
            {FEATURE_VOCAB[form.type].map((feature) => (
              <button
                key={feature}
                type="button"
                onClick={() => toggleArrayField('child_friendly_features', feature)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-100 ease-out"
                style={
                  form.child_friendly_features.includes(feature)
                    ? { background: 'var(--foreground)', borderColor: 'var(--foreground)', color: 'var(--background)' }
                    : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {feature}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Display name (persisted in localStorage, used for tip attribution) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Your name <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.display_name}
          onChange={(e) => setField('display_name', e.target.value)}
          placeholder="e.g. Mama Bear or Dad of 2"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/50 text-foreground"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors duration-100 ease-out"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 active:scale-[0.98] transition-[color,background-color,transform,opacity,box-shadow] duration-100 ease-out"
          style={{ boxShadow: 'var(--shadow-brand)' }}
        >
          {submitting ? 'Submitting…' : 'Submit place'}
        </button>
      </div>
    </form>
  )
}
