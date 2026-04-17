# Little Places — project.md

Crowdsourced family-friendly directory for Seattle. The app parents actually needed instead of a cluttered Google Maps list: real place data, live weather, and an AI agent that gives a direct answer rather than a list of 20 options.

**Stack:** React + Vite + Tailwind + Supabase + Anthropic SDK + Mapbox

## Problem

Google Maps doesn't know what a Changing Places facility is. Recommendations are scattered across Facebook groups and subreddits. Blogs go stale. A tired parent doesn't have bandwidth to cross-reference all of it, check the weather, and figure out what's actually on this week.

## Vision

Ask the agent "what should we do today?" and get one good answer — grounded in a live database, real weather, and what's happening this week. For parents who want to explore rather than ask, Browse mode is there.

## Phases

- **V1 — Where can I go?** *(current)* — places, map, filters, agent, submissions
- **V2 — What can I do?** — events surfaced through the agent
- **V3 — Plan my day** — full day itinerary combining places, events, weather

## Parking lot

Items considered but deferred. Revisit when V1 ships.

| Item | Why deferred |
|---|---|
| User accounts | Adds friction; spam not yet a problem |
| Server-side filtering | Not needed until 500+ places |
| Map pins for events | Events need agent context to be useful; pins add noise |
| Move API keys server-side (TB01) | Spending limits are acceptable mitigation for personal/demo use; revisit before public launch |

## Decisions log

### Agent-first home screen, not list or map (2026-04)
The app opens on an AI agent, not a place list or map. Parents don't want to browse — they want an answer. "What should we do today?" is the real question. Browse mode is still reachable for when you want to explore.

### Agentic loop with tools, not a plain LLM call (2026-04)
The agent calls tools (search_places, get_weather, get_events) and gets real data before responding. The LLM has no knowledge of our specific places — any answer without tools would be hallucinated. Live data also means places, events, and weather stay current.

### Anthropic SDK for the agent (2026-04)
Using `@anthropic-ai/sdk` with Claude Haiku. Evaluated Gemini but hit free tier quota issues during development. Pragmatic choice — revisit if costs become a concern at scale.

### Client-side filtering (2026-04)
All places fetched on load, filtered in the `usePlaces` hook. Simple and fast at current data size (20–100 places). Supabase queries in `lib/places.js` are structured to make server-side migration straightforward when needed.

### Events only via agent, never on the map (2026-04)
Events are time-sensitive and context-dependent. Showing them as map pins without agent context adds noise without value.

### Accessibility as a first-class filter (2026-04)
Changing Places, sensory-friendly, autism-friendly, quiet spaces, wheelchair access, blue badge parking are built into the core data model and filter UI from the start. Parents with accessibility requirements have the hardest time finding suitable places — this is the problem the app is most useful for.

### No user accounts in v1 (2026-04)
Accounts add friction and complexity. Anyone can submit a place without signing in. Add moderation if spam becomes a problem — not before.
