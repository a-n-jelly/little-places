# Little Places 🌿

When I lived in London, there was a Google Maps list doing the rounds with hundreds of baby-friendly spots, crowdsourced by parents. Nobody could agree on what "baby-friendly" meant, the notes were inconsistent, and there was no way to filter for the thing you actually needed. A changing table. A quiet room. Somewhere that wouldn't judge you for a meltdown. Seattle has the same problem, and a Google Maps list with the same vibes.

Little Places is what that list should have been.

**Stack:** React + Vite + Tailwind + Supabase + Anthropic API + Mapbox

---

## The problem

Google Maps doesn't know what a Changing Places facility is. Facebook groups and subreddits are full of recommendations but not in a single place. Blogs go stale. And a tired parent doesn't have bandwidth to cross-reference all of it, check the weather, and figure out whether today is an indoor or outdoor situation.

---

## Why can't I just ask ChatGPT?

You can. It'll give you a confident list of places that may or may not still exist, with no idea what the weather is doing today, no knowledge of your kid's age, and no connection to what other Seattle parents actually recommend.

If you're tech savvy, you could build an LLM project, feed it your list, and get reasonable answers — but you'd be maintaining that data yourself, it would go stale the moment a place closes, and it still wouldn't know what the weather is doing or what's actually on this week.

Little Places uses an agent, not just a language model. When you ask it a question, it queries a live database of parent-vetted spots, checks current Seattle weather, and pulls real events happening this week. The answer is grounded in data that updates, not a document you last edited three months ago.

---

## Product decisions worth knowing

**Agent-first, not map-first.** Most parents don't want to browse — they want to be told what to do. The default experience is a conversation. Browse mode is there for when they do want to explore.

**Function over polish for v1.** The design will be revisited, but the structural decisions were made with that in mind to avoid a full refactor when that time comes.

**No accounts for v1.** Anyone can submit a place. Reducing friction on contribution matters more than attribution right now.

**Mobile-first.** Designed for a parent with one hand and a buggy.

**Events only in the agent, never on the map.** Browsing a map and asking "what's on today" are different jobs. Keeping them separate avoids cluttering the browse experience with time-sensitive data that needs context to be useful.

**Client-side filtering.** Filters respond instantly without a round-trip to Supabase.

---

## What's built

- AI agent home screen with agentic tool loop (places, events, weather). *Currently seeded with dummy data. Plans to add community submission are in place*
- Mapbox map view with sidebar, desktop and mobile
- Filters: developmental stage (Baby through Tweens), accessibility, place type
- Crowdsourced submissions, live in Supabase *Built but no data currently added through live submissions*
- 39 unit tests

## What's next

**V1 — Where can I go?** *(current)*
Child and family-friendly places in Seattle, vetted by parents. Ask the agent or browse the map. Filter by age, accessibility, and type. Submit a spot you love so other parents can find it too.

**V2 — What can I do?**
Events and activities surfaced through the agent, so you can ask what's actually on this week — not just where to go, but what's happening when you get there.

**V3 — Plan my day**
Itinerary planning — the agent combines places, events, and weather into a full day recommendation.

---

See [DECISIONS.md](DECISIONS.md) for product,design and architectural decisions and their rationale. 
See [EVAL.md](EVAL.md) for how we measure whether the agent is actually giving good answers. (Draft 1)

*Built in Seattle, by a parent who doesn't have the bandwith to plan. 🌿*
