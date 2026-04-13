# Little Places 🌿

When I lived in London, there was a Google Maps list doing the rounds — hundreds of baby-friendly spots, crowdsourced by parents. Nobody could agree on what "baby-friendly" meant, the notes were inconsistent, and there was no way to filter for the thing you actually needed. A changing table. A quiet room. Somewhere that wouldn't judge you for a meltdown. Seattle has the same problem, and a Google Maps list with the same vibes.

Little Places is what that list should have been.

**Stack:** React + Vite + Tailwind + Supabase + Anthropic API + Mapbox

---

## The problem

Google Maps doesn't know what a Changing Places facility is. Facebook groups are full of recommendations with no useful detail. Blogs go stale. And a tired parent doesn't have bandwidth to cross-reference all of it, check the weather, and figure out whether today is an indoor or outdoor situation.

---

## Why can't I just ask ChatGPT?

You could build a project, feed it your list, and get reasonable answers — but you'd be maintaining that data yourself, it would go stale the moment a place closes, and it still wouldn't know what the weather is doing or what's actually on this week.

Little Places uses an agent, not just a language model. When you ask it a question, it queries a live database of parent-vetted spots, checks current Seattle weather, and pulls real events happening this week. The answer is grounded in data that updates, not a document you last edited three months ago.

---

## Product decisions worth knowing

**Agent-first, not map-first.** Most parents don't want to browse — they want to be told what to do. The default experience is a conversation. Browse mode is there for when they do want to explore.

**Accessibility as structure.** Changing Places, sensory-friendly, autism-friendly, quiet spaces are first-class filters. The London list taught me that unstructured data is as good as no data.

**No accounts for v1.** Anyone can submit a place. Reducing friction on contribution matters more than attribution right now.

---

## What's built

- AI agent home screen with agentic tool loop (places, events, weather)
- Mapbox map view with sidebar, desktop and mobile
- Filters: developmental stage (Baby through Tweens), accessibility, place type
- Crowdsourced submissions, live in Supabase
- 39 unit tests

## What's next

- Place submission wired into the map view
- Geocoding so submitted places appear as markers
- Events surfaced through the agent
- Semantic search via pgvector

---

See [DECISIONS.md](DECISIONS.md) for architectural decisions and their rationale.
See [EVAL.md](EVAL.md) for how we measure whether the agent is actually giving good answers.

*Built in Seattle, by a parent who still misses that London list. Just not what it became. 🌿*
