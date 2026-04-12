import { useState } from 'react'
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
}

export default function SubmitPlaceForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const place = await submitPlace(form)
      setForm(EMPTY_FORM)
      onSuccess?.(place)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Place name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="e.g. Green Lake Park"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
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

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Address <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          placeholder="e.g. 7201 E Green Lake Dr N, Seattle"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          required
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
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit place'}
        </button>
      </div>
    </form>
  )
}
