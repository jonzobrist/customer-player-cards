# Build prompts

Each file here is a complete, self-contained prompt for a coding agent (or a human engineer). The five style prompts build a **front-end prototype on fictional mock data**. The backend prompt builds the **data and integration layer** that the front end can switch to later.

| File | Builds | Best for |
| --- | --- | --- |
| [a-trading-card.md](a-trading-card.md) | Style A: trading card (front, back, drill-in) | Executives, account teams, QBR prep |
| [b-broadcast-scoreboard.md](b-broadcast-scoreboard.md) | Style B: broadcast scoreboard and league table | Key leaders, support floor, wall displays |
| [c-rpg-character-sheet.md](c-rpg-character-sheet.md) | Style C: RPG character sheet with status effects | Engineers, support staff, service owners |
| [d-wallet-stack.md](d-wallet-stack.md) | Style D: mobile wallet stack | Executives and account teams on mobile |
| [e-roster-heatmap.md](e-roster-heatmap.md) | Style E: roster grid and risk heatmap | Key leaders, service owners |
| [backend.md](backend.md) | Shared backend: Salesforce + ops ingestion, risk engine, card API | Everyone, once a style is chosen |

## How to use them

1. Pick a style (or two). The suggested pairing is **E as the home screen, A as the card it opens, and C's status effects in the engineer/support drill-in**. See [docs/concept.md](../docs/concept.md).
2. Start a fresh repository or a new folder (for example `apps/web-trading-card/`) and paste the whole fenced block from the prompt file into your coding agent.
3. Point the agent at [AGENTS.md](../AGENTS.md) as well, so the output meets this project's testing, instrumentation and documentation rules.
4. Review the result against the prompt's acceptance criteria and the visual rules in [docs/visual-rules.md](../docs/visual-rules.md).
5. Build the backend from [backend.md](backend.md) against a Salesforce **sandbox** and mocked ops sources only. Never use production credentials or real customer data in this repository.

## Shared sections

All style prompts share the same audience views, risk rules, mock-data schema and general acceptance criteria, so prototypes built from different styles are comparable and can share `src/lib/risk.ts`, `src/config/audiences.ts` and `src/lib/dataSource.ts`.

If you change a shared rule (for example a risk weight), update every prompt file, [docs/risk-score.md](../docs/risk-score.md) and the mockup source in [mockups/src/](../mockups/src/) in the same pull request.
