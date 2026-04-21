#Observations

Selected marker get hidden when zooming out - needs to be on top of all the other markers layer
## Design skill — deferred / later

*From little-places-design rollout; pick up with `/triage` or a design ticket.*

- **Personal `design-foundations` skill** (`~/.cursor/skills/` and/or `~/.claude/skills/`) — cross-project craft: distilled Eric Kennedy–style bullets in your own words, spacing/type habits, critique style. Point `little-places-design` at it when ready.
- **Eric Kennedy bullets** — add 8–15 actionable bullets (your phrasing) into `design-foundations`; keep course material out of the repo.
- **Optional Cursor "Design" agent** — short system prompt that loads `little-places-design` + `design-foundations` without duplicating full rules.
- **Claude Code: designer-skills plugin** — optional `/plugin marketplace add Owl-Listener/designer-skills` if you want slash-command workflows; skill stays canonical.
- **Document type scale in one place** — `theme.css` references `var(--text-*)` (Tailwind theme); add a short comment block or table in `theme.css` if the scale is hard to discover.
- **Content & tone subsection** — family-facing voice notes, empty/error copy guidelines in the skill or a tiny `CONTENT.md` when you care about copy consistency.
- **Motion** — `prefers-reduced-motion` policy and transition tokens if you add animation beyond defaults.
- **Dark mode** — if `.dark` ships for users: verify critical screens in both themes after visual changes (hooks exist in `theme.css`).
- **Symlink vs duplicate** — `.claude` and `.cursor` skills are duplicated for portability; switch to one file + symlink if you want a single source on your machine.

## UI — interaction timing (follow-up)

*After 100ms transition pass (Apr 2026): hover-on feels better; **mouse-out / hover end** still feels sluggish on some controls.* Possible directions later: asymmetric durations (faster exit), `transition-behavior`, audit `transition-`* on components that chain box-shadow/transform, Framer Motion vs CSS overlap.

*Fix later — not blocking. Captured in T08.*

## Agent tool description missing feature tags (Apr 2026)

`child_friendly_features` options in `useAgentChat.js` AGENT_TOOLS are incomplete — missing playground-specific tags like `baby-swings`, `climbing`, `swings`, `splash-pad`, `fenced` etc. that exist in the enrichment scripts. Model can't search for what it doesn't know exists.

## Data quality — feature tags in Supabase (Apr 2026)

Unknown whether places in Supabase actually have playground features (e.g. `baby-swings`) populated. Enrichment scripts define these tags but unclear if they've been run against the current database. Needs a data audit.

## Agent error states — needs design (Apr 2026)

Agent panel shows raw error messages when the AI model is unavailable (503 high demand, 429 quota). Needs a designed error state with a friendly message and retry prompt. Relates to copy/tone guidelines too.