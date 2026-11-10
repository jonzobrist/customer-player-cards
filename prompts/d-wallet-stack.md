# Style D: Wallet stack

Mobile-first stacked cards ordered by risk; tap to expand.

Copy everything inside the fenced block below into a coding agent as a single prompt. It builds a front-end prototype on fictional mock data, not a production system. See [the prompts README](README.md) for how to use it.

```text
ROLE
You are a senior front-end engineer and product designer. Build a clickable front-end prototype with mock data, not a production system.

GOAL
Customer Player Cards, Wallet Stack style: a "player card" view of customer status that combines Salesforce CRM data (account, opportunity, cases, entitlements/SLA, ARR, renewal, CSAT/NPS, owners) with live operational events (incidents, outages, degraded services, change windows) and shows health, the current top case, and critical risks at a glance.

STYLE CONCEPT
Minimal stacked cards, mobile first. Each collapsed card shows only name, tier, ARR and risk; the stack is ordered by risk so the most urgent customer is on top. Tapping a card lifts it out of the stack and expands it to show why, the top case with its SLA bar, events, renewal and next action. Calm and low-density, for executives and account teams on the go. Generic design: do not copy any vendor's wallet UI.

STACK
React 18 + TypeScript (strict) + Vite; Tailwind CSS with CSS variables for design tokens (light and dark themes); Framer Motion for motion; Radix UI primitives for accessible controls; Vitest + Testing Library; Storybook 8.

COMPONENTS
- DigestHeader: one sentence ("1 critical, 1 high, 4 steady across 12 accounts").
- WalletStack: overlapping cards (collapsed height 64 px, 22 px overlap) ordered by risk; a pinned "My accounts" stack above "All accounts".
- WalletCard collapsed: name, tier, ARR, risk number + glyph; CRITICAL shows a pulsing outline.
- WalletCard expanded: why sentence, top case (priority chip, number, subject, SlaBar), event chips, renewal date, AE, next action, and buttons "Open record" (mock link) and "Details".
- DetailSheet: bottom sheet on mobile, side sheet on desktop, with the back-of-card detail and, for support/eng views, the case timeline.

INTERACTIONS
- Tap to expand or collapse with a spring animation (crossfade under reduced motion); swipe down closes DetailSheet; arrow keys move between cards and Enter expands.
- When a customer becomes CRITICAL it animates to the top and a quiet toast (text + glyph) appears.
- Pull to refresh triggers a mock refresh.
- The AudienceSwitcher lives in a settings sheet; exec is the default.

AUDIENCE VIEWS (global AudienceSwitcher; persist the choice in the URL as ?view=)
- exec (Executives): card front only. Tier, ARR, renewal days, health, risk band + one-sentence "why", and an "ask" line. 5-7 data points, no case numbers. Refresh 15 min, instant on CRITICAL.
- account (Account teams): front + back. Opportunity (name, amount, stage, close), renewal, CSAT/NPS with 90-day delta, open/P1/escalated cases, top case one-liner, exec sponsor, owners, next best action. Refresh 5 min.
- service (Service owners): events on their services first: incident id, service, age, status, customers and ARR impacted (blast radius), SLA exposure, upcoming change windows. Real-time.
- leaders (Key leaders: VP Support, CS, Engineering): escalations, blast radius, decision needed, accountable owners, 8-week risk trend. Refresh 1 min.
- eng (Engineers): drill-in by default: incident detail, affected tenant ids, linked cases, runbook, recent deploys/changes, dashboard links. Real-time. Never show ARR, opportunity or renewal in this view.
- support (Support staff): drill-in on the top case: SLA countdown, entitlement, last customer contact, known-incident banner with macro, next action, case timeline. Real-time.
Define each view in src/config/audiences.ts as { fields[], defaultLayer: "front" | "back" | "drill", density, refreshSeconds, alertRule } and render from that config; do not hard-code view logic in components.

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

MOCK DATA
Create src/data/customers.json with at least 12 fictional customers that follow the schema below. Include at least one customer per band, one with no active events, one with a breached SLA, one with only a CHANGE window, and one whose risk is driven mainly by commercial factors. Use only fictional names (Northwind Logistics, Contoso Health, Wide World Importers, Adventure Works, Tailspin Air, Fabrikam Retail, ...). Show an "Illustrative data" label in the footer. Add src/data/mockStream.ts that every 10 s mutates one customer (new incident, SLA tick, incident resolved, risk recomputed) so live states can be demoed; a Pause control stops it.

SCHEMA (TypeScript types in src/types.ts must match this example):
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

GENERAL ACCEPTANCE CRITERIA
- npm install && npm run dev works with no backend; npm run build passes with zero TypeScript errors in strict mode.
- All six audience views switch without a reload and show exactly the fields listed above.
- Risk badge, chips, SLA bar and borders follow the risk rules; computeRisk has Vitest tests for every override and band boundary.
- Responsive from 360 px to 1920 px with no horizontal scroll at 360 px.
- Lighthouse accessibility >= 95; full keyboard navigation; reduced motion respected; the UI is understandable in grayscale.
- Storybook (or a /gallery route) shows every component in every band.
- No network calls, no real customer data, no Salesforce credentials in the repo.
- All data access goes through src/lib/dataSource.ts (interface + mock implementation) so the backend layer can replace it later.

STYLE-SPECIFIC ACCEPTANCE CRITERIA
- Designed at 390x844 first, works at 360 px; desktop centers a 420 px column.
- Overlap is consistent and no expanded content is clipped.
- Installable as a PWA with an offline last-known snapshot labeled with its asOf time.

OUT OF SCOPE
Real Salesforce or incident-tool integration, authentication, persistence, and write-backs.
```
