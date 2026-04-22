# Little Places 🌿

Seattle has no shortage of things to do with kids. Finding the right one, for the right age, on a rainy Tuesday morning when your toddler has energy to burn — that's a different problem.

Little Places is a curated, AI-powered guide to child-friendly venues in Seattle, built for parents who need an answer now, not a list to research later.

---

## The problem

Parents are already solving this problem in Facebook and Reddit groups, asking the same questions over and over. Every ask starts from zero. Someone has to respond, the seeker scrolls through comments hoping something fits their situation. There's no memory, no structure, no way to query what the community already knows. It's exhausting to maintain, and the knowledge doesn't compound.

---

## Why not Google Maps?

Google Maps Ask exists. But it pulls from Google reviews, which are customer feedback, not parent intelligence. "Great pizza, a bit noisy" tells you nothing about whether there's space for a stroller, changing facilities in the men's toilets, or whether a 3-year-old will survive the wait.

Little Places is built around a specific community with a specific question. When the context is that intentional, the information people contribute reflects it.

---

## What I built

A map-first interface with an AI agent powering search and recommendations. The agent connects to live data — venues, events, weather — so responses draw from real information, not model training data.

The original design was agent-first. I pivoted to map-first after realising that agent reliability depends on data quality: the map gives users something they can trust while the data layer matures. That was the right call.

**Stack:** React, Vite, Tailwind, Supabase, Anthropic SDK, Gemini, Mapbox  
**Built with:** Claude Code and Cursor

---

## Product decisions worth knowing

**Agent answers, map browses.** Most parents don't want a raw list — they want to be told what to do. The agent handles recommendations and questions; the Explore map handles discovery. They live on the same page so the context stays connected.

**No accounts for v1.** Anyone can submit a place. Reducing friction on contribution matters more than attribution right now.

**Mobile-first.** Designed for a parent with one hand and a buggy.

**Events only through the agent, never on the map.** Browsing and asking "what's on today" are different jobs. Keeping them separate avoids cluttering the browse experience with time-sensitive data that needs context to be useful.

**Client-side filtering.** Filters respond instantly without a round-trip to Supabase.

**Type filtering belongs to the agent, not the UI.** The filter bar surfaces child-friendly features (stroller access, high chairs, free entry) — things a parent actually filters on. Place type is a search-time concern, handled by the agent. A parent asking "where can I take a rainy-day toddler" shouldn't have to know whether they want a Museum or an Attraction first.

**Data quality over feature velocity.** The 320 places in the database came from a Google Places pipeline, enriched with reviews and structured features. That work happened before most of the UI was built. A good agent is only as useful as the data it queries.

---

---

## What's built

- Explore (map + list) with Ask AI in the agent panel and an agentic tool loop (places, events, weather)
- Filters: developmental stage (Baby through Tweens), child-friendly features (stroller-friendly, high-chairs, and more)
- 15 place types with categorical map pins
- Crowdsourced submissions, live in Supabase
- 320 real places in the database
- 337 unit tests

## What's next

**Currently working on**
- Design iteration based on early feedback
- Editing and updating existing place submissions
- Information verification — surfacing how current and reliable a listing is
- Agent evals — a simple framework for measuring whether the agent is actually giving good answers

**Phase 2 — What can I do?**  
Events and activities surfaced through the agent, so you can ask what's actually on this week — not just where to go, but what's happening when you get there.

**Phase 3 — Plan my day**  
Itinerary planning — the agent combines places, events, and weather into a full day recommendation.

---

*Built in Seattle, by a parent who doesn't have the bandwidth to plan. 🌿*
