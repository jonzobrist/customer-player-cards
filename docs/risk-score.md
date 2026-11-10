# Risk score

The risk score is a 0 to 100 number that answers "how worried should we be about this customer right now?" It blends live operational and support signals with commercial and sentiment context, and it always explains itself.

## Formula

```text
Risk = round(0.30·Ops + 0.25·Case + 0.20·SLA + 0.15·Commercial + 0.10·Sentiment)
```

| Component | Weight | 0 to 100 scale |
| --- | --- | --- |
| Ops events | 30% | Highest linked active event: SEV1 100, SEV2 70, SEV3 40, DEGRADED 30, CHANGE window within 24 h 15, none 0; +10 if open more than 4 h; cap 100 |
| Case | 25% | Most urgent open case: P1 100, P2 70, P3 40, P4 20; +15 if escalated; cap 100 |
| SLA | 20% | Percent of the SLA milestone elapsed on the most urgent open case; 100 if breached |
| Commercial | 15% | Renewal runway: ≤30 d 90, ≤90 d 60, ≤180 d 40, else 20; +15 if the renewal opportunity is flagged at risk; cap 100 |
| Sentiment | 10% | 100 minus the average of CSAT (1-5 scaled to 0-100) and NPS (-100..100 scaled to 0-100); +10 if NPS fell more than 15 points in 90 days |

## Overrides

Applied after the weighted sum, in this order:

1. An active **SEV1 linked to an open P1 case** floors the score at **80** (Critical).
2. Any **breached SLA** floors the score at **70** (High).
3. An **executive escalation** flag adds **10** (cap 100).

Every card stores which overrides fired (for example `SEV1_LINKED_P1_FLOOR_80`).

## Bands

| Band | Score | Glyph | Treatment |
| --- | --- | --- | --- |
| Critical | 80-100 | Octagon with "!" | Pulsing 3 px outline (static double border under reduced motion); floats to the top |
| High | 60-79 | Triangle with "!" | Solid 2 px border |
| Elevated | 40-59 | Diamond | 1 px tinted border |
| Low | 0-39 | Circle with check | Default border |

## Worked example (fictional)

Northwind Logistics: SEV1 gateway incident, P1 case escalated, 78% of the SLA elapsed, renewal in 110 days, NPS down 18 points.

| Component | Score | Weighted |
| --- | --- | --- |
| Ops | 100 | 30.0 |
| Case | 100 | 25.0 |
| SLA | 78 | 15.6 |
| Commercial | 55 | 8.3 |
| Sentiment | 50 | 5.0 |
| **Sum** | | **84 (Critical)** |

The SEV1-linked-P1 override would have floored it at 80 anyway.

## Implementation rules

- `computeRisk(components, flags)` is a **pure function** shared by the front end and the backend as one package. No I/O, no clock reads; pass `now` in.
- Weights are configurable per segment (stored in Postgres in the backend) and versioned. A change to weights or thresholds needs an ADR in [adr/](adr/) and must update this file, the prompts and the mockup source.
- Unit tests must cover every override and every band boundary (39/40, 59/60, 79/80, and the caps at 100).
- Emit `risk.band_changed` as a structured event and a metric when a band changes, with the account id (not the name) and the overrides that fired.

## Tuning

In phase 3, compare the band history against past escalations and churn. The target is that the band predicts escalations better than today's process. Sign-off on weights is an open question in [build-plan.md](build-plan.md#open-questions).
