import { useState, useRef, useEffect } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../lib/supabase'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const TOOLS = [
  {
    name: 'search_places',
    description:
      'Search the Little Places database for child-friendly spots in Seattle. ' +
      'Use this to find parks, cafes, museums, playgrounds, and other family-friendly venues. ' +
      'You can filter by keyword, age stages, and accessibility requirements.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search term to match against place name, description, or type',
        },
        stages: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Age stages to filter by. Options: baby, toddler, preschool, bigkids, tweens',
        },
        accessibility: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Accessibility requirements. Options: wheelchair, changing_places, sensory_friendly, autism_friendly, quiet_space, blue_badge',
        },
        limit: {
          type: 'number',
          description: 'Max number of results to return (default 5)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_events',
    description:
      'Get upcoming events at Little Places venues in Seattle. ' +
      'Returns recurring weekly events and one-off events happening today or this week.',
    input_schema: {
      type: 'object',
      properties: {
        day_of_week: {
          type: 'string',
          description:
            'Filter recurring events by day (e.g. "Monday"). If omitted, returns all events this week.',
        },
        place_id: {
          type: 'string',
          description: 'Filter events for a specific place by its UUID',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_weather',
    description:
      'Get current weather and today\'s forecast for Seattle. ' +
      'Use this to factor weather into recommendations (e.g. suggest indoor venues if raining).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

async function runTool(name, input) {
  if (name === 'search_places') {
    const { keyword, stages = [], accessibility = [], limit = 5 } = input

    let query = supabase
      .from('places')
      .select('id, name, type, address, description, stages, accessibility, rating, lat, lng')
      .limit(limit)

    if (keyword?.trim()) {
      query = query.or(
        `name.ilike.%${keyword}%,description.ilike.%${keyword}%,type.ilike.%${keyword}%`
      )
    }
    if (stages.length > 0) query = query.overlaps('stages', stages)
    if (accessibility.length > 0) query = query.contains('accessibility', accessibility)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { places: data ?? [] }
  }

  if (name === 'get_events') {
    const { day_of_week, place_id } = input
    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    let query = supabase
      .from('events')
      .select(
        'id, title, time, day_of_week, age_range, cost, recurrence, date, description, place_id, places(name, address)'
      )

    if (place_id) query = query.eq('place_id', place_id)

    if (day_of_week) {
      // Recurring events on a specific day
      query = query.or(`day_of_week.eq.${day_of_week},and(recurrence.eq.one-off,date.gte.${today},date.lte.${weekFromNow})`)
    } else {
      // All recurring + one-off events this week
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      query = query.or(`recurrence.in.(weekly,monthly),and(recurrence.eq.one-off,date.gte.${today},date.lte.${weekFromNow})`)
    }

    const { data, error } = await query
    if (error) return { error: error.message }
    return { events: data ?? [] }
  }

  if (name === 'get_weather') {
    try {
      const res = await fetch('https://wttr.in/Seattle?format=j1')
      const json = await res.json()
      const current = json.current_condition?.[0]
      const today = json.weather?.[0]

      return {
        current: {
          temp_c: current?.temp_C,
          feels_like_c: current?.FeelsLikeC,
          description: current?.weatherDesc?.[0]?.value,
          humidity: current?.humidity,
        },
        today: {
          max_temp_c: today?.maxtempC,
          min_temp_c: today?.mintempC,
          description: today?.hourly?.[4]?.weatherDesc?.[0]?.value,
          rain_chance: today?.hourly?.[4]?.chanceofrain,
        },
      }
    } catch {
      return { error: 'Could not fetch weather' }
    }
  }

  return { error: `Unknown tool: ${name}` }
}

const SYSTEM_PROMPT = `You are a friendly local guide for Little Places — a curated list of child-friendly spots in Seattle, maintained by parents for parents.

Your job is to help parents figure out what to do with their kids today. When someone asks a question:
1. Use your tools to get relevant places, events, and weather.
2. Give one clear, warm recommendation or a simple day plan — not an exhaustive list.
3. Be specific: name the place, mention why it fits, note anything practical (parking, cost, age suitability).
4. Keep it conversational. You're a knowledgeable friend, not a search engine.

If the weather is bad, lean toward indoor options. If they mention a specific age or need, use that to filter.
Don't hedge or over-qualify. Just give them a good answer.`

export default function AgentPanel({ onBrowse, onSubmitPlace }) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const messages = [{ role: 'user', content: trimmed }]

      // Agentic loop — keep going until Claude stops using tools
      while (true) {
        const res = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        })

        messages.push({ role: 'assistant', content: res.content })

        if (res.stop_reason === 'end_turn') {
          const text = res.content.find((b) => b.type === 'text')?.text ?? ''
          setResponse(text)
          break
        }

        if (res.stop_reason === 'tool_use') {
          const toolResults = []

          for (const block of res.content) {
            if (block.type !== 'tool_use') continue
            const result = await runTool(block.name, block.input)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            })
          }

          messages.push({ role: 'user', content: toolResults })
          continue
        }

        // Unexpected stop reason
        break
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 relative">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">
          What are you looking for today?
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Ask me anything — I'll factor in weather, events, and your kids' ages.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. somewhere indoors for a toddler on a rainy day"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Thinking
              </span>
            ) : (
              'Ask'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-6 rounded-xl border border-slate-100 bg-white px-5 py-4 text-sm text-slate-700 leading-relaxed shadow-sm whitespace-pre-wrap">
            {response}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={onBrowse}
            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Browse the map →
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onSubmitPlace}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center text-2xl z-30"
        aria-label="Add a place"
      >
        +
      </button>
    </div>
  )
}
