---
name: little-places-design
description: >-
  Little Places UI and layout work: follow theme.css tokens, CLAUDE.md product rules,
  mobile-first responsive patterns, Explore map+list behaviour, and iteration checklists.
  Use when improving styling, spacing, typography, breakpoints, accessibility basics, or
  translating design inspiration into code without hardcoding colours.
---

# Little Places design

## When to use

- Visual polish, layout fixes, and **mobile breakpoints**
- Translating **inspiration** (screenshots, references, mood presets) into implementation
- **Not** for backend-only or data-pipeline work

## Authority order (resolve conflicts top-down)

1. **Product rules** in `CLAUDE.md` — Explore as the primary page, Ask AI in the agent panel, map usage, events via agent only, mobile first, no user accounts (v1).
2. **Tokens** in `src/styles/theme.css` — semantic colours, radii, shadows, stage chips, form chip states, `@theme inline` mappings.
3. **This skill** — spacing rhythm, responsive habits, checklists below.
4. **General craft** (Eric Kennedy–style principles, external articles) only when they **do not** contradict 1–2. Course-style guidance applies to hierarchy and judgment; **execution** still uses project tokens.

## Non-negotiables (from CLAUDE.md)

- **Explore** is the **single primary page** (map + list); agent and map stay on one surface.
- **Ask AI** lives in the **agent panel** on Explore — not a separate home route.
- **Layout:** map is **primary**; list on the side.
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

## Breakpoint reference (Tailwind v4 defaults)

The app imports Tailwind via `src/styles/tailwind.css` with **no custom `screens` override** — prefixes match [Tailwind defaults](https://tailwindcss.com/docs/screens) unless you extend the theme.

| Token | Min width | Role in this app |
|-------|-----------|------------------|
| (default) | 0 | Mobile: bottom nav, full-width surfaces, single-column Explore |
| `sm` | 640px | Rare in core UI; use for sub-`md` tweaks only |
| **`md`** | **768px** | **Primary:** desktop header, map + list split, centered add-place sheet |
| `lg` | 1024px | Optional tightening; tablet landscape spot-check |
| `xl` | 1280px | Wide desktop; check max-width / odd gaps |

**Priority viewports for manual QA:** **390×844** (small phone), **767 vs 769** (straddle `md` — layout flip), **1024**, **1280**.

## Per-surface responsive QA

| Surface | What to verify |
|---------|----------------|
| **App chrome** | Below `md`: bottom nav visible, header hidden. At `md+`: header visible, bottom nav hidden. No horizontal scroll. |
| **Explore (`BrowseLayout`)** | Map usable; list scrolls; panel tabs (Search / Ask AI) work; no broken stack. |
| **Agent panel** | Content scrolls; input reachable; no overflow at 390px width. |
| **Add place (`SubmitBottomSheet`)** | Sheet opens; full-width on mobile; centered card at `md+`; form scrolls inside sheet. |
| **All inputs (mobile)** | Tapping any input must NOT zoom the page. Verify `index.html` has `maximum-scale=1.0` in the viewport meta. Any new `<input>` or `<textarea>` must use `text-base md:text-sm` (≥16px on mobile) as a secondary safeguard. |
| **Tokens** | No stray brand hex — semantic tokens from `theme.css` only. |

## Automated viewport smoke

- Run **`pnpm run test:e2e`** (Playwright) for a small matrix: load app, assert no document horizontal overflow, open Add place. Not a substitute for manual spot-checks at the `md` boundary.
- **CI:** `.github/workflows/ci.yml` runs **`pnpm test`** then **`pnpm run test:e2e`** on pushes and pull requests (installs Chromium for Playwright on the runner).

## Responsive habits (summary)

- Check **overflow** (horizontal scroll), **stacking** on Explore (map + list), and the **agent panel** on narrow viewports.

## Explore: map + list

- Map is the **primary** focus; list supports selection and scanning — avoid layouts that shrink the map unusably on tablet/phone.
- Consider **thumb reach** and **scroll** in the list; do not cover **map controls** or attribution unnecessarily.

## Accessibility (minimum)

- Interactive elements: visible **focus** (ring aligns with `--ring` / theme).
- **Tap targets**: chips, filters, and icon buttons should meet at least ~44×44px where possible on touch.
- Text on **muted** backgrounds and **stage chips**: check **contrast** for readability.

## States beyond the happy path

- Align **loading**, **empty**, **error**, and **disabled** presentation across similar surfaces so the app feels intentional, not half-finished.

## Definition of done (per UI ticket)

- Use **Breakpoint reference** and **Per-surface responsive QA** above; spot-check at **390px**, **767↔769** (layout flip), **1024px**, and **1280px** when the change touches layout.
- **Done** means: no unintended horizontal scroll, no broken stack on Explore, focus still usable, tokens only (no stray brand hex). Run **`npm test`**; if you touched app shell or sheets, run **`npm run test:e2e`** when feasible.

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
- Explore: map still usable, list scrollable

## External craft (Eric Kennedy, courses)

- Do not paste copyrighted course material into the repo.
- When the user references **Eric Kennedy** or similar: apply **clarity, hierarchy, and alignment** principles **through** existing tokens and layout — see future `design-foundations` skill for distilled bullets in the user’s own words.

## See also

- `reference.md` in this folder — optional links to community skill repos and mood references.
