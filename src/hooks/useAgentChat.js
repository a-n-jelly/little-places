import { useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../lib/supabase'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

export const AGENT_TOOLS = [
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
      "Get current weather and today's forecast for Seattle. " +
      'Use this to factor weather into recommendations (e.g. suggest indoor venues if raining).',
    input_schema: {
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

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const messages = [{ role: 'user', content: trimmed }]

      while (true) {
        const res = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: AGENT_TOOLS,
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
            const result = await runAgentTool(block.name, block.input)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            })
          }

          messages.push({ role: 'user', content: toolResults })
          continue
        }

        break
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
  }
}
