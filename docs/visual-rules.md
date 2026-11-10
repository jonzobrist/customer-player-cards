# Visual rules and accessibility

These rules apply to every style. A pull request that changes UI must show it still meets them (see [AGENTS.md](../AGENTS.md)).

## Never color alone

Every state carries **a color, a glyph shape, a text label and an aria-label**, and must be understandable in grayscale.

| Band | Score | Color | Glyph | Border and motion | Placement | Alert |
| --- | --- | --- | --- | --- | --- | --- |
| Critical | 80-100 | Red | Octagon with "!" | 3 px outline pulsing at 750 ms; static double border under reduced motion | Floats to the top of every list | Push to owners; exec on Platinum/Gold |
| High | 60-79 | Amber | Triangle with "!" | Solid 2 px border | Above Elevated and Low | Owners and account team |
| Elevated | 40-59 | Yellow | Diamond | 1 px tinted border | Normal order | Digest only |
| Low | 0-39 | Green | Circle with check | Default border | Normal order | None |

## Events and SLA

| Event | Maps to | Status effect (style C) | Card treatment |
| --- | --- | --- | --- |
| SEV1 / major outage | Critical glyph | Burning | Chip first in row, LIVE tag, ops component 100 |
| SEV2 | High glyph | Poisoned | Chip, LIVE tag, ops component 70 |
| SEV3 | Elevated glyph | Slowed | Chip, ops component 40 |
| Degraded (status page) | Elevated glyph | Weakened | Chip, ops component 30 |
| Change window | Neutral clock | Warded | Chip with start time; ops 15 inside 24 h |
| SLA countdown | Bar + text | Shield | Neutral under 75%, amber at 75%, red at 90%, "BREACHED +Nm" after |

- Event chips are ordered by severity: glyph + kind + age (for example "SEV1 · 2h 14m").
- Case priority maps P1 to the critical glyph, P2 high, P3 elevated, P4 low.
- **Numbers always print:** risk, health and SLA minutes are text, not just bar length.

## Accessibility (WCAG 2.2 AA)

- Text contrast at least 4.5:1 (3:1 for large text and UI component boundaries). Tinted fills stay behind neutral text.
- Every card is keyboard focusable with a visible focus ring. **Enter** opens, **Space** flips, **Escape** closes; arrow keys move through lists and stacks.
- Meters use `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a label. Glyph SVGs have `role="img"` and an `aria-label`.
- Live changes go to an `aria-live="polite"` region; only a **new Critical** is `assertive`.
- `prefers-reduced-motion: reduce` disables pulsing, flipping, tickers and floating numbers; Critical gets a static double border and transitions become crossfades. Tickers can always be paused.
- Responsive from 360 px to 1920 px with no horizontal scroll at 360 px. Wall mode: numbers at least 28 px and labels at least 18 px at 1080p.
- Lighthouse accessibility score at least 95, and zero serious or critical axe-core violations.
- Game language (style C) must have a Plain labels toggle; every game term has its business term visible within one interaction.

## Data honesty

- Show the data's `asOf` time and grey out fields whose source is stale (from `dataFreshness`).
- Prototypes and demos show an "Illustrative data" label in the footer.
