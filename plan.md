# plan.md — Current Ticket

## TBD — Blog + Reddit Enrichment
**Phase:** 4c
**Status:** Parked — needs planning session to start

### Goal
Use blog posts and Reddit threads as enrichment signals for existing places — confirming or adding child-friendly features and tags. Not intended to add many new places (Google + parks already give good coverage).

### Approach agreed
- **Blogs**: manually curate `input/blog_places.txt` from ParentMap, Seattle's Child, SeattleMet — OR build a scraper for specific URLs
- **Reddit**: use Reddit JSON endpoints (no auth needed, e.g. `reddit.com/r/SeattleParents.json`) — simpler than OAuth API
- Both feed into a similar enrichment pipeline as `apply-review-features.js` (patch existing records, union arrays)

### Open questions (decide at session start)
- Blogs: manual curation vs URL scraper?
- Reddit: which subreddits? (r/SeattleParents, r/Seattle, r/SeattleWA)
- How to match Reddit/blog mentions to existing Supabase records (name matching, same logic as import script)

### Files likely involved
- `input/blog_places.txt` (manual curation) or new `scripts/scrape-blogs.js`
- New `scripts/fetch-reddit-mentions.js`
- New `scripts/extract-features-from-text.js` (generalise review extraction to any text)
- `scripts/apply-review-features.js` (reuse for applying patches)
