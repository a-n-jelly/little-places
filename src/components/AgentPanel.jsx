import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Search, Sparkles, CloudRain, Sun, Accessibility } from 'lucide-react'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../lib/supabase'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const SUGGESTIONS = [
  { label: 'Rainy day toddler', icon: CloudRain, color: 'bg-secondary text-secondary-foreground' },
  { label: 'Free this weekend', icon: Sun, color: 'bg-accent text-accent-foreground' },
  { label: 'Sensory friendly', icon: Accessibility, color: 'bg-primary text-primary-foreground' },
]


function IllustrationPlaceholder() {
  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-sky to-accent/30 rounded-2xl" />
      <svg viewBox="0 0 400 100" className="absolute bottom-0 w-full" preserveAspectRatio="none">
        <path d="M0 80 Q80 55 160 70 Q240 85 320 60 Q370 45 400 65 L400 100 L0 100Z" fill="var(--sage)" fillOpacity="0.35" />
        <path d="M0 90 Q100 70 200 80 Q300 90 400 78 L400 100 L0 100Z" fill="var(--sage)" fillOpacity="0.5" />
      </svg>
      <svg viewBox="0 0 60 90" className="absolute bottom-4 right-16 h-20 opacity-20">
        <path d="M28 85V45L25 30H35L32 45V85H28Z" fill="var(--foreground)" />
        <path d="M18 35C18 28 22 22 30 22C38 22 42 28 42 35H18Z" fill="var(--foreground)" />
        <circle cx="30" cy="20" r="4" fill="var(--foreground)" />
      </svg>
      <svg viewBox="0 0 100 80" className="relative h-16 mb-1 opacity-40">
        <circle cx="28" cy="28" r="8" fill="var(--sage)" />
        <path d="M20 42C20 36 23 34 28 34C33 34 36 36 36 42V58H20V42Z" fill="var(--sage)" />
        <path d="M36 50H60L65 38C65 34 60 32 56 32H48" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="58" r="5" stroke="var(--foreground)" strokeWidth="2.5" fill="none" />
        <circle cx="60" cy="58" r="5" stroke="var(--foreground)" strokeWidth="2.5" fill="none" />
      </svg>
    </div>
  )
}

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
        child_friendly_features: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Child-friendly features to filter by. Options: wheelchair, changing_places, sensory_friendly, autism_friendly, quiet_space, blue_badge',
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
    const { keyword, stages = [], child_friendly_features = [], limit = 5 } = input

    let query = supabase
      .from('places')
      .select('id, name, type, address, description, stages, child_friendly_features, rating, lat, lng')
      .limit(limit)

    if (keyword?.trim()) {
      query = query.or(
        `name.ilike.%${keyword}%,description.ilike.%${keyword}%,type.ilike.%${keyword}%`
      )
    }
    if (stages.length > 0) query = query.overlaps('stages', stages)
    if (child_friendly_features.length > 0) query = query.contains('child_friendly_features', child_friendly_features)

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
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center px-6 py-10 text-center md:justify-center overflow-y-auto pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full max-w-sm h-28 md:h-36 rounded-2xl overflow-hidden relative"
          >
            <IllustrationPlaceholder />
          </motion.div>
        </div>

        <header className="mb-8 px-4">
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tight mb-4">
            Where should we go?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
            Discover the best Seattle spots for kids, curated by parents who've been there.
          </p>
        </header>

        {/* Search */}
        <div className="relative group max-w-xl mx-auto mb-6 px-2">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-[3rem] blur-3xl opacity-100 transition-opacity duration-700" />
          <form
            onSubmit={handleSubmit}
            className="relative bg-card rounded-[2rem] p-1.5 shadow-2xl border-2 border-black/5 flex items-center gap-1 transition-[transform,box-shadow,border-color] duration-150 ease-out focus-within:scale-[1.02] focus-within:ring-8 focus-within:ring-primary/10 focus-within:border-primary/30"
          >
            <div className="pl-5 text-primary">
              <Search size={22} strokeWidth={3} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="A rainy day activity near Ballard..."
              className="flex-1 bg-transparent px-2 py-4 text-base md:text-lg outline-none placeholder:text-muted-foreground/50 font-medium text-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="bg-primary text-primary-foreground px-6 md:px-8 py-4 rounded-[1.5rem] font-black text-base shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform,box-shadow,opacity] duration-100 ease-out flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Ask</span>
                </>
              ) : (
                <>
                  <span>Ask</span>
                  <Sparkles size={18} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-4 mx-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {response && (
          <div className="mb-6 mx-2 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-foreground leading-relaxed shadow-sm whitespace-pre-wrap text-left">
            {response}
          </div>
        )}

        {/* Suggestion chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <p className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Popular searches</p>
          {SUGGESTIONS.map((s, idx) => (
            <motion.button
              key={s.label}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.05, transition: { type: 'tween', duration: 0.12, ease: 'easeOut' } }}
              whileTap={{ scale: 0.95, transition: { type: 'tween', duration: 0.08 } }}
              onClick={() => setQuery(s.label)}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm border border-white/50', s.color)}
            >
              <s.icon size={16} strokeWidth={2.5} />
              {s.label}
            </motion.button>
          ))}
        </div>

        <div>
          <button
            onClick={onBrowse}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-100 ease-out"
          >
            Browse the map →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
