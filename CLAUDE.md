# Little Places

Crowdsourced family-friendly directory for Seattle.

## Stack

React + Vite + Tailwind + Supabase + Anthropic SDK + Mapbox

## Design rules (DO NOT CHANGE)

- UI iteration and layout: follow `.claude/skills/little-places-design/SKILL.md` (mirrored at `.cursor/skills/little-places-design/` for Cursor). **Responsive QA:** breakpoint table, per-surface checklist, and viewport smoke (`npm run test:e2e`) live in that skill.
- **Single primary page:** Explore (map + list). The app is centred on this view so the map and agent stay connected on one surface.
- **Agent-first value:** Recommendations and answers still come through the agent; **Ask AI** lives in the **agent panel** on Explore (not a separate “home” route).
- **Explore layout:** map is primary; list supports selection and scanning on the side.
- Events surface via agent ONLY — never on the map or as browse items.
- Mobile first. No user accounts for v1.
- Palette: `src/styles/theme.css` — don't hardcode colours.

## Protected files (no modification without tests)

`PlaceCard.jsx`, `FilterBar.jsx`, `SearchBar.jsx`, `usePlaces.js`, `places.js`, `constants.js`

Run `npm test` before every commit. Never push failing tests.

## Files

- `project.md` — PRD, phases, parking lot, decisions log (open on demand only)
- `state.md` — current status, branch, test count, recent ships and decisions (read every session)
- `plan.md` — active ticket: goal, acceptance criteria, open questions (read every session); local only — not committed (see `.gitignore`)
- `backlog.md` — prioritised queue, max 15 items (open when picking next ticket)
- `observations.md` — raw notes; process with /triage