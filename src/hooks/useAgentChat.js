import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export const AGENT_TOOLS = [
  {
    name: 'search_places',
    description:
      'Search the Little Places database for child-friendly spots in Seattle. ' +
      'Use this to find parks, cafes, museums, playgrounds, and other family-friendly venues. ' +
      'You can filter by keyword, age stages, and specific child-friendly features.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search term to match against place name, description, address, or type',
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
            'Child-friendly features to filter by. ' +
            'Playground/Park: climbing, swings, splash-pad, baby-swings, enclosed-outdoor-space, sand-pit, nature-play, paved-paths, shade, restrooms-nearby, stroller-friendly, beach-access, picnic-area, swimming. ' +
            'Café: high-chairs, kids-menu, booster-seats, changing-table, stroller-friendly, outdoor-seating, crayons-activities, noise-tolerant, kids-eat-free, nursing-room. ' +
            'Museum/Attraction: hands-on-exhibits, kids-programs, interactive-displays, family-discount, free-entry, sensory-friendly, soft-play, toddler-sessions, age-sections, cafe-on-site, party-rooms, adult-seating, socks-required, nursing-room. ' +
            'Library: storytime, kids-section, quiet-room, family-events, free-entry, reading-programs, maker-space, multilingual, cafe-on-site, sensory-sessions.',
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
    name: 'get_place_detail',
    description:
      'Get full details for a specific place including community tips from parents. ' +
      'Use this when you want to explain why a place is child-friendly or share what parents say about it.',
    parameters: {
      type: 'object',
      properties: {
        place_id: {
          type: 'string',
          description: 'The UUID of the place to fetch details for',
        },
      },
      required: ['place_id'],
    },
  },
  {
    name: 'get_events',
    description:
      'Get upcoming events at Little Places venues in Seattle. ' +
      'Returns recurring weekly events and one-off events happening today or this week.',
    parameters: {
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
      "Get current weather and today's forecast for Seattle. " +
      'Use this to factor weather into recommendations (e.g. suggest indoor venues if raining).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

export async function runAgentTool(name, input) {
  if (name === 'search_places') {
    const { keyword, stages = [], child_friendly_features = [], limit = 5 } = input

    let query = supabase
      .from('places')
      .select('id, name, type, address, description, stages, child_friendly_features, rating, lat, lng')
      .limit(limit)

    if (keyword?.trim()) {
      query = query.or(
        `name.ilike.%${keyword}%,description.ilike.%${keyword}%,type.ilike.%${keyword}%,address.ilike.%${keyword}%`
      )
    }
    if (stages.length > 0) query = query.overlaps('stages', stages)
    if (child_friendly_features.length > 0) query = query.contains('child_friendly_features', child_friendly_features)

    const { data, error } = await query
    if (error) return { error: error.message }
    return { places: data ?? [] }
  }

  if (name === 'get_place_detail') {
    const { place_id } = input
    const [placeRes, tipsRes] = await Promise.all([
      supabase
        .from('places')
        .select('id, name, type, address, description, stages, child_friendly_features')
        .eq('id', place_id)
        .single(),
      supabase
        .from('tips')
        .select('tip_text, display_name')
        .eq('place_id', place_id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])
    if (placeRes.error) return { error: placeRes.error.message }
    return { place: placeRes.data, tips: tipsRes.data ?? [] }
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
      query = query.or(`day_of_week.eq.${day_of_week},and(recurrence.eq.one-off,date.gte.${today},date.lte.${weekFromNow})`)
    } else {
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

export function useAgentChat() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [foundPlaces, setFoundPlaces] = useState([])

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)
    setFoundPlaces([])

    try {
      console.log('[agent] query', trimmed)

      const model = genAI.getGenerativeModel({
        model: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: AGENT_TOOLS }],
      })

      const chat = model.startChat()
      let result = await chat.sendMessage(trimmed)

      const MAX_ROUNDS = 5
      let rounds = 0

      while (rounds < MAX_ROUNDS) {
        const functionCalls = result.response.functionCalls()

        if (!functionCalls || functionCalls.length === 0) {
          const text = result.response.text()
          console.log('[agent] response (round %d)', rounds, text)
          setResponse(text)
          break
        }

        console.log('[agent] round %d — %d tool call(s)', rounds, functionCalls.length)
        const toolResults = await Promise.all(
          functionCalls.map(async (fc) => {
            console.log('[agent] tool call', fc.name, fc.args)
            const response = await runAgentTool(fc.name, fc.args)
            console.log('[agent] tool result', fc.name, response)
            if (fc.name === 'search_places' && response.places?.length === 0) {
              response.message = 'No places found matching those criteria. Let the user know and suggest they try broader search terms or a different category.'
            }
            return { functionResponse: { name: fc.name, response } }
          })
        )

        const newPlaces = toolResults
          .filter(r => r.functionResponse.name === 'search_places')
          .flatMap(r => r.functionResponse.response?.places ?? [])
        if (newPlaces.length > 0) {
          setFoundPlaces(prev => {
            const ids = new Set(prev.map(p => p.id))
            return [...prev, ...newPlaces.filter(p => !ids.has(p.id))]
          })
        }

        result = await chat.sendMessage(toolResults)
        rounds++
      }

      if (rounds === MAX_ROUNDS) {
        console.warn('[agent] hit MAX_ROUNDS (%d) — aborting', MAX_ROUNDS)
        setError('Something went wrong — please try again.')
      }
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return {
    query,
    setQuery,
    response,
    loading,
    error,
    handleSubmit,
    foundPlaces,
  }
}
