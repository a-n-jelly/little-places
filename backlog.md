# Backlog

Format: `T## | P# | type | Goal`
Priority: P1 = do next (high impact, small effort) | P2 = scope into ticket | P3 = tail
Cap: 15 items max. Run /triage to add from observations.md.

Each ticket answers: what's the problem, how will you know it's done, any known constraints.
Model: Haiku = mechanical/single-file | Sonnet = default | Opus = ambiguous architecture or hard debugging
Plan: yes = touches 3+ files or has meaningful risk of getting approach wrong first

---

~~T37~~ ✅ shipped — mobile bottom sheet + top search/Ask AI bar
~~T36~~ ✅ shipped — auto-refresh PlaceDetail after enrichment
~~T04~~ ✅ shipped — empty and error states
~~T18~~ ✅ shipped — selected marker z-index
~~T16~~ ✅ shipped — browse nav + search layout
~~T33~~ ✅ shipped — tips replace description input; AI derives description
~~T34~~ ✅ shipped — auto-enrich on place add
~~T35~~ ✅ shipped — add tip from PlaceDetail
~~T03~~ | Superseded by: T32

T41 | P1 | feature | Social proof — show tip count on PlaceListRow
- Visible: tips are hidden behind a tap; no signal that a place has community input
- Done: PlaceListRow shows "X tips" badge when tips_count > 0; count comes from a `tips_count` column (Supabase function or denormalised) or a quick join; visible on desktop sidebar and mobile sheet
- Constraint: BrowseLayout.jsx and places.js are protected — read before editing; avoid N+1 queries; if join is complex, denormalise with a DB trigger
- Model: Haiku · Plan: no

T42 | P2 | feature | Agent tip synthesis — surface community tips naturally in responses
- Visible: agent names places but doesn't draw on the community tips that make them worth visiting; get_place_detail is called but tips aren't woven into the narrative
- Done: agent response reads like a knowledgeable friend quoting what parents say ("parents say the soft play is great for under-3s"); tips are cited as evidence not appended as a list; system prompt updated to require tip quotes when available
- Constraint: get_place_detail tool already fetches tips; this is a system prompt + response quality change, not a schema change
- Model: Sonnet · Plan: no

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

~~T26~~ ✅ shipped — map marker visuals, category colours, basemap style
~~T27~~ ✅ shipped — zoom tiers and marker interaction

T38 | P2 | feature | SEO: landing page + indexable place detail pages
- Visible: the app is a JS SPA — Google sees a blank shell; no way to rank for "family-friendly parks Seattle" or individual place names
- Done:
  - Landing page at `/` with headline, short value prop, and CTA to open the map (static, fully indexable)
  - Place detail pages at `/places/[slug]` (slug = kebab-case name + id suffix); renders place name, type, description, address, and tips as server-renderable HTML; tapping a map pin deep-links here on mobile
  - `<meta>` title + description on both routes
  - React Router (or file-based routing if we adopt a framework) handles routing without reloading the map
- Constraint: current app has no routing — adding React Router (or Vite SSG) is a prerequisite; assess scope before ticketing sub-tasks; don't break existing SPA behaviour; place pages can be CSR initially (Google can execute JS) — SSR/SSG is a later optimisation
- Open question: stay on Vite SPA + React Router, or adopt Vite + vite-plugin-ssg, or migrate to a framework (Remix, Next)?
- Model: Sonnet · Plan: yes (routing is an architectural change)

T05 | P3 | bug | Remove out-of-Seattle data — understand why it's there first
- Model: Haiku · Plan: no

T15 | P3 | idea | Per-type emoji/icon beyond PLACE_TYPES — revisit when google_types is persisted
- Model: Haiku · Plan: no

## Parked — needs decision before ticketing
- Chat input: single-line vs conversation flow
- Trust design: how do we establish data credibility for users
- User verification: how can users confirm a place is accurate
- ~~Tag capture~~ — decided: freeform text is primary; structured tags are AI-derived for filtering only
