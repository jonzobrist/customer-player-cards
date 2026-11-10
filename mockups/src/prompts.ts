const SCHEMA_JSON = JSON.stringify({
  asOf: "2026-11-10T12:43:00Z",
  customers: [{
    id: "001Nw00000AbCdE", name: "Northwind Logistics", tier: "Platinum", segment: "Enterprise", industry: "Logistics", region: "EMEA",
    arrUsd: 4200000, renewal: { date: "2027-02-28", daysOut: 110, contractId: "800Nw000001XyZ" },
    health: { score: 58, adoptionPct: 71, uptime30dPct: 99.62 },
    sentiment: { csat: 3.6, nps: 12, npsDelta90d: -18 },
    risk: { score: 84, band: "critical", components: { ops: 100, case: 100, sla: 78, commercial: 55, sentiment: 50 }, overrides: ["SEV1_LINKED_P1_FLOOR_80"], why: "SEV1 gateway incident is hitting their P1 case 47 min before SLA breach, 110 days before renewal.", trend8w: [38, 41, 40, 45, 52, 60, 71, 84] },
    owners: { accountExec: "Dana Whitfield", csm: "Priya Raman", serviceOwner: "Marco Ruiz", execSponsor: "Helen Ortiz (COO)" },
    opportunity: { id: "006Nw00000QrStU", name: "FY27 renewal + EU expansion", amountUsd: 1100000, stage: "Negotiation", closeDate: "2027-02-15", atRisk: false },
    entitlement: { name: "Premier 24x7", p1ResponseMins: 60, namedTam: true },
    cases: {
      open: 7, p1: 1, escalated: 2,
      top: {
        id: "500Nw00000LmNoP", number: "00481234", subject: "EU label-creation API returning 502s", priority: "P1", status: "Escalated", owner: "Sam Okafor",
        createdAt: "2026-11-10T10:14:00Z", lastCustomerContactAt: "2026-11-10T12:25:00Z",
        sla: { milestone: "Workaround", targetAt: "2026-11-10T13:30:00Z", minutesRemaining: 47, pctElapsed: 78, breached: false },
        linkedEventIds: ["INC-20931"], nextAction: "Engineering bridge update due 13:15Z",
        timeline: [{ at: "2026-11-10T10:12:00Z", actor: "pagerduty", text: "INC-20931 SEV1 opened" }, { at: "2026-11-10T10:14:00Z", actor: "customer", text: "Case opened by phone, P1" }],
      },
    },
    events: [
      { id: "INC-20931", source: "pagerduty", kind: "SEV1", title: "EU-West API gateway degraded", service: "api-gateway", region: "eu-west-1", status: "mitigating", startedAt: "2026-11-10T10:12:00Z", customersImpacted: 14, arrImpactedUsd: 18600000, tenants: ["tn-eu-0412", "tn-eu-0419"], linkReason: "explicit", runbookUrl: "https://runbooks.example.com/rb-112", dashboardUrl: "https://dashboards.example.com/gw-eu-west" },
      { id: "CHG-7782", source: "servicenow", kind: "CHANGE", title: "Label service DB failover window", service: "label-service", status: "scheduled", startsAt: "2026-11-10T16:00:00Z", endsAt: "2026-11-10T17:00:00Z", linkReason: "service-map" },
    ],
    flags: { execEscalation: false },
    dataFreshness: { salesforce: "2026-11-10T12:42:10Z", pagerduty: "2026-11-10T12:42:55Z", servicenow: "2026-11-10T12:40:00Z" },
  }],
}, null, 2);

const STACK = "React 18 + TypeScript (strict) + Vite; Tailwind CSS with CSS variables for design tokens (light and dark themes); Framer Motion for motion; Radix UI primitives for accessible controls; Vitest + Testing Library; Storybook 8.";

const SHARED_RISK = `RISK SCORE AND VISUAL RULES
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
- Text contrast meets WCAG 2.2 AA (4.5:1). Cards are keyboard focusable with visible focus rings. Live changes go to an aria-live="polite" region (assertive only for a new CRITICAL).`;

const SHARED_AUD = `AUDIENCE VIEWS (global AudienceSwitcher; persist the choice in the URL as ?view=)
- exec (Executives): card front only. Tier, ARR, renewal days, health, risk band + one-sentence "why", and an "ask" line. 5-7 data points, no case numbers. Refresh 15 min, instant on CRITICAL.
- account (Account teams): front + back. Opportunity (name, amount, stage, close), renewal, CSAT/NPS with 90-day delta, open/P1/escalated cases, top case one-liner, exec sponsor, owners, next best action. Refresh 5 min.
- service (Service owners): events on their services first: incident id, service, age, status, customers and ARR impacted (blast radius), SLA exposure, upcoming change windows. Real-time.
- leaders (Key leaders: VP Support, CS, Engineering): escalations, blast radius, decision needed, accountable owners, 8-week risk trend. Refresh 1 min.
- eng (Engineers): drill-in by default: incident detail, affected tenant ids, linked cases, runbook, recent deploys/changes, dashboard links. Real-time. Never show ARR, opportunity or renewal in this view.
- support (Support staff): drill-in on the top case: SLA countdown, entitlement, last customer contact, known-incident banner with macro, next action, case timeline. Real-time.
Define each view in src/config/audiences.ts as { fields[], defaultLayer: "front" | "back" | "drill", density, refreshSeconds, alertRule } and render from that config; do not hard-code view logic in components.`;

const SHARED_DATA = `MOCK DATA
Create src/data/customers.json with at least 12 fictional customers that follow the schema below. Include at least one customer per band, one with no active events, one with a breached SLA, one with only a CHANGE window, and one whose risk is driven mainly by commercial factors. Use only fictional names (Northwind Logistics, Contoso Health, Wide World Importers, Adventure Works, Tailspin Air, Fabrikam Retail, ...). Show an "Illustrative data" label in the footer. Add src/data/mockStream.ts that every 10 s mutates one customer (new incident, SLA tick, incident resolved, risk recomputed) so live states can be demoed; a Pause control stops it.

SCHEMA (TypeScript types in src/types.ts must match this example):
${SCHEMA_JSON}`;

const SHARED_AC = `GENERAL ACCEPTANCE CRITERIA
- npm install && npm run dev works with no backend; npm run build passes with zero TypeScript errors in strict mode.
- All six audience views switch without a reload and show exactly the fields listed above.
- Risk badge, chips, SLA bar and borders follow the risk rules; computeRisk has Vitest tests for every override and band boundary.
- Responsive from 360 px to 1920 px with no horizontal scroll at 360 px.
- Lighthouse accessibility >= 95; full keyboard navigation; reduced motion respected; the UI is understandable in grayscale.
- Storybook (or a /gallery route) shows every component in every band.
- No network calls, no real customer data, no Salesforce credentials in the repo.
- All data access goes through src/lib/dataSource.ts (interface + mock implementation) so the backend layer can replace it later.`;

function stylePrompt(title: string, concept: string, comps: string, interactions: string, extra: string): string {
  return `ROLE
You are a senior front-end engineer and product designer. Build a clickable front-end prototype with mock data, not a production system.

GOAL
${title}: a "player card" view of customer status that combines Salesforce CRM data (account, opportunity, cases, entitlements/SLA, ARR, renewal, CSAT/NPS, owners) with live operational events (incidents, outages, degraded services, change windows) and shows health, the current top case, and critical risks at a glance.

STYLE CONCEPT
${concept}

STACK
${STACK}

COMPONENTS
${comps}

INTERACTIONS
${interactions}

${SHARED_AUD}

${SHARED_RISK}

${SHARED_DATA}

${SHARED_AC}

STYLE-SPECIFIC ACCEPTANCE CRITERIA
${extra}

OUT OF SCOPE
Real Salesforce or incident-tool integration, authentication, persistence, and write-backs.`;
}

const PROMPT_A = stylePrompt("Customer Player Cards, Trading Card style",
  "Each customer is a portrait trading card (5:7 ratio), like a sports card. Tier is card rarity: Platinum, Gold, Silver, Bronze frames with 4/3/2/1 stars. The front is the executive glance; flipping shows the back with season stats for account teams and leaders; a Drill-in action opens a side panel for engineers and support.",
  `- AppShell: header with AudienceSwitcher, band filter chips (glyph + label + count), tier filter, sort (risk, ARR, renewal), name search; footer with "Illustrative data" and the asOf time.
- CardDeck: responsive grid (auto-fill, min 280 px) sorted by risk, highest first.
- PlayerCardFront: rarity frame + stars, card number, "art window" with the customer monogram on a band-tinted panel, RiskBadge (number + glyph + band label), 8-week risk sparkline, name banner (name, segment, industry, region), five StatBars (Health; Sentiment = (NPS+100)/2; Adoption; SLA buffer = 100 - pctElapsed; Renewal runway = daysOut/365), TopCase strip (priority chip, case number, subject, SLA remaining), StatusChips for events, footer (ARR, renews in N days, AE).
- PlayerCardBack: season-stats grid (ARR, renewal date, opportunity amount and stage, CSAT, NPS with delta, open/P1/escalated cases), RiskBreakdown (five mini bars with weighted points), TeamRow (AE, CSM, service owner, exec sponsor), larger 8-week trend, entitlement line.
- DrillPanel (slide-over, 480 px desktop, full screen on mobile): case header with SlaBar, case timeline (actor-labeled dots), linked events table, runbooks and dashboards, upcoming change windows.
- Shared: RiskBadge, SeverityGlyph, StatusChip, StatBar, SlaBar, Sparkline.`,
  `- Click or Space flips a card (rotateY 180deg, 450 ms; crossfade under reduced motion); Enter opens DrillPanel. Flip state is per card.
- The audience sets the default layer: exec shows fronts only and hides the flip affordance; account and leaders can flip; eng and support open straight into DrillPanel.
- A card that becomes CRITICAL pulses and animates to the top of the deck.
- Compare mode: pick two cards to see their backs side by side.`,
  `- The front reads at 280 px wide with no truncation of name, risk, or top case number.
- Flip works with mouse, touch and keyboard; the hidden side is aria-hidden.
- A print stylesheet prints one card front and back per page for QBR handouts.`);

const PROMPT_B = stylePrompt("Customer Player Cards, Broadcast Scoreboard style",
  "A sports-broadcast score bug and stat overlay. Each customer is a team: HEALTH and RISK are the scores, the top case SLA is the game clock, renewal is the period (T-minus days), and active incidents run in a ticker. A league table ranks every customer. Built for wall displays and for leaders scanning many accounts.",
  `- ScoreBug: team block (monogram tile in tier color, name, tier, segment, region), score block (HEALTH and RISK numerals; risk with glyph + band), clock block (SLA remaining, case priority and number), period block (renewal T-minus and ARR), LIVE tag when any SEV1/SEV2 is active (pulsing dot + the word LIVE).
- StatStrip: CSAT, NPS with delta arrow, open cases, escalations, 30-day uptime, opportunity.
- EventTicker: active events and change windows (glyph, id, kind, title, age, status); pauses on hover/focus; a static wrapped list under reduced motion.
- LeagueTable: compact rows (rank, name, top case priority + SLA, risk badge, movement vs last hour) sorted by risk; selecting a row loads its ScoreBug.
- PlayByPlay: drill-in panel showing the case timeline as play-by-play, interleaved with incident milestones.
- WallMode: 1920x1080 full-screen layout (ScoreBug, LeagueTable, ticker) auto-rotating every 20 s through CRITICAL and HIGH customers; contact names masked.`,
  `- Breaking takeover: when a customer enters CRITICAL, the ScoreBug shows a "BREAKING" banner for 8 s (text + glyph) and the league table re-sorts with animation.
- Keyboard: arrow keys move through league rows; W toggles WallMode; P pauses rotation.
- The audience changes the stat strip: exec shows ARR, renewal and risk only; eng hides commercial fields and shows service, tenants and runbook.`,
  `- WallMode is legible from 3 m: numbers at least 28 px and labels at least 18 px at 1080p.
- The ticker never moves under reduced motion and can always be paused.
- League re-sort finishes under 400 ms and keeps keyboard focus on the same customer.`);

const PROMPT_C = stylePrompt("Customer Player Cards, RPG Character Sheet style",
  "A video-game character sheet per customer. Health score is HP, the SLA buffer on the top case is the shield, renewal runway is XP, and each active operational event is a status effect with an icon, source, duration and effect text. Open cases are the quest log, entitlements are equipment, account owners are the party. A Plain labels toggle swaps every game term for its business term.",
  `- CharacterHeader: portrait tile (monogram, tier-colored frame), name, Level = tier (Platinum 4 to Bronze 1), Class = segment + industry, Realm = region, RiskBadge, Plain labels toggle.
- VitalBars: HP (health; red under 50, amber under 70, green otherwise), Shield (100 - SLA pctElapsed, drains live from the mock stream), XP (renewal runway). Each bar prints its value and uses role="meter" with aria-valuenow.
- AttributeGrid: STR = ARR, DEF = 30-day uptime, CHA = NPS, INT = adoption %, WIS = CSAT, LOAD = open cases; the business label sits under each stat.
- StatusEffects: one row per active event: glyph, effect name (SEV1 Burning, SEV2 Poisoned, SEV3 Slowed, DEGRADED Weakened, CHANGE Warded), source id + kind + duration, and effect text (e.g. "Health drains each hour; SLA shield decays 2x"); sorted by severity.
- QuestLog: top case as Active Quest with SLA bar, then other open cases; quests resolved in the last 7 days collapsed.
- Equipment (entitlement chips) and Party (owners with roles).
- CombatLog (drill-in): case and incident timeline in one chronological, actor-labeled log.
- PartyRoster: left rail of all customers as small portraits with HP bars, sorted by risk.`,
  `- When risk rises, a "+N risk" number floats up from the RiskBadge (suppressed under reduced motion; announced via aria-live).
- Focusing a status effect shows its runbook and dashboard links.
- Plain labels defaults ON for exec and account views and OFF for eng and support (HP -> Health, Shield -> SLA buffer, XP -> Renewal runway, effects -> incident kinds, Quest -> Case).
- Exec view shows header, vitals and the top effect only; eng view expands StatusEffects and CombatLog.`,
  `- Every game term has its business term visible within one interaction.
- Vitals and effects are understandable in grayscale.
- Layout works at 360 px (one column) and 1440 px (roster rail, sheet, combat log).`);

const PROMPT_D = stylePrompt("Customer Player Cards, Wallet Stack style",
  "Minimal stacked cards, mobile first. Each collapsed card shows only name, tier, ARR and risk; the stack is ordered by risk so the most urgent customer is on top. Tapping a card lifts it out of the stack and expands it to show why, the top case with its SLA bar, events, renewal and next action. Calm and low-density, for executives and account teams on the go. Generic design: do not copy any vendor's wallet UI.",
  `- DigestHeader: one sentence ("1 critical, 1 high, 4 steady across 12 accounts").
- WalletStack: overlapping cards (collapsed height 64 px, 22 px overlap) ordered by risk; a pinned "My accounts" stack above "All accounts".
- WalletCard collapsed: name, tier, ARR, risk number + glyph; CRITICAL shows a pulsing outline.
- WalletCard expanded: why sentence, top case (priority chip, number, subject, SlaBar), event chips, renewal date, AE, next action, and buttons "Open record" (mock link) and "Details".
- DetailSheet: bottom sheet on mobile, side sheet on desktop, with the back-of-card detail and, for support/eng views, the case timeline.`,
  `- Tap to expand or collapse with a spring animation (crossfade under reduced motion); swipe down closes DetailSheet; arrow keys move between cards and Enter expands.
- When a customer becomes CRITICAL it animates to the top and a quiet toast (text + glyph) appears.
- Pull to refresh triggers a mock refresh.
- The AudienceSwitcher lives in a settings sheet; exec is the default.`,
  `- Designed at 390x844 first, works at 360 px; desktop centers a 420 px column.
- Overlap is consistent and no expanded content is clipped.
- Installable as a PWA with an offline last-known snapshot labeled with its asOf time.`);

const PROMPT_E = stylePrompt("Customer Player Cards, Roster Heatmap style",
  "A team-roster grid of mini player cards, one tile per customer, tinted by risk band, so leaders see the whole book at once and spot clusters. A companion heatmap shows customers against the five risk components, and a blast-radius mode highlights every customer touched by a selected incident.",
  `- KpiHeader: count per band, ARR at risk (sum of ARR for HIGH + CRITICAL), SLA breaches due in the next 2 h.
- RosterGrid: auto-fill tiles (min 150 px): name, ARR, tier, risk number + glyph + label, thin health bar, event text ("SEV1 active"). Tile tint = band; CRITICAL tiles pulse.
- GroupBy (none, account owner, segment, region, impacted service) renders labeled rows with subtotal ARR at risk; SortBy (risk, ARR, renewal, health).
- RiskHeatmap: customers (rows) x components (Ops, Case, SLA, Commercial, Sentiment) with a sequential scale, the value printed in each cell, and a legend.
- BlastRadius: incident picker of active events; selecting one dims unaffected tiles and shows customers and ARR impacted.
- TileDetail: selecting a tile opens the full player card (front and back) in a dialog.`,
  `- Hover or focus a tile for a tooltip with why + top case.
- Shift-click selects several tiles to compare in a table.
- Leaders default to group by owner; service owners default to group by impacted service with BlastRadius on; exec shows only CRITICAL and HIGH tiles plus a count of the rest.`,
  `- 200 mock customers render in under 100 ms and scroll smoothly (virtualize if needed).
- Heatmap cells print numbers and are usable in grayscale.
- Blast-radius totals equal the sum of the highlighted tiles.`);

const PROMPT_BACKEND = `ROLE
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

${SHARED_RISK}

API
- GET /api/cards?view=exec|account|service|leaders|eng|support&band=&owner=&service= : cards filtered to that view's fields.
- GET /api/cards/:accountId?view=... : one card. GET /api/cards/:accountId/timeline : case + event timeline.
- GET /api/events/active : active OpsEvents with customersImpacted and arrImpactedUsd.
- GET /api/stream?view=... : SSE stream of card.updated and event.updated filtered by view and the caller's access.
- Card documents follow this schema:
${SCHEMA_JSON}

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
- No secrets in the repo; lint and type-check clean.`;

const AUDS = [
  { value: "exec", label: "Executives" }, { value: "account", label: "Account teams" }, { value: "service", label: "Service owners" },
  { value: "leaders", label: "Key leaders" }, { value: "eng", label: "Engineers" }, { value: "support", label: "Support staff" },
];
const AUD_SPEC: Record<string, { layer: string; sees: string; depth: string; density: string; refresh: string; alerts: string }> = {
  exec: { layer: "Card front", sees: "Tier, ARR, renewal, health, risk band with a one-line why and an ask", depth: "Glance; one tap to a short brief", density: "Very low, 5 to 7 data points", refresh: "15 min; instant on Critical", alerts: "Critical on Platinum and Gold only; daily digest" },
  account: { layer: "Front + back", sees: "Opportunity, renewal, CSAT/NPS trend, case counts, top case, sponsor, next best action", depth: "Flip to the back; link to the Salesforce record", density: "Medium", refresh: "5 min", alerts: "High or worse on owned accounts; renewal risk changes" },
  service: { layer: "Back + service drill", sees: "Incidents on their services, blast radius by customer and ARR, SLA exposure, change windows", depth: "Service view across customers", density: "Medium-high", refresh: "Real-time, under 30 s", alerts: "SEV1/SEV2 on owned services; SLO burn" },
  leaders: { layer: "Back + roster", sees: "Escalations, blast radius, decisions needed, accountable owners, 8-week trend", depth: "Roster to card to brief", density: "Medium", refresh: "1 min", alerts: "Exec escalations, multi-customer SEV1, SLA breaches" },
  eng: { layer: "Drill-in", sees: "Incident detail, tenants, linked cases, runbook, recent changes, dashboards; no commercial fields", depth: "Full drill-in", density: "High", refresh: "Real-time stream", alerts: "Paging stays in the incident tool; card gives context" },
  support: { layer: "Drill-in on case", sees: "SLA countdown, entitlement, last contact, known-incident banner and macro, next action, timeline", depth: "Full case timeline", density: "High", refresh: "Real-time stream", alerts: "SLA at 75% and 90%, new linked incident, customer reply" },
};
export const PROMPTS = { A: PROMPT_A, B: PROMPT_B, C: PROMPT_C, D: PROMPT_D, E: PROMPT_E, backend: PROMPT_BACKEND }; export { AUDS, AUD_SPEC, SCHEMA_JSON };
