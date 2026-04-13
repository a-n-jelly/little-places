# Eval Plan — Little Places Agent

How we know the agent is working well. Two layers: tool correctness first, response quality second. If the tools are broken, the response doesn't matter.

---

## Layer 1 — Tool correctness (objective)

These are automatable. The goal is to verify the agent calls the right tools with the right arguments, and that the tools return sensible data.

### search_places

| Test | Query | Expected behaviour |
|---|---|---|
| Keyword match | "coffee shop" | Returns places where type or description contains café/coffee |
| Stage filter | "places for a baby" | Returns only places with `baby` in stages array |
| Accessibility filter | "wheelchair accessible park" | Returns only places with `wheelchair` in accessibility array |
| Empty results | "trampoline park" | Returns empty array, no crash |
| Combined filters | "sensory-friendly indoor place for a toddler" | Applies both stage and accessibility filters |

**How to test:** Unit tests with mocked Supabase responses. Assert the query is constructed correctly and the tool result shape matches what the agent expects.

### get_weather

| Test | Expected behaviour |
|---|---|
| Normal response | Returns temp, description, rain chance |
| wttr.in down | Returns `{ error: 'Could not fetch weather' }` — agent continues without it |

**How to test:** Mock `fetch` in unit tests. Assert error case doesn't break the agentic loop.

### get_events

| Test | Expected behaviour |
|---|---|
| No filters | Returns all recurring + this week's one-off events |
| Day filter | Returns only events matching `day_of_week` |
| No events in DB | Returns empty array, no crash |

---

## Layer 2 — Response quality (subjective, LLM-as-judge)

These can't be unit tested — they need either human review or a second model evaluating the output. The approach: define a set of test queries with explicit success criteria, run the agent, score each response.

### Test queries and criteria

**Query 1:** "What should I do with my toddler today?"
- Gives exactly one primary recommendation (not a list of 10)
- Names a specific place from the database
- Mentions why it suits a toddler
- Factors in current weather

**Query 2:** "Somewhere wheelchair accessible for a rainy afternoon with a 5-year-old"
- Returns a place with `wheelchair` in accessibility
- Suitable for `bigkids` stage
- Recommends indoor option given rain

**Query 3:** "Free things to do this weekend"
- Mentions cost (free entry) as a factor
- Pulls from `get_events` for weekend events if available
- Doesn't invent places not in the database

**Query 4:** "I have a baby and a 4-year-old — somewhere that works for both"
- Recommends a place tagged for both `baby` and `preschool`
- Practical detail (feeding area, pram access) mentioned if in the data

### Scoring rubric (per response)

| Criterion | Pass | Fail |
|---|---|---|
| Grounded | Only mentions places/details that exist in the database | Invents or assumes details |
| Specific | Names a place and explains why | Vague or generic ("there are many parks in Seattle") |
| Constraint-aware | Respects filters in the query (age, accessibility, weather) | Ignores stated constraints |
| Actionable | Includes something practical (address, cost, hours if known) | No useful next step |
| Concise | One clear recommendation with optional alternatives | Exhaustive list with no direction |

### How to run (LLM-as-judge)

```
For each test query:
1. Run the agent and capture the full response
2. Send the response + rubric to a second Claude call
3. Ask it to score each criterion pass/fail with a one-line reason
4. Aggregate: 4/5 criteria = pass, below that = investigate
```

This is the same pattern Anthropic uses internally for evaluating model outputs. It's not perfect (the judge has its own biases) but it's consistent and scalable.

---

## What's not covered here

- **Load testing** — not relevant at this scale
- **Latency** — agentic loops are inherently slow (1-3 tool calls); acceptable for now, worth monitoring as usage grows
- **Hallucination detection at scale** — the grounding criterion above catches it per-response; systematic detection would need a larger eval set

---

## Status

- [ ] Layer 1 unit tests — planned in T04, not yet written
- [ ] Layer 2 test queries — defined above, not yet run
- [ ] LLM-as-judge implementation — not yet built
