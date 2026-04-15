import { useState, useRef } from 'react'
import { submitPlace } from '../lib/places'
import { STAGES, ACCESSIBILITY_TAGS, PLACE_TAGS, PLACE_TYPES } from '../lib/constants'

const EMPTY_FORM = {
  name: '',
  type: '',
  address: '',
  description: '',
  stages: [],
  accessibility: [],
  tags: [],
  submitted_by: '',
  lat: null,
  lng: null,
}

export default function SubmitPlaceForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Venue search state
  const [venueQuery, setVenueQuery] = useState('')
  const [venueResults, setVenueResults] = useState([])
  const [venueSearching, setVenueSearching] = useState(false)
  const [venueSelected, setVenueSelected] = useState(false)
  const debounceRef = useRef(null)

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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Seattle')}&format=json&limit=5&countrycodes=us`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data = await res.json()
        setVenueResults(data)
      } catch {
        setVenueResults([])
      } finally {
        setVenueSearching(false)
      }
    }, 400)
  }

  function selectVenue(venue) {
    const displayName = venue.display_name.split(',').slice(0, 3).join(',')
    setVenueQuery(venue.display_name.split(',')[0])
    setForm((f) => ({
      ...f,
      name: venue.display_name.split(',')[0],
      address: displayName,
      lat: parseFloat(venue.lat),
      lng: parseFloat(venue.lon),
    }))
    setVenueResults([])
    setVenueSelected(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const place = await submitPlace(form)
      setForm(EMPTY_FORM)
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
            {venueResults.map((v) => (
              <li key={v.place_id}>
                <button
                  type="button"
                  onClick={() => selectVenue(v)}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted text-foreground truncate transition-colors"
                >
                  {v.display_name}
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

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="What makes this place great for kids?"
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
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
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

      {/* Accessibility */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Accessibility features
        </label>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_TAGS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleArrayField('accessibility', a.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={
                form.accessibility.includes(a.id)
                  ? { background: 'var(--btn-secondary-bg)', borderColor: 'var(--btn-secondary-border)', color: 'var(--btn-secondary-text)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* General tags */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Facilities &amp; features
        </label>
        <div className="flex flex-wrap gap-2">
          {PLACE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleArrayField('tags', tag)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={
                form.tags.includes(tag)
                  ? { background: 'var(--foreground)', borderColor: 'var(--foreground)', color: 'var(--background)' }
                  : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Submitted by */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Your name <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.submitted_by}
          onChange={(e) => setField('submitted_by', e.target.value)}
          placeholder="First name or nickname"
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
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
          style={{ boxShadow: 'var(--shadow-coral)' }}
        >
          {submitting ? 'Submitting…' : 'Submit place'}
        </button>
      </div>
    </form>
  )
}
