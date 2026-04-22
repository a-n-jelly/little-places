# plan.md — T24: Replace category chips with feature filter chips

## Goal
Replace the current place-type filter chips (Park, Café etc.) with 5 child-friendly feature chips. More useful to parents, and a genuine differentiator from Google Maps.

## Decisions made
- 5 features chosen by cross-type usefulness, not just count: stroller-friendly, high-chairs, hands-on-exhibits, storytime, free-entry
- Filtering logic already exists in usePlaces.js (selectedAccess → child_friendly_features) — reuse it
- Category chips removed from FilterBar; type filtering moves to agent only

## Acceptance criteria
- [ ] FilterBar shows 5 feature chips instead of category chips
- [ ] Selecting a chip filters places by that child_friendly_feature
- [ ] Multiple chips can be selected (AND logic — already how selectedAccess works)
- [ ] Deselecting a chip removes the filter
- [ ] Mobile layout still works
- [ ] `npm test` passes

## Files involved
- `src/lib/constants.js` — add FEATURE_FILTER_CHIPS (the 5 chips with labels)
- `src/components/FilterBar.jsx` — replace CATEGORY_CHIPS with FEATURE_FILTER_CHIPS (protected)
- `src/hooks/usePlaces.js` — selectedAccess already handles this; confirm no changes needed (protected)

## Open questions
- What labels show on the chips? (stroller-friendly → "Stroller Friendly"? Or shorter?)
- Do chips show an icon or just text?
