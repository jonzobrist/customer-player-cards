# Shared backend: data and integration layer

Salesforce + ops-source ingestion, linker, risk engine, per-audience card API with SSE.

Copy everything inside the fenced block below into a coding agent as a single prompt. It builds a backend against sandboxes and mocks, not a production system. See [the prompts README](README.md) for how to use it.

```text
ROLE
You are a senior backend and integration engineer. Build the data and integration layer that feeds the Customer Player Cards front end. Build against sandboxes and mocks first; never commit credentials.

GOAL
A service that assembles one card document per customer from Salesforce (Sales Cloud + Service Cloud) and operational sources (incident management, status page, monitoring, change management), computes the risk score, and serves cards to the UI filtered per audience, with real-time updates.

STACK
TypeScript on Node 20 (Fastify) for the API and workers; Postgres 16 (snapshots + history); Redis 7 (hot cache, pub/sub, and Redis Streams as the event bus to start); Server-Sent Events to clients; OpenTelemetry; Docker Compose for local; Vitest. Keep adapters and the bus behind interfaces so Kafka or a managed bus can replace Redis Streams later.

SOURCES AND ADAPTERS (src/adapters/*)
1. Salesforce
 - Auth: OAuth 2.0 JWT bearer flow with a Connected App / External Client App and a dedicated integration user; private key from a secrets manager.
 - Permission set "Player Cards Read": read-only on Account, Contact, AccountContactRelation, AccountTeamMember, Opportunity, Contract, Case, CaseMilestone, Entitlement, ServiceContract and the custom fields in use (e.g. Account.ARR__c, Account.Tier__c, Case.Related_Incident__c). No write access in phase 1.
 - Backfill: SOQL over REST/Composite (Bulk API 2.0 above 10k rows). Example: SELECT Id, CaseNumber, Subject, Priority, Status, IsEscalated, OwnerId, AccountId, CreatedDate, (SELECT MilestoneType.Name, StartDate, TargetDate, IsViolated, IsCompleted FROM CaseMilestones) FROM Case WHERE IsClosed = false
 - Streaming: Pub/Sub API (gRPC) subscriptions to Change Data Capture for Account, Opportunity, Case (and Contract if enabled); store replay IDs in Postgres for gap-free resume; full resync nightly.
 - SLA: poll CaseMilestone for open P1/P2 cases every 60 s (or use CDC if your org supports it) and compute minutesRemaining and pctElapsed.
 - Phase 2 option: publish an Ops_Event__e Platform Event when an incident links to an account so agents see it on the Case record.
 - Track usage from the Sforce-Limit-Info header; alert above 20% of the daily API limit.
2. Incident management: PagerDuty Webhooks v3 (incident.triggered, acknowledged, resolved, priority_updated) with signature verification plus REST backfill; ServiceNow Table API for incident and change_request (state, priority, cmdb_ci, start_date, end_date), polled every 2 min or pushed by an outbound REST business rule.
3. Status page: component status webhooks (operational, degraded, partial outage, major outage, maintenance).
4. Monitoring: alert webhooks (Datadog, Grafana, Prometheus Alertmanager) carrying service, region, tenant and SLO burn rate.
5. Mapping: customer-to-tenant and customer-to-service map from the CMDB or Salesforce Asset records, refreshed nightly, with a manual overrides table.

PIPELINE
- Normalize every source into OpsEvent { id, source, kind: SEV1|SEV2|SEV3|DEGRADED|CHANGE, title, service, region, tenants[], status, startedAt, startsAt?, endsAt?, links }. Map PagerDuty P1/P2/P3 -> SEV1/SEV2/SEV3; ServiceNow priority 1/2/3 -> SEV1/SEV2/SEV3; status page degraded or partial -> DEGRADED, major outage -> SEV1; change_request -> CHANGE.
- Linker: attach events to accounts by (a) explicit links (Case.Related_Incident__c, customer fields on PagerDuty/ServiceNow), (b) tenant match, (c) service map. Record linkReason and confidence; never link on time proximity alone.
- Card builder: on any change, rebuild affected cards (debounced 2 s), compute risk, diff against the last snapshot, write history, publish card.updated.
- Risk engine: src/risk/computeRisk.ts is a pure function shared with the front end as a package; weights configurable per segment in Postgres; every card stores component scores and fired overrides so the UI can explain the score.

RISK SCORE AND VISUAL RULES
- risk.score (0-100) = round(0.30*ops + 0.25*case + 0.20*sla + 0.15*commercial + 0.10*sentiment). Components arrive precomputed in the data; also implement computeRisk(components, flags) in src/lib/risk.ts with unit tests so scores can be recomputed when mock events change.
- ops = highest active linked event (SEV1 100, SEV2 70, SEV3 40, DEGRADED 30, CHANGE window within 24h 15, none 0; +10 if open more than 4h; cap 100).
- case = most urgent open case (P1 100, P2 70, P3 40, P4 20; +15 if escalated; cap 100).
- sla = percent of the SLA milestone elapsed on the most urgent open case (100 if breached).
- commercial = renewal runway (<=30d 90, <=90d 60, <=180d 40, else 20; +15 if the renewal opportunity is flagged at risk; cap 100).
- sentiment = 100 minus the average of CSAT (1-5 scaled to 0-100) and NPS (-100..100 scaled to 0-100); +10 if NPS fell more than 15 points in 90 days.
- Overrides: active SEV1 linked to an open P1 case => floor 80. Any breached SLA => floor 70. Executive escalation flag => +10 (cap 100). Store which overrides fired.
- Bands: 80-100 CRITICAL, 60-79 HIGH, 40-59 ELEVATED, 0-39 LOW.
- Never color alone. Every band has color + glyph + text label + aria-label:
  CRITICAL = red, octagon with "!", label "CRITICAL", pulsing 3px outline (750 ms cycle).
  HIGH = amber, triangle with "!", label "HIGH", solid 2px border.
  ELEVATED = yellow, diamond, label "ELEVATED", 1px tinted border.
  LOW = green, circle with check, label "LOW", default border.
- Active events render as status chips ordered by severity: glyph + kind + age (e.g. "SEV1 · 2h 14m"). CHANGE windows use a neutral clock glyph. Case priority maps P1->critical glyph, P2->high, P3->elevated, P4->low.
- SLA countdown: minutes remaining as text plus a bar of elapsed time; neutral below 75% elapsed, amber at 75%, red at 90%, and "BREACHED +Nm" after breach.
- prefers-reduced-motion: no pulsing, flipping, tickers or floating numbers; CRITICAL gets a static double border and transitions become crossfades.
- Text contrast meets WCAG 2.2 AA (4.5:1). Cards are keyboard focusable with visible focus rings. Live changes go to an aria-live="polite" region (assertive only for a new CRITICAL).

API
- GET /api/cards?view=exec|account|service|leaders|eng|support&band=&owner=&service= : cards filtered to that view's fields.
- GET /api/cards/:accountId?view=... : one card. GET /api/cards/:accountId/timeline : case + event timeline.
- GET /api/events/active : active OpsEvents with customersImpacted and arrImpactedUsd.
- GET /api/stream?view=... : SSE stream of card.updated and event.updated filtered by view and the caller's access.
- Card documents follow this schema:
{
  "asOf": "2026-11-10T12:43:00Z",
  "customers": [
    {
      "id": "001Nw00000AbCdE",
      "name": "Northwind Logistics",
      "tier": "Platinum",
      "segment": "Enterprise",
      "industry": "Logistics",
      "region": "EMEA",
      "arrUsd": 4200000,
      "renewal": {
        "date": "2027-02-28",
        "daysOut": 110,
        "contractId": "800Nw000001XyZ"
      },
      "health": {
        "score": 58,
        "adoptionPct": 71,
        "uptime30dPct": 99.62
      },
      "sentiment": {
        "csat": 3.6,
        "nps": 12,
        "npsDelta90d": -18
      },
      "risk": {
        "score": 84,
        "band": "critical",
        "components": {
          "ops": 100,
          "case": 100,
          "sla": 78,
          "commercial": 55,
          "sentiment": 50
        },
        "overrides": [
          "SEV1_LINKED_P1_FLOOR_80"
        ],
        "why": "SEV1 gateway incident is hitting their P1 case 47 min before SLA breach, 110 days before renewal.",
        "trend8w": [
          38,
          41,
          40,
          45,
          52,
          60,
          71,
          84
        ]
      },
      "owners": {
        "accountExec": "Dana Whitfield",
        "csm": "Priya Raman",
        "serviceOwner": "Marco Ruiz",
        "execSponsor": "Helen Ortiz (COO)"
      },
      "opportunity": {
        "id": "006Nw00000QrStU",
        "name": "FY27 renewal + EU expansion",
        "amountUsd": 1100000,
        "stage": "Negotiation",
        "closeDate": "2027-02-15",
        "atRisk": false
      },
      "entitlement": {
        "name": "Premier 24x7",
        "p1ResponseMins": 60,
        "namedTam": true
      },
      "cases": {
        "open": 7,
        "p1": 1,
        "escalated": 2,
        "top": {
          "id": "500Nw00000LmNoP",
          "number": "00481234",
          "subject": "EU label-creation API returning 502s",
          "priority": "P1",
          "status": "Escalated",
          "owner": "Sam Okafor",
          "createdAt": "2026-11-10T10:14:00Z",
          "lastCustomerContactAt": "2026-11-10T12:25:00Z",
          "sla": {
            "milestone": "Workaround",
            "targetAt": "2026-11-10T13:30:00Z",
            "minutesRemaining": 47,
            "pctElapsed": 78,
            "breached": false
          },
          "linkedEventIds": [
            "INC-20931"
          ],
          "nextAction": "Engineering bridge update due 13:15Z",
          "timeline": [
            {
              "at": "2026-11-10T10:12:00Z",
              "actor": "pagerduty",
              "text": "INC-20931 SEV1 opened"
            },
            {
              "at": "2026-11-10T10:14:00Z",
              "actor": "customer",
              "text": "Case opened by phone, P1"
            }
          ]
        }
      },
      "events": [
        {
          "id": "INC-20931",
          "source": "pagerduty",
          "kind": "SEV1",
          "title": "EU-West API gateway degraded",
          "service": "api-gateway",
          "region": "eu-west-1",
          "status": "mitigating",
          "startedAt": "2026-11-10T10:12:00Z",
          "customersImpacted": 14,
          "arrImpactedUsd": 18600000,
          "tenants": [
            "tn-eu-0412",
            "tn-eu-0419"
          ],
          "linkReason": "explicit",
          "runbookUrl": "https://runbooks.example.com/rb-112",
          "dashboardUrl": "https://dashboards.example.com/gw-eu-west"
        },
        {
          "id": "CHG-7782",
          "source": "servicenow",
          "kind": "CHANGE",
          "title": "Label service DB failover window",
          "service": "label-service",
          "status": "scheduled",
          "startsAt": "2026-11-10T16:00:00Z",
          "endsAt": "2026-11-10T17:00:00Z",
          "linkReason": "service-map"
        }
      ],
      "flags": {
        "execEscalation": false
      },
      "dataFreshness": {
        "salesforce": "2026-11-10T12:42:10Z",
        "pagerduty": "2026-11-10T12:42:55Z",
        "servicenow": "2026-11-10T12:40:00Z"
      }
    }
  ]
}

ACCESS CONTROL
- Users sign in with company SSO (OIDC); IdP groups map to views (exec, account, service, leaders, eng, support) in config.
- Field filtering is server-side from config/audiences.ts; the eng view never receives arrUsd, opportunity or renewal; wall-display tokens mask contact names.
- Record visibility: account teams see their own accounts by default (AccountTeamMember). Optionally query per user with their own OAuth token and SOQL WITH USER_MODE where Salesforce sharing and field-level security must apply exactly.
- Audit-log every card view and export; retain 90 days.

RELIABILITY
- Freshness SLOs: Salesforce change -> card under 60 s; SEV1 page -> card under 30 s. Expose /health and per-source lastEventAt; each card carries dataFreshness per source so the UI can grey stale fields.
- Idempotent webhook handling (dedupe by source event id), retries with backoff, and a dead-letter queue.

DELIVERABLES
- Docker Compose with Postgres, Redis, API, workers, and a mock-sources container that replays fixture webhooks (PagerDuty, ServiceNow, status page, monitoring) and fake Salesforce CDC events so the stack runs offline.
- Fixtures with 12+ fictional customers (Northwind Logistics, Contoso Health, ...).
- README covering Salesforce sandbox setup (Connected App, permission set, CDC entity selection) and a field-mapping table to fill in.

ACCEPTANCE CRITERIA
- docker compose up serves /api/cards from fixtures and a live SSE stream.
- Unit tests for computeRisk (every override and band boundary), the linker (explicit, tenant, service, no link), and per-view field filtering (eng view never contains commercial fields).
- Integration test: replaying a SEV1 webhook for a service Northwind uses moves its card to CRITICAL within 30 s and emits exactly one card.updated.
- Restart resumes from the stored replay ID with no missed or duplicated updates.
- No secrets in the repo; lint and type-check clean.
```
