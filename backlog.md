# Backlog

Format: `T## | P# | type | Goal`
Priority: P1 = do next (high impact, small effort) | P2 = scope into ticket | P3 = tail
Cap: 15 items max. Run /triage to add from observations.md.

Each ticket answers: what's the problem, how will you know it's done, any known constraints.
Model: Haiku = mechanical/single-file | Sonnet = default | Opus = ambiguous architecture or hard debugging
Plan: yes = touches 3+ files or has meaningful risk of getting approach wrong first

---

T04 | P1 | bug | Design empty and error states in sidebar
- Visible: no-results state and API error state are unstyled or missing
- Done: no-results shows a friendly message; error state has a retry action; both match the app design
- Constraint: agent 503/429 errors should show a friendly message too (not a broken UI)
- Model: Haiku · Plan: no

T17 | P1 | design | Redesign map pins — rounded non-active, classic pin active; no selection tooltip
- Visible: active/inactive pin shapes are not differentiated; tooltip appears on select
- Done: non-active pins are rounded dots; active pin is classic teardrop shape; no tooltip on selection
- Constraint: categorical colours stay the same; `MapView` component
- Superseded by: **T26** — ring + stem idle pins, selected red + inner disc, tokens in `theme.css` (`--marker-selected` #FF4444, `--cat-*`); close T17 when T26 is shipped
- Model: Sonnet · Plan: no

T18 | P1 | bug | Selected map marker hidden when zooming out
- Visible: select a place, zoom out — marker disappears behind others
- Done: selected marker always renders above all other markers at any zoom level
- Model: Haiku · Plan: no

T16 | P1 | design | Clean up Browse nav and search layout
- Visible: duplicate nav bar appears in side panel; search is not adjacent to filters
- Done: one nav bar; search sits at top of side panel next to filters; no duplicate elements
- Constraint: mobile layout must still work
- May conflict with: T28-T30 (search moving to bottom bar — confirm scope before starting)
- Model: Sonnet · Plan: no (but confirm T28-T30 scope first)

T33 | P1 | feature | Replace description input with tips; derive description via AI
- Visible: description box asks users for a paragraph they won't write; AI-enriched descriptions on existing places were batch-generated, not user-contributed
- Done: form has a Tips field (free-text, first-person hints); `description` in DB is AI-derived from tips + place name + type on submit; PlaceCard renders derived description; tips stored separately
- Constraint: `PlaceCard.jsx` and `places.js` are protected; DB schema change needed (`tips` column); enrichment model choice TBD
- Model: Opus · Plan: yes

T34 | P1 | feature | Auto-generate description + derive features when a place is added
- Visible: new places have no description or structured features until background job runs
- Done: `process-embeddings` edge function fetches the place's tips, calls Claude Sonnet to (1) derive a warm 1–2 sentence description from name + type + tips, (2) extract `child_friendly_features` from tip text mapped to `FEATURE_VOCAB` for that place type; writes both back to `places`
- Constraint: tips table must exist (T33); description nullable; `FEATURE_VOCAB` from `constants.js` must be passed to the edge function prompt; Supabase service-role key required
- Model: Sonnet · Plan: yes

T35 | P1 | chore | Remove feature chips from Add Place form
- Visible: form shows feature chip selectors that will now be AI-derived (T34), creating false expectation that user selection matters
- Done: feature chip section removed from `SubmitPlaceForm.jsx`; `child_friendly_features` removed from form state and not sent on submit; `SubmitPlaceForm.test.jsx` updated; all tests pass
- Constraint: `places.js` `submitPlace` spreads form data — ensure `child_friendly_features` is not included; `FilterBar` and `PlaceCard` feature display unchanged (still read from DB)
- Model: Haiku · Plan: no

~~T03~~ | Superseded by: T32 (Mapbox Search Box API replaces current search; partial match resolved as side effect)

T02 | P3 | bug | Fix layout reflow shake when resizing across `md` breakpoint
- Visible: resize browser across the `md` breakpoint on Explore — layout shakes or jumps
- Done: smooth transition, no reflow jump; `npm run test:e2e` passes viewport smoke
- Constraint: `BrowseLayout` and map container are likely culprits; breakpoints documented in design skill
- Note: deprioritised — users unlikely to resize between mobile and desktop
- Model: Sonnet · Plan: no

T08 | P2 | bug | Fix animations — identify which transitions are broken or missing and fix them
- Model: Sonnet · Plan: no

T09 | P2 | feature | Fix filter/search persistence when navigating via map pin clicks
- Visible (v1 scope): unclear what map pin click should do beyond opening detail
- Done (v1 / incremental): tapping a map pin **opens the place in the sidebar detail** (same as list row select); filters and search query unchanged for now — do **not** require clearing search, resetting chips, or list scroll in this ticket yet
- Later: persist filter/search/scroll explicitly once behaviour is specified
- Model: Sonnet · Plan: yes

T10 | P2 | feature | Design agent response UI — spec needed before ticketing
- Model: Opus · Plan: yes

T07 | P2 | feature | Clarify and implement favourites — what does it do? Needs decision first
- Model: Opus · Plan: yes

T12 | P2 | feature | Add user feedback mechanism — what kind? Needs decision first
- Model: Sonnet · Plan: yes

T26 | P2 | design | Map marker visuals, category colours from theme, basemap style
- **Source of truth:** map marker category colours and tints live in `theme.css` (`--cat-*`, `--cat-indoor-play`, `--cat-other`, selection `--marker-selected` #FF4444 and related tokens — **not** `--destructive`). `PlaceCard`, `BrowseLayout`, and `MapView` use `placeTypeColorVar` / `placeTypeIconSurface` — **no** duplicate hex palettes in components
- Visible: pins and list/detail chips should read clearly on the map; selection should be obvious at a glance
- Done:
  - **Idle:** ring marker — `fill` white (`var(--card)`), **category-coloured ring** (`stroke` + `RING_STROKE`), **emoji** centred (proportional size), **short stem** to map anchor; **no** `title` tooltip on the marker button
  - **Selected:** solid **`--marker-selected`** head + **lighter inner disc** (raised-button look), **no emoji**, stem in selection red; **spring** scale + slight **upward** motion on select; **shape-aware** `filter: drop-shadow` only (no rectangular `box-shadow` on the pin wrapper)
  - **Basemap:** `MAP_STYLE` constant in `MapView.jsx` (`mapbox://styles/...`); change that one string to swap styles
  - **Types → buckets:** `PLACE_TYPE_CAT` in `constants.js` (e.g. Indoor Play → `indoor-play`, unknown → `other`)
- Constraint: align with DECISIONS.md / state.md; supersedes T17 for map pin spec; `MapView` is primary
- Model: Sonnet · Plan: yes

T27 | P2 | design | Map marker interaction behaviour — zoom collapse and selection states
- **Blocked until:** zoom-tier behaviour is **split into spec** (per-zoom thresholds and what “collapse” means — simplified glyph vs clustering); larger than initially scoped — **ship after T26, T18, and other agreed map tickets**
- Groups: collision detection at low zoom + selection state treatment
- Visible: at low zoom all 8 category markers render simultaneously creating visual noise; no visual hierarchy when a marker is selected
- Done (target): tiered zoom behaviour per spec; selected marker shows red with glow (`--marker-selected`); all other markers desaturate slightly on selection where spec says so; selected marker must always render above others (see T18)
- Constraint: prerequisite T26; Mapbox GL JS collision detection when implementing tiers
- Model: Sonnet · Plan: yes

T05 | P3 | bug | Remove out-of-Seattle data — understand why it's there first
- Model: Haiku · Plan: no

T15 | P3 | idea | Per-type emoji/icon beyond PLACE_TYPES — revisit when google_types is persisted
- Model: Haiku · Plan: no

## Parked — needs decision before ticketing
- Chat input: single-line vs conversation flow
- Trust design: how do we establish data credibility for users
- User verification: how can users confirm a place is accurate
- ~~Tag capture~~ — decided: freeform text is primary; structured tags are AI-derived for filtering only
