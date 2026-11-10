# Audience views

> All examples are fictional.

The same card renders differently for six audiences. Each view is **configuration, not code**: define it in `src/config/audiences.ts` as `{ fields[], defaultLayer: "front" | "back" | "drill", density, refreshSeconds, alertRule }` and render from that config. Persist the chosen view in the URL as `?view=`.

| Audience | Default layer | What they see | Drill depth | Density | Refresh | Alerts |
| --- | --- | --- | --- | --- | --- | --- |
| Executives (`exec`) | Card front | Tier, ARR, renewal, health, risk band with a one-line why and an ask | Glance; one tap to a short brief | Very low, 5 to 7 data points | 15 min; instant on Critical | Critical on Platinum and Gold only; daily digest |
| Account teams (`account`) | Front + back | Opportunity, renewal, CSAT/NPS trend, case counts, top case, sponsor, next best action | Flip to the back; link to the Salesforce record | Medium | 5 min | High or worse on owned accounts; renewal risk changes |
| Service owners (`service`) | Back + service drill | Incidents on their services, blast radius by customer and ARR, SLA exposure, change windows | Service view across customers | Medium-high | Real-time, under 30 s | SEV1/SEV2 on owned services; SLO burn |
| Key leaders (`leaders`) | Back + roster | Escalations, blast radius, decisions needed, accountable owners, 8-week trend | Roster to card to brief | Medium | 1 min | Exec escalations, multi-customer SEV1, SLA breaches |
| Engineers (`eng`) | Drill-in | Incident detail, tenants, linked cases, runbook, recent changes, dashboards; **no commercial fields** | Full drill-in | High | Real-time stream | Paging stays in the incident tool; the card gives context |
| Support staff (`support`) | Drill-in on case | SLA countdown, entitlement, last contact, known-incident banner and macro, next action, timeline | Full case timeline | High | Real-time stream | SLA at 75% and 90%, new linked incident, customer reply |

## Progressive disclosure

1. **Front (glance):** who, how much, how risky, and the one thing on fire. Two-second read. Executives stop here.
2. **Back (detail):** commercial context, risk breakdown, owners and trend. Account teams and leaders flip or expand.
3. **Drill-in (work):** case timeline, linked incidents, runbooks and the next action. Engineers and support start here.

## Field-level rules

- Filtering is **server-side**. Hiding a field with CSS is not access control.
- The `eng` view never receives `arrUsd`, `opportunity` or `renewal`. A contract test must assert this.
- Wall-display tokens mask contact names.
- Users map to views through IdP groups (OIDC). Account teams see their own accounts by default (`AccountTeamMember`). Where Salesforce sharing must apply exactly, query on the user's behalf with SOQL `WITH USER_MODE`.
- Every card view and export is audit-logged (90-day retention).

## Example: the same customer, six ways (fictional)

Northwind Logistics, risk 84 Critical:

- **Exec:** $4.2M ARR · renews in 110 d · health 58. *Why:* a SEV1 gateway incident is hitting their P1 label case 47 min before SLA breach. *Ask:* exec-to-exec call with their COO today.
- **Account:** FY27 renewal + EU expansion, $1.1M, Negotiation; CSAT 3.6, NPS 12 (-18 in 90 d); 7 open cases, 1 P1, 2 escalated.
- **Service owner:** INC-20931 SEV1 on API Gateway eu-west-1, mitigating; blast radius 14 customers · $18.6M ARR; change window CHG-7782 at 08:00 PT.
- **Leaders:** 2 escalations; decision needed: approve a service credit and an exec call before the change window; trend 38 to 84 in 8 weeks.
- **Engineers:** INC-20931 via PagerDuty; tenants tn-eu-0412, tn-eu-0419; runbook RB-112; recent change gw-config v5.18.2. ARR, opportunity and renewal are not sent.
- **Support:** P1 00481234, 47 min to SLA (78% elapsed); known-incident banner with macro M-114; next: engineering bridge update due 05:15 PT.
