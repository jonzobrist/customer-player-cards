# Build plan

## Phases

| Phase | Scope | Length | Exit criteria |
| --- | --- | --- | --- |
| 0 · Discovery | Prototype styles with the [prompts](../prompts/); interview two people per audience; confirm fields and case-to-incident linking | 2 weeks | Style chosen; field list and risk weights agreed |
| 1 · MVP | Read-only cards for the top 50 accounts; roster + trading card; exec, account and support views; Salesforce REST + PagerDuty webhooks; SSO | 6 weeks | Used in a weekly account review; data matches Salesforce |
| 2 · Live ops | CDC streaming, ServiceNow, status page, monitoring; linker; all six views; SLA countdown; Slack/Teams alerts | 6 weeks | A SEV1 shows on the card in under 60 s |
| 3 · Scale | All accounts; blast-radius mode; risk history; wall display and mobile; weight tuning against past churn and escalations | 8 weeks | Risk band predicts escalations better than today's process |
| 4 · Act | Write-backs with approvals (log exec update, open escalation, request credit); predictive risk; generated "why" summaries with citations | Later | Agreed per action |

## Stack

| Layer | Choice |
| --- | --- |
| Front end | React + TypeScript (strict) + Vite (or Next.js), Tailwind with CSS-variable tokens, Framer Motion, Radix UI |
| Backend | Node.js 20 TypeScript (Fastify) API and ingest workers |
| Event bus | Redis Streams to start; Kafka or a managed bus at scale (behind an interface) |
| Storage | Postgres 16 for snapshots and history; Redis 7 for the hot card cache |
| Realtime | Server-Sent Events to the browser |
| Salesforce | Pub/Sub API for Change Data Capture and Platform Events; REST/Composite and Bulk API 2.0 for backfill |
| Ops sources | PagerDuty Webhooks v3, ServiceNow Table API, status page and monitoring webhooks |
| Auth | Company SSO (OIDC) for users; OAuth 2.0 JWT bearer flow with an integration user for sync |
| Observability | OpenTelemetry traces, metrics and structured logs (see [AGENTS.md](../AGENTS.md#2-operational-instrumentation)) |
| Testing | Vitest + Testing Library, Playwright, axe-core, Storybook, contract tests against mocked APIs |

## Salesforce integration

1. **Connected app and integration user.** JWT bearer flow; certificate in a secrets manager; read-only permission set scoped to the card objects and fields.
2. **Backfill.** SOQL over REST/Composite for open cases, opportunities and accounts; Bulk API 2.0 for large orgs.
3. **Stream changes.** Subscribe to Change Data Capture for Account, Opportunity and Case through the Pub/Sub API; store replay IDs to resume without gaps.
4. **SLA milestones.** Poll `CaseMilestone` for open P1/P2 cases every 60 s and compute time remaining.
5. **Optional push back (phase 2+).** Publish an `Ops_Event__e` Platform Event when an incident links to an account so agents see it on the Case.
6. **Stay inside limits.** Watch API usage per call and keep the integration under 20% of the daily allowance.

## Permissions and field-level security

- Two layers: the Salesforce permission set limits what the integration can read; the card API filters fields per audience from SSO groups.
- Where Salesforce sharing must apply exactly, query on the user's behalf with SOQL `WITH USER_MODE`.
- Engineer views never receive ARR, opportunity or renewal fields; filtering happens on the server, not in CSS.
- Wall displays mask contact names; every card view and export is audit-logged.
- Regional data residency rules apply to case text where required.

## Reliability targets

- Freshness SLOs: Salesforce change to card in under 60 s; SEV1 page to card in under 30 s.
- `/healthz` (liveness) and `/readyz` (readiness, including per-source `lastEventAt`).
- Idempotent webhook handling (dedupe by source event id), retries with backoff, and a dead-letter queue.

## Open questions

1. Which field is the source of truth for ARR and renewal date: an Account field, Contract, or subscription lines?
2. How are cases linked to incidents today: a Case field, a ServiceNow reference, or manually?
3. Is there a customer-to-service or tenant map to compute blast radius?
4. Which survey tool holds CSAT and NPS, and how fresh is it?
5. Who signs off on the risk weights, and should they vary by segment?
6. Which alert channel per audience (Slack, Teams, email, paging), and who tunes the noise?
7. Do executives want a mobile view, a daily digest, or both?
8. Is a wall display in scope, and what may appear on shared screens?
9. Should the card ever write back to Salesforce, and with what approvals?
10. Playful game language or plain business labels as the default for each audience?

Answers that change the design get an ADR in [adr/](adr/).
