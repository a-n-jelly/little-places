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
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Place name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={venueQuery}
          onChange={handleVenueQueryChange}
          placeholder="Search for a venue…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          autoComplete="off"
        />
        {venueSearching && (
          <p className="text-xs text-slate-400 mt-1">Searching…</p>
        )}
        {venueResults.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-md text-sm overflow-hidden">
            {venueResults.map((v) => (
              <li key={v.place_id}>
                <button
                  type="button"
                  onClick={() => selectVenue(v)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 truncate"
                >
                  {v.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {venueSelected && (
          <p className="text-xs text-green-600 mt-1">✓ Location found</p>
        )}
      </div>

      {/* Address — auto-filled, editable */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Address <span className="text-slate-400 font-normal">(auto-filled)</span>
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="Auto-filled when you select a venue"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Type <span className="text-red-400">*</span>
        </label>
        <select
          required
          value={form.type}
          onChange={(e) => setField('type', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="">Select a type…</option>
          {PLACE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="What makes this place great for kids?"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      </div>

      {/* Developmental stages */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Good for which ages?
        </label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleArrayField('stages', s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                form.stages.includes(s.id)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {s.label} <span className="opacity-60">{s.range}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Accessibility features
        </label>
        <div className="flex flex-wrap gap-2">
          {ACCESSIBILITY_TAGS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => toggleArrayField('accessibility', a.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                form.accessibility.includes(a.id)
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* General tags */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Facilities & features
        </label>
        <div className="flex flex-wrap gap-2">
          {PLACE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleArrayField('tags', tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                form.tags.includes(tag)
                  ? 'bg-slate-700 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Submitted by */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Your name <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.submitted_by}
          onChange={(e) => setField('submitted_by', e.target.value)}
          placeholder="First name or nickname"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit place'}
        </button>
      </div>
    </form>
  )
}
