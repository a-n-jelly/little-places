# 🌿 Little Places

A crowdsourced, AI-powered directory of child and family-friendly places. Built for parents, by parents.

**Stack:** React + Supabase + Anthropic API + Mapbox

---

## Features

- 🔍 **AI semantic search** — describe what you need in plain language
- 👶 **Developmental stage filters** — Baby through Tweens+
- ♿ **Accessibility-first** — Changing Places, sensory-friendly, autism-friendly
- 📍 **Map + list view** — browse spatially or by search results  
- ➕ **Crowdsourced** — anyone can submit a place

---

## Getting Started

```bash
git clone https://github.com/yourusername/little-places.git
cd little-places
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

See `.env.example` for required environment variables.

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL editor.

## Testing

```bash
npm test                 # run all tests
npm run test:watch       # watch mode
npm run test:coverage    # with coverage report
```

## Branching Strategy

```
main   ← always deployable (Vercel auto-deploys)
dev    ← integration branch
  └── feature/your-feature
```

PRs to `main` require passing CI.

---

*Built by a Seattle parent who got tired of Google Lists. 🌿*
