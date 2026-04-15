# Little Places 🌿

Crowdsourced AI-powered directory of child and family-friendly 
places in Seattle. Built for parents, by parents.

## Stack
React + Vite + Tailwind + Supabase + Anthropic API + Mapbox

## Design Decisions (do not change without discussion)
- Agent is the home screen entry point — not the map
- Two modes: Agent mode (default) and Browse mode
- Map is primary in Browse mode, place list on the side
- Events only surface via the agent — never shown on the map
- Mobile first
- No user accounts for v1

## Palette
See `src/styles/theme.css` for all design tokens.

## What's Built — Do Not Modify Without Running Tests
- src/components/PlaceCard.jsx
- src/components/FilterBar.jsx
- src/components/SearchBar.jsx
- src/hooks/usePlaces.js
- src/lib/places.js
- src/lib/constants.js

## Tests
35 tests passing. Run `npm test` before every commit.
Never push if tests are failing.

## What Needs Building Next
See plan.md for current sprint and next actions, if plan.md does not exist, then head to project.md for the next item and tell me. 