#Observations

Emojis in the map markers are too big; they need to be shortened.

- CI / Vitest — `SubmitPlaceForm` (2026-04-23): three tests fail on `waitFor` waiting for a venue suggestion row (`getByText(matchVenueName)` — expects visible text to include both “Woodland Park Zoo” and “5500 Phinney Ave N”) and then “✓ Location found”. File: `src/tests/components/SubmitPlaceForm.test.jsx` (~L119, ~L155, ~L175). Repro: `npx vitest run src/tests/components/SubmitPlaceForm.test.jsx`. Likely drift after Mapbox Search Box UI/API wiring (suggestion DOM or copy no longer matches matcher, or debounce/mock order). Pick up with T32 or a small test-fix ticket after `/triage`.