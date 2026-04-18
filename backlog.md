# Backlog

Format: `T## | P# | type | Goal — "source"`
Priority: P1 = do next (high impact, small effort) | P2 = scope into ticket | P3 = tail
Cap: 15 items max. Run /triage to add from observations.md.

---

T01 | P1 | bug | Remove broken "View full details" dead link — "View full details button is a dead link"
T02 | P1 | bug | Fix webpage shake at responsive breakpoints — **breakpoints are now documented** in `.claude/skills/little-places-design/SKILL.md` (viewport QA + `npm run test:e2e`). **Remaining:** investigate layout/reflow shake when resizing across `md` (`BrowseLayout` / map); not a docs-only fix.
T03 | P1 | bug | Fix add-place search too strict (exact match only) — "search only returns if it's exact"
T04 | P1 | bug | Design empty states — no results + error/retry in sidebar — "UI design needed for empty states" + "error/retry unstyled"
T05 | P1 | bug | Remove out-of-Seattle data — "need to understand why we have data outside Seattle"
T06 | P1 | bug | Fix empty age stages on parks in database — "ages to stages is empty in parks"
T16 | P1 | design | Browse nav + search layout — remove duplicate nav bar in side panel, move search to top next to filters — observations Apr 2026
T17 | P1 | design | Map pin visual redesign + remove selection tooltip — rounded point on non-active, classic pin on active; no tooltip on select — observations Apr 2026
T08 | P2 | bug | Fix animations — "fix animations!!!"
T09 | P2 | feature | Fix filter/search persistence when clicking through map — "filters and search need to persist"
T10 | P2 | feature | Design agent response UI — "design needed for response from agent"
T07 | P2 | feature | Investigate and clarify favourites feature — "There is a favourites on the app — what does it do?"
T11 | P2 | feature | Evaluate agent model switch to free tier — "Look at evals and switch a free model"
T12 | P2 | feature | Add user feedback mechanism — "is there a way for users to send me feedback?"
T13 | P2 | feature | Clean and consolidate place tags — "need to clean the tags and see if there is noise"
T14 | P2 | feature | Improve place description quality + add child-friendly highlights section — "Some places have bad descriptions" + "need highlights/why child friendly section that is not generic"
T15 | P3 | idea | Restaurants icon — "restaurants need their own icon"

## Parked — needs decision before ticketing
- Chat input: single-line vs conversation flow
- Trust design: how do we establish data credibility for users
- User verification: how can users confirm a place is accurate
- Tag capture: freeform vs structured, how to consolidate (also relates to T13)
