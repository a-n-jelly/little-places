# Backlog

Format: `T## | P# | type | Goal — "source"`
Priority: P1 = do next (high impact, small effort) | P2 = scope into ticket | P3 = tail
Cap: 15 items max. Run /triage to add from observations.md.

Each ticket answers: what's the problem, how will you know it's done, any known constraints.

---

T02 | P1 | bug | Fix layout reflow shake when resizing across `md` breakpoint
- Visible: resize browser across the `md` breakpoint on Explore — layout shakes or jumps
- Done: smooth transition, no reflow jump; `npm run test:e2e` passes viewport smoke
- Constraint: `BrowseLayout` and map container are likely culprits; breakpoints documented in design skill

T03 | P1 | bug | Fix add-place search returning exact matches only
- Visible: searching for a place by partial name returns no results
- Done: partial/fuzzy name match returns relevant results
- Constraint: `SearchBar.jsx` is protected

T04 | P1 | bug | Design empty and error states in sidebar
- Visible: no-results state and API error state are unstyled or missing
- Done: no-results shows a friendly message; error state has a retry action; both match the app design
- Constraint: agent 503/429 errors should show a friendly message too (not a broken UI)

T16 | P1 | design | Clean up Browse nav and search layout
- Visible: duplicate nav bar appears in side panel; search is not adjacent to filters
- Done: one nav bar; search sits at top of side panel next to filters; no duplicate elements
- Constraint: mobile layout must still work

T17 | P1 | design | Redesign map pins — rounded non-active, classic pin active; no selection tooltip
- Visible: active/inactive pin shapes are not differentiated; tooltip appears on select
- Done: non-active pins are rounded dots; active pin is classic teardrop shape; no tooltip on selection
- Constraint: categorical colours stay the same; `MapView` component

T18 | P1 | bug | Selected map marker hidden when zooming out
- Visible: select a place, zoom out — marker disappears behind others
- Done: selected marker always renders above all other markers at any zoom level

T19 | P1 | bug | Agent tool description missing feature tags
- Visible: agent can't filter by baby-swings, climbing, swings, splash-pad, fenced etc.
- Done: `AGENT_TOOLS` child_friendly_features list includes all tags from `FEATURE_VOCAB` in enrichment scripts
- Constraint: keep list in sync with `FEATURE_VOCAB`; check `src/lib/agent.js` or similar

---

T08 | P2 | bug | Fix animations — identify which transitions are broken or missing and fix them
T09 | P2 | feature | Fix filter/search persistence when navigating via map pin clicks
T10 | P2 | feature | Design agent response UI — spec needed before ticketing
T07 | P2 | feature | Clarify and implement favourites — what does it do? Needs decision first
T12 | P2 | feature | Add user feedback mechanism — what kind? Needs decision first
T14 | P2 | data | Improve place descriptions — richer, specific text is the primary asset for agent reasoning; bad descriptions degrade agent quality
T20 | P2 | data | Audit feature tags in Supabase — verify places have playground features populated; sufficient for filter bar, don't need to be exhaustive
T13 | P3 | feature | Clean and consolidate place tags — low priority; tags are derived scaffolding, not the long-term data model

T05 | P3 | bug | Remove out-of-Seattle data — understand why it's there first
T15 | P3 | idea | Per-type emoji/icon beyond PLACE_TYPES — revisit when google_types is persisted
T21 | P3 | tooling | Convert /triage command to a skill

## Parked — needs decision before ticketing
- Chat input: single-line vs conversation flow
- Trust design: how do we establish data credibility for users
- User verification: how can users confirm a place is accurate
- ~~Tag capture~~ — decided: freeform text is primary; structured tags are AI-derived for filtering only
