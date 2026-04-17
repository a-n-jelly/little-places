# Little Places

Crowdsourced family-friendly directory for Seattle.

## Stack
React + Vite + Tailwind + Supabase + Anthropic SDK + Mapbox

## Design rules (DO NOT CHANGE)
- UI iteration and layout: follow `.claude/skills/little-places-design/SKILL.md` (mirrored at `.cursor/skills/little-places-design/` for Cursor).
- Home screen: AgentPanel by default — never the map.
- Two modes: Agent and Browse. Map is primary in Browse, list on the side.
- Events surface via agent ONLY — never on the map or as browse items.
- Mobile first. No user accounts for v1.
- Palette: `src/styles/theme.css` — don't hardcode colours.

## Protected files (no modification without tests)
`PlaceCard.jsx`, `FilterBar.jsx`, `SearchBar.jsx`, `usePlaces.js`, `places.js`, `constants.js`

Run `npm test` before every commit. Never push failing tests.

## Files
- `project.md` — PRD, phases, parking lot, decisions log (open on demand only)
- `state.md` — current status, branch, test count, recent ships and decisions (read every session)
- `plan.md` — active ticket: goal, acceptance criteria, open questions (read every session)
- `backlog.md` — prioritised queue, max 15 items (open when picking next ticket)
- `observations.md` — raw notes; process with /triage
