# PROJECT.md — Little Places
_Last updated: 2026-04-11_

## Overview

Little Places is a crowdsourced directory of child-friendly spots in Seattle, built for parents by parents. The core flow: parents open the app, ask the AI agent what to do today (or browse/filter manually), see places on a map, and submit new spots. Done looks like: the agent home screen works with real Supabase data, the map shows pinned places, and parents can submit new entries that land in the database. Events and semantic search are stretch goals for after that baseline is solid.

## Phases

- **Phase 1 — Unblock & wire up**: Clear the environment blockers, apply the schema, seed data, and verify the app actually runs end-to-end with real Supabase data
- **Phase 2 — Agent home screen**: Make AgentPanel the landing experience, wired into the real database, with the map reachable from it
- **Phase 3 — Map view**: Build the Mapbox component, connect it to live places data, and make it navigable from the agent and list views
- **Phase 4 — Submission & list polish**: Wire SubmitPlaceForm into the main app flow, fix the place count refresh, and tighten up loading/error states
- **Phase 5 — Stretch: Events & semantic search**: Events table surfaced in the agent, semantic search via pgvector

---

## Phase 1 — Unblock & wire up

## [T01] Apply database schema and seed data
**Phase:** 1 — Unblock & wire up
**Status:** done

### Goal
Run `schema.sql` and `seed.sql` in Supabase so the app has a live database with real places to work with.

### Acceptance criteria
- [ ] `places` table exists in Supabase with all columns from `schema.sql` (including `lat`, `lng`, `embedding_status`)
- [ ] `events` table exists with correct columns and foreign key to `places`
- [ ] pgvector extension is enabled (`vector` type accepted)
- [ ] All 20 seed places from `seed.sql` are present in the database
- [ ] RLS policies are in place: public read, public insert, service-role update only

### Tests to write
- No automated test — manual verification in Supabase table editor
- Integration: `getPlaces()` returns data when called with valid env vars

---

## [T02] Add environment variables and verify app starts
**Phase:** 1 — Unblock & wire up
**Status:** done

### Goal
Populate `.env` with working credentials so `pnpm dev` runs without errors.

### Acceptance criteria
- [x] `.env` contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `VITE_GEMINI_API_KEY`
- [x] `pnpm dev` starts without throwing the "Missing Supabase environment variables" error from `supabase.js`
- [x] Opening the app in a browser shows the place list (not a blank screen or console errors)
- [x] `pnpm test` passes all existing tests (FilterBar, PlaceCard, SearchBar, filtering logic)

### Tests to write
- Unit: confirm `supabase.js` throws if env vars are missing — mock `import.meta.env` in a test

---

## Phase 2 — Agent home screen

## [T03] Make AgentPanel the app's landing view
**Phase:** 2 — Agent home screen
**Status:** done

### Goal
Replace the current list-first layout in `App.jsx` with a two-screen flow: agent home by default, with a way to switch to the browse/list view.

### Acceptance criteria
- [ ] App opens on `AgentPanel` by default, not the place list
- [ ] `AgentPanel` receives an `onBrowse` prop that switches to the list view (it already has the "Browse the map →" link wired for this)
- [ ] A back/home button on the list view returns to `AgentPanel`
- [ ] No regression in existing filter/search/list behaviour

### Tests to write
- Unit (`App.test.jsx`): `AgentPanel` renders on initial mount
- Unit (`App.test.jsx`): clicking "Browse the map →" renders the place list
- Unit (`App.test.jsx`): clicking back returns to `AgentPanel`

---

## [T04] Wire AgentPanel's search_places tool to real Supabase data
**Phase:** 2 — Agent home screen
**Status:** todo

### Goal
Confirm the `search_places` tool in `AgentPanel.jsx` works end-to-end with live data and handles empty results and errors gracefully.

### Acceptance criteria
- [ ] Submitting a query like "indoor places for a toddler" returns a response that names real places from the database
- [ ] If `search_places` returns zero results, the agent response acknowledges this rather than hallucinating
- [ ] If the Supabase query errors, the agent surfaces a readable error message (not a raw stack trace)
- [ ] The `get_weather` tool returns current Seattle weather data (verify against wttr.in manually)

### Tests to write
- Unit (`AgentPanel.test.jsx`): mock `supabase` and `@anthropic-ai/sdk` — assert that a user message triggers `messages.create`, and that a `tool_use` stop reason causes `runTool` to be called
- Unit (`AgentPanel.test.jsx`): mock `runTool` returning empty places — assert the agentic loop continues and reaches `end_turn`
- Unit (`AgentPanel.test.jsx`): mock `client.messages.create` throwing — assert the error state is set

---

## [T05] Migrate AgentPanel from Anthropic SDK to Gemini
**Phase:** 2 — Agent home screen
**Status:** done — using Anthropic SDK with claude-haiku-4-5-20251001; Gemini deferred (billing issues, revisit later)
**Blocks:** Vercel deploy (T02b)

### Goal
Replace `@anthropic-ai/sdk` with the native `@google/generative-ai` SDK. The app currently has a Gemini API key but Anthropic SDK wired up — agent calls fail. Use the native SDK (not the OpenAI-compatible endpoint, which masks errors — same decision as idea-validator project).

### Acceptance criteria
- [ ] `@anthropic-ai/sdk` removed from `package.json`; `@google/generative-ai` added
- [ ] `AgentPanel.jsx` uses `GoogleGenerativeAI` client with `VITE_GEMINI_API_KEY`
- [ ] Model set to `gemini-2.0-flash`
- [ ] Tool definitions reformatted to Gemini `functionDeclarations` shape (same 3 tools: search_places, get_events, get_weather)
- [ ] Agentic loop uses Gemini chat + `functionCalls()` pattern
- [ ] `runTool()` logic unchanged
- [ ] Agent responds correctly to a query like "indoor places for a toddler"

### Tests to write
- Unit (`AgentPanel.test.jsx`): mock `@google/generative-ai` — assert a user message triggers `sendMessage`, and a function call causes `runTool` to be called
- Unit (`AgentPanel.test.jsx`): assert the model string passed matches `gemini-2.0-flash`

---

## [T02b] Deploy to Vercel
**Phase:** 2 — Agent home screen
**Status:** done
**Depends on:** T03, T05

### Goal
First live deploy. App should be functional: agent home screen works, browse/list view works, agent can query real data.

### Acceptance criteria
- [ ] Vercel project has env vars set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`, `VITE_MAPBOX_TOKEN`
- [ ] Production deploy serves the app without console errors
- [ ] Agent responds to queries using live Supabase data
- [ ] "Browse" navigates to the place list

### Notes
- Map view is not required for this deploy — "Browse the map →" routes to list view as placeholder until T06 is built

---

## Phase 3 — Map view

## [T06] Build MapView component with Mapbox
**Phase:** 3 — Map view
**Status:** todo

### Goal
Create a `MapView` component that renders a Mapbox map centred on Seattle with a marker for each place that has `lat`/`lng` coordinates.

### Acceptance criteria
- [ ] `MapView` renders a full-viewport map using `react-map-gl` and `VITE_MAPBOX_TOKEN`
- [ ] Each place with non-null `lat` and `lng` gets a marker on the map
- [ ] Markers use a colour derived from `TYPE_COLORS` matching the place type
- [ ] Clicking a marker opens a popup showing the place name, type, and address
- [ ] Places without coordinates are silently skipped (no crash)
- [ ] Map is accessible: markers have `aria-label` with the place name

### Tests to write
- Unit (`MapView.test.jsx`): mock `react-map-gl` — assert one marker renders per place with valid coords
- Unit (`MapView.test.jsx`): assert places with null `lat`/`lng` produce no marker
- Unit (`MapView.test.jsx`): clicking a marker renders a popup with the place name

---

## [T07] Connect MapView to live Supabase data
**Phase:** 3 — Map view
**Status:** todo

### Goal
`MapView` pulls places from Supabase (reusing `usePlaces`) and shows them as markers, keeping in sync with any active filters.

### Acceptance criteria
- [ ] `MapView` accepts `places` as a prop (filtered list from `usePlaces`) so it stays in sync with the FilterBar
- [ ] Map shows only the filtered subset when filters are active
- [ ] Loading state: map renders but markers appear only once data has loaded
- [ ] Error state: if `getPlaces` fails, the map still renders (empty) with an error message overlay

### Tests to write
- Unit (`MapView.test.jsx`): assert marker count matches `places.length` prop
- Integration: render `App` with MapView view active, mock Supabase returning 3 places, assert 3 markers appear

---

## [T08] Wire up navigation between MapView and AgentPanel
**Phase:** 3 — Map view
**Status:** todo

### Goal
Create a clear three-way navigation between agent view, map view, and list view so parents can move between them without getting stuck.

### Acceptance criteria
- [ ] "Browse the map →" in `AgentPanel` navigates to `MapView`
- [ ] `MapView` has a button to return to `AgentPanel` and a toggle to switch to list view
- [ ] List/browse view has a "Show map" button that opens `MapView`
- [ ] Active view is tracked in state in `App.jsx` (values: `'agent'`, `'map'`, `'list'`)
- [ ] Navigation is keyboard accessible (all buttons reachable by Tab, activated by Enter/Space)

### Tests to write
- Unit (`App.test.jsx`): assert each navigation action results in the correct view rendering
- Unit: assert no view crashes when `places` is an empty array

---

## Phase 4 — Submission & list polish

## [T09] Wire SubmitPlaceForm into the App properly
**Phase:** 4 — Submission & list polish
**Status:** todo

### Goal
Connect `SubmitPlaceForm`'s `onSuccess` callback to `usePlaces.addPlace` so a newly submitted place appears in the list immediately without a page refresh.

### Acceptance criteria
- [ ] Submitting a valid form calls `submitPlace` and the new place appears at the top of the list
- [ ] `onSuccess` is called with the returned place object, which is added via `addPlace` in `usePlaces`
- [ ] The form resets and closes after successful submission
- [ ] Form is validated: name, type, address, description are all required (already enforced in JSX with `required`)
- [ ] Submission error (e.g. Supabase down) shows the error message inside the form, not a page crash

### Tests to write
- Unit (`SubmitPlaceForm.test.jsx`): mock `submitPlace` — assert `onSuccess` is called with the returned place on success
- Unit (`SubmitPlaceForm.test.jsx`): mock `submitPlace` throwing — assert error message renders
- Unit (`SubmitPlaceForm.test.jsx`): assert form fields reset after successful submit
- Integration (`App.test.jsx`): submit a place, assert the new card appears in the list

---

## [T10] Fix lat/lng capture in SubmitPlaceForm
**Phase:** 4 — Submission & list polish
**Status:** todo

### Goal
Add geocoding (or manual lat/lng input) to `SubmitPlaceForm` so submitted places can appear as map markers.

### Acceptance criteria
- [ ] Submitted places have non-null `lat` and `lng` values stored in Supabase
- [ ] Either: address is geocoded automatically using a free geocoding API (Nominatim/OpenStreetMap), OR manual lat/lng fields are shown (simpler path)
- [ ] If geocoding fails, the place is still submitted without coordinates (marker just won't show on map)
- [ ] No API key required for geocoding (use Nominatim or similar)

### Tests to write
- Unit: mock `fetch` to Nominatim — assert `lat` and `lng` are populated on submit
- Unit: mock `fetch` failing — assert form still submits without coordinates

---

## [T11] Tighten loading, error, and empty states
**Phase:** 4 — Submission & list polish
**Status:** todo

### Goal
Ensure every data-dependent view has a clear loading state, a useful error state, and a non-confusing empty state.

### Acceptance criteria
- [ ] Place list shows a skeleton or spinner while `usePlaces` is loading (currently shows a plain text message — acceptable, but should be visually distinct)
- [ ] Error message in place list includes a "Retry" button that calls `load()` again
- [ ] Empty state text distinguishes between "no places in the DB yet" vs "no places match your filters"
- [ ] `AgentPanel` error state shows a user-readable message (already present — verify it covers network errors, not just API errors)
- [ ] `MapView` error state renders the map container (not blank) with an overlay message

### Tests to write
- Unit (`usePlaces.test.js`): mock `getPlaces` throwing — assert `error` state is set and `loading` is false
- Unit: assert retry button calls `load` again (spy on `getPlaces`)
- Unit (`App.test.jsx`): mock empty Supabase response — assert correct empty state message renders

---

## Phase 5 — Stretch: Events & semantic search

## [T12] Surface events in the AgentPanel get_events tool
**Phase:** 5 — Stretch: Events & semantic search
**Status:** todo

### Goal
Populate the `events` table with seed data and verify the `get_events` tool in `AgentPanel` returns it correctly.

### Acceptance criteria
- [ ] `events` seed SQL exists with at least 5 real weekly events at places in the seed data
- [ ] `get_events` tool returns events when called with no filters
- [ ] `get_events` tool correctly filters by `day_of_week` and `place_id`
- [ ] Agent uses event data in its response when the query is time-sensitive ("what's on this week")

### Tests to write
- Unit (`AgentPanel.test.jsx`): mock Supabase `events` query — assert `get_events` returns the correct shape
- Unit: assert `day_of_week` filter is applied when the argument is provided

---

## [T13] Implement semantic search via pgvector
**Phase:** 5 — Stretch: Events & semantic search
**Status:** todo

### Goal
Deploy the `process-embeddings` Edge Function to Supabase and add a vector similarity search query to `lib/places.js` so the agent can search by meaning, not just keywords.

### Acceptance criteria
- [ ] `process-embeddings` function is deployed and triggered on a Supabase schedule (or manually invokable)
- [ ] All seeded places have `embedding_status = 'complete'` and a non-null `embedding` after the job runs
- [ ] `lib/places.js` exports a `semanticSearch(query)` function that converts the query to a vector and returns places ordered by cosine similarity
- [ ] `AgentPanel` uses `semanticSearch` as a fallback when keyword search returns fewer than 2 results

### Tests to write
- Unit (`places.test.js`): mock the embedding API call and Supabase RPC — assert `semanticSearch` returns places sorted by similarity score
- Unit: assert `semanticSearch('')` falls back to `getPlaces()` (no empty-string embedding call)
- Note: the `process-embeddings` function currently generates a text summary rather than a true vector embedding — this needs to be updated to use an actual embedding model or a third-party embeddings API before deployment

---

## Backlog

## [TB01] Move API keys server-side
**Phase:** Backlog
**Status:** todo

### Goal
Proxy Gemini (and any other) API calls through a server-side function so keys are not exposed in the browser bundle.

### Notes
- Currently `VITE_GEMINI_API_KEY` is bundled into the client-side JS and visible in DevTools — acceptable for v1 but not for a public app with real users
- Mitigation for now: set a spending limit on the Gemini key in Google AI Studio
- Only worth building if the app goes public and key abuse becomes a real risk — not needed for personal/demo use
- Likely implementation: Vercel Edge Functions or a small API route that the frontend calls instead of hitting the AI provider directly
