
#Observations

## Design skill — deferred / later

_From little-places-design rollout; pick up with `/triage` or a design ticket._

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

_After 100ms transition pass (Apr 2026): hover-on feels better; **mouse-out / hover end** still feels sluggish on some controls._ Possible directions later: asymmetric durations (faster exit), `transition-behavior`, audit `transition-*` on components that chain box-shadow/transform, Framer Motion vs CSS overlap.

_Fix later — not blocking. Captured in T08._
