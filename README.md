# Little Places 🌿

A crowdsourced directory of child and family-friendly places in Seattle. Built for parents, by parents.

**Stack:** React + Vite + Tailwind + Supabase + Anthropic API + Mapbox

---

## What it does

Open the app and ask the agent what to do today — it pulls real places from the database, checks the weather, and gives you a clear recommendation. No scrolling through lists, no guesswork.

If you prefer to browse, switch to the list view to filter by age stage, accessibility needs, and place type. Anyone can submit a new place.

---

## Features

- **AI agent home screen** — ask in plain language, get a specific recommendation
- **Developmental stage filters** — Baby through Tweens
- **Accessibility-first** — Changing Places, sensory-friendly, autism-friendly, quiet spaces
- **Crowdsourced** — anyone can submit a place

**In progress:** map view, semantic search, events

---

## Getting Started

```bash
git clone https://github.com/yourusername/little-places.git
cd little-places
pnpm install
```

Copy `.env.example` to `.env` and fill in your keys:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_MAPBOX_TOKEN=
```

Then run the database setup (see below) and start the dev server:

```bash
pnpm dev
```

## Database Setup

Run `supabase/schema.sql` then `supabase/seed.sql` in your Supabase SQL editor.

## Testing

```bash
pnpm test                 # run all tests
pnpm run test:watch       # watch mode
pnpm run test:coverage    # with coverage report
```

## Branching

```
main   ← always deployable (Vercel auto-deploys)
  └── feature/your-feature
```

PRs to `main` require passing tests.

---

See [DECISIONS.md](DECISIONS.md) for architectural decisions and their rationale.
See [EVAL.md](EVAL.md) for the agent evaluation plan — how we know it's working well.

*Built by a Seattle parent who got tired of Google Lists. 🌿*
