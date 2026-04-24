# plan.md — T33: Tips field + AI-derived description on submit

## Goal
Replace the freetext description field with a "Tips" field (user input). On submit, generate the place description from Tips using AI.

## Acceptance criteria
- [ ] "Description" field renamed to "Tips" in SubmitPlaceForm
- [ ] Tips text is user-supplied, stored separately or used as prompt input
- [ ] AI-derived description generated on submit (Anthropic SDK)
- [ ] `npm test` passes

## Open questions
- Where does the AI call live — client-side or edge function?
- Does Tips get stored, or only the AI-derived description?
- Scope of AI prompt — what inputs (name, type, tips, features)?
