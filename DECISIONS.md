# Decisions Log

Architectural and product decisions, with rationale. Most recent first.

---

## Explore map as the only page; Ask AI in the agent panel

**Date:** 2026-04

We still lead with **agent-first** product thinking — parents want answers, not raw lists — but the **app shell** is a single primary screen: **Explore** (map + list). That keeps the map and the agent on the same page so we can connect focus, recommendations, and follow-up naturally (one surface, not hand-off between unrelated routes).

**Ask AI** (the conversational agent) lives in the **agent panel** on Explore, not as a separate home screen. The map is not competing with a different “home”; Explore *is* the app.

---

## Agent-first home screen, not a list or map

**Date:** 2026-04 · **Update:** 2026-04

The app opens on an AI agent, not a place list or map. Parents don't want to browse — they want an answer. "What should we do today?" is the real question, and a list of 20 places doesn't answer it. The agent does: it checks the weather, looks at the database, and gives one clear recommendation with context.

Browse mode (list + eventually map) is still there, reachable from the agent. It's for when you want to explore rather than ask.

**Update:** We refined the shell: the primary UI is now Explore (map) as the single page, with Ask AI in the agent panel on that page — see the decision above. The agent-first *value* stands; the *navigation model* changed so agent and map connect easily.

---

## Agentic loop with tools, not a plain LLM call

**Date:** 2026-04

The agent uses a full agentic loop — it calls tools, gets real data, then responds — rather than just asking an LLM to generate an answer from its training data.

This matters because:

- **Accuracy** — the LLM has no knowledge of our specific places, so any answer without tools would be hallucinated or generic Seattle advice
- **Live data** — places, events, and weather change; training data doesn't
- **Filtering** — the `search_places` tool applies real database filters (age stage, accessibility) so recommendations are actually relevant to the user's situation

The tradeoff is latency (one round-trip per tool call) but for this use case a slightly slower, accurate answer beats a fast, wrong one.

---

## Anthropic API for the agent

**Date:** 2026-04

Using `@anthropic-ai/sdk` with Claude Haiku. We evaluated Gemini (Google AI) but ran into free tier quota issues during development — the quota was effectively zero without billing fully propagating. Anthropic's billing and API access were more straightforward to get working.

This is a pragmatic choice, not a strong preference. Either would work technically. Revisit if costs become a concern at scale.

---

## Client-side filtering (for now)

**Date:** 2026-04

All places are fetched on load and filtered in the `usePlaces` hook in the browser. This is simple and fast for the current data size (20–100 places).

Will need to move to server-side pagination and filtering once the database grows. The Supabase queries in `lib/places.js` are already structured to make this migration straightforward.

---

## Events only via agent, never on the map

**Date:** 2026-04

Events are time-sensitive and context-dependent — they're only useful if the agent can explain them ("there's a toddler story time at this library on Monday mornings"). Showing them as map pins or list items without that context adds noise without value.

---

## Accessibility as a first-class filter

**Date:** 2026-04

Accessibility needs (Changing Places, sensory-friendly, autism-friendly, quiet spaces, wheelchair access, blue badge parking) are built into the core data model and filter UI, not added as an afterthought. Parents with accessibility requirements often have the hardest time finding suitable places — this is the problem the app is most useful for.

---

## No user accounts in v1

**Date:** 2026-04

Accounts add friction and complexity. Anyone can submit a place without signing in. If spam or quality control becomes a problem, that's the point to add moderation — not before.