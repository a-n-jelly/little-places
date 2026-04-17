---
name: little-places-design
description: >-
  Little Places UI and layout work: follow theme.css tokens, CLAUDE.md product rules,
  mobile-first responsive patterns, Browse map+list behaviour, and iteration checklists.
  Use when improving styling, spacing, typography, breakpoints, accessibility basics, or
  translating design inspiration into code without hardcoding colours.
---

# Little Places design

## When to use

- Visual polish, layout fixes, and **mobile breakpoints**
- Translating **inspiration** (screenshots, references, mood presets) into implementation
- **Not** for backend-only or data-pipeline work

## Authority order (resolve conflicts top-down)

1. **Product rules** in `CLAUDE.md` — Agent vs Browse, map usage, events via agent only, mobile first, no user accounts (v1).
2. **Tokens** in `src/styles/theme.css` — semantic colours, radii, shadows, stage chips, form chip states, `@theme inline` mappings.
3. **This skill** — spacing rhythm, responsive habits, checklists below.
4. **General craft** (Eric Kennedy–style principles, external articles) only when they **do not** contradict 1–2. Course-style guidance applies to hierarchy and judgment; **execution** still uses project tokens.

## Non-negotiables (from CLAUDE.md)

- Home: **AgentPanel** by default — not the map.
- **Browse**: map is **primary**; list on the side.
- **Events** only through the agent — never on the map or as browse list items.
- **Palette**: no hardcoded colours — use CSS variables / Tailwind semantic tokens from `theme.css`.
- **Protected files** (changes require tests): `PlaceCard.jsx`, `FilterBar.jsx`, `SearchBar.jsx`, `usePlaces.js`, `places.js`, `constants.js` — run `npm test` before commit.

## Tokens (do not bypass)

- **Core**: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius` and derived `--radius-*`.
- **Brand accents**: `--sage`, `--coral`, `--yellow`, `--off-white`, `--sky`.
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-coral`.
- **Stage chips**: `--stage-*-bg` / `--stage-*-text` (baby through tweens).
- **Form selections**: `--btn-selected-*`, `--btn-secondary-*`.

If you change the palette, update **`theme.css` in one pass** (including stage chips and button selection tokens). Do not add parallel hex colours in components.

## Typography

- Base: `html` uses `--font-size` (16px). `h1` / `h2` / `button` in `theme.css` use `var(--text-2xl)`, `var(--text-xl)`, `var(--text-base)` — these map through **Tailwind v4** theme defaults; prefer **semantic utilities** (`text-base`, `text-lg`, etc.) in components for consistency.
- When adjusting type, keep **one scale** — avoid mixing arbitrary `text-[13px]` unless there is a strong reason.

## Spacing

- Default rhythm: **4px base** — prefer Tailwind spacing that resolves to multiples of 4 (`p-2`, `gap-3`, `p-4`, etc.).
- Sections: consistent **vertical rhythm** between major blocks; cards: consistent **internal padding** within a surface type.

## Responsive (Tailwind defaults)

- **`sm`**: 640px · **`md`**: 768px · **`lg`**: 1024px · **`xl`**: 1280px (verify in Tailwind config if customised).
- Check **overflow** (horizontal scroll), **stacking** in Browse (map + list), and **Agent** panel on narrow viewports.

## Browse: map + list

- Map is the **primary** focus; list supports selection and scanning — avoid layouts that shrink the map unusably on tablet/phone.
- Consider **thumb reach** and **scroll** in the list; do not cover **map controls** or attribution unnecessarily.

## Accessibility (minimum)

- Interactive elements: visible **focus** (ring aligns with `--ring` / theme).
- **Tap targets**: chips, filters, and icon buttons should meet at least ~44×44px where possible on touch.
- Text on **muted** backgrounds and **stage chips**: check **contrast** for readability.

## States beyond the happy path

- Align **loading**, **empty**, **error**, and **disabled** presentation across similar surfaces so the app feels intentional, not half-finished.

## Definition of done (per UI ticket)

- Spot-check at roughly **390px**, **768px**, and **1024px** (or the breakpoints most affected).
- **Done** means: no unintended horizontal scroll, no broken stack in Browse, focus still usable, tokens only (no stray brand hex).

## Inspiration workflow

1. From a reference (screenshot, site, or [awesome-design-skills](https://github.com/bergside/awesome-design-skills) style preset), extract **2–3 patterns** (spacing rhythm, radius/shadow *character*, hierarchy).
2. Map colours into **`theme.css`** semantic variables if the palette changes — **one source of truth**.
3. Change **one screen or component group** per iteration when possible.
4. Do **not** paste a preset’s hex values into JSX while `theme.css` still defines another palette.

## Re-theme / token migration (when you change colours)

- `grep` for `#` and `rgb` in `src/` outside `theme.css` and eliminate brand **duplicates**.
- Update **stage chips** and **form chip** tokens together with primary/secondary/accent.
- Run **`npm test`** if any protected UI file changes.

## Mini audit before finishing

- Contrast on muted and chips
- Focus visible on new controls
- Scroll behaviour and overflow at narrow width
- Browse: map still usable, list scrollable

## External craft (Eric Kennedy, courses)

- Do not paste copyrighted course material into the repo.
- When the user references **Eric Kennedy** or similar: apply **clarity, hierarchy, and alignment** principles **through** existing tokens and layout — see future `design-foundations` skill for distilled bullets in the user’s own words.

## See also

- `reference.md` in this folder — optional links to community skill repos and mood references.
