# Data model

> Field names such as `ARR__c`, `Tier__c`, `Region__c` and `Related_Incident__c` are examples of custom fields. Map them to your org's actual fields. All sample values are fictional.

## Flow

```text
Salesforce ─┐
Incident tools (PagerDuty, ServiceNow) ─┤
Status page ─┼─> Ingest + normalize (OpsEvent, CDC) ─> Linker ─> Risk engine ─> Card API (per-audience fields, SSE) ─> Player cards
Monitoring ─┘                                            ▲
Service map (CMDB, tenants) ─────────────────────────────┘
```

## Salesforce field mapping

| Card field | Source | Object / field | Update path |
| --- | --- | --- | --- |
| Name, tier, segment, region | Salesforce | `Account.Name`, `Tier__c`, `Industry`, `Region__c` | Change Data Capture |
| ARR | Salesforce | `Account.ARR__c` or a rollup of Contract / subscription lines | Change Data Capture |
| Renewal date and runway | Salesforce | `Contract.EndDate` or renewal `Opportunity.CloseDate` | Change Data Capture |
| Open opportunity | Salesforce | `Opportunity.Name`, `Amount`, `StageName`, `CloseDate`, `Probability` | Change Data Capture |
| Owners | Salesforce | `Account.OwnerId`, `AccountTeamMember` (CSM, TAM) | CDC + nightly |
| Exec sponsor, key contacts | Salesforce | `Contact`, `AccountContactRelation.Roles` | Nightly |
| Top case | Service Cloud | `Case.CaseNumber`, `Subject`, `Priority`, `Status`, `IsEscalated`, `OwnerId` | Change Data Capture |
| SLA countdown | Service Cloud | `Entitlement`, `CaseMilestone.TargetDate`, `IsViolated` | Poll 60 s for open P1/P2 |
| CSAT / NPS | Survey tool | Survey responses or `CSAT__c`, `NPS__c` on Account | Nightly |
| Case to incident link | Both | `Case.Related_Incident__c`, tenant and service map | On every event |

### Salesforce access

- **Auth:** OAuth 2.0 JWT bearer flow with a Connected App / External Client App and a dedicated integration user. The private key lives in a secrets manager.
- **Permission set "Player Cards Read":** read-only on `Account`, `Contact`, `AccountContactRelation`, `AccountTeamMember`, `Opportunity`, `Contract`, `Case`, `CaseMilestone`, `Entitlement`, `ServiceContract` and the custom fields in use. No write access in phase 1.
- **Backfill:** SOQL over REST/Composite; Bulk API 2.0 above 10k rows.
- **Streaming:** Pub/Sub API (gRPC) subscriptions to Change Data Capture for Account, Opportunity and Case (and Contract if enabled). Store replay IDs for gap-free resume; full resync nightly.
- **Limits:** read `Sforce-Limit-Info`; alert above 20% of the daily API allowance.

Example backfill query:

```sql
SELECT Id, CaseNumber, Subject, Priority, Status, IsEscalated, OwnerId, AccountId, CreatedDate,
  (SELECT MilestoneType.Name, StartDate, TargetDate, IsViolated, IsCompleted FROM CaseMilestones)
FROM Case WHERE IsClosed = false
```

## Operational sources

| Card field | Source | Data | Update path |
| --- | --- | --- | --- |
| Active incidents | PagerDuty / ServiceNow | Priority, service, status, start time | PagerDuty Webhooks v3 (signature-verified) + REST backfill; ServiceNow Table API |
| Degraded services | Status page | Component status (operational, degraded, partial, major outage, maintenance) | Webhooks |
| Tenant alerts, SLO burn | Monitoring (Datadog, Grafana, Alertmanager) | Service, region, tenant, burn rate | Webhooks |
| Change windows | ServiceNow | `change_request` start, end, risk, CI | Poll every 2 min or outbound REST rule |
| Customer-to-service / tenant map | CMDB or Salesforce Asset records | Tenants and services per account | Nightly + manual overrides table |

## Normalized event

Every ops source is normalized into one shape:

```ts
interface OpsEvent {
  id: string;
  source: "pagerduty" | "servicenow" | "statuspage" | "monitoring";
  kind: "SEV1" | "SEV2" | "SEV3" | "DEGRADED" | "CHANGE";
  title: string;
  service: string;
  region?: string;
  tenants: string[];
  status: string;
  startedAt?: string; // ISO 8601
  startsAt?: string;  // change windows
  endsAt?: string;
  links: { runbook?: string; dashboard?: string };
}
```

Mapping: PagerDuty P1/P2/P3 to SEV1/SEV2/SEV3; ServiceNow priority 1/2/3 to SEV1/SEV2/SEV3; status page degraded or partial outage to DEGRADED, major outage to SEV1; `change_request` to CHANGE.

## Linking events to customers

The linker attaches events to accounts by, in order of confidence:

1. **Explicit links:** `Case.Related_Incident__c`, customer fields on PagerDuty or ServiceNow records.
2. **Tenant match:** event tenants intersect the account's tenants.
3. **Service map:** the event's service is in the account's service map.

Each link stores `linkReason` and a confidence. **Never link on time proximity alone.**

## Card document

The card API serves one document per customer. The full example schema is embedded in every prompt in [`prompts/`](../prompts/). Key fields: `risk { score, band, components, overrides, why, trend8w }`, `cases.top.sla { minutesRemaining, pctElapsed, breached }`, `events[] { kind, linkReason }`, and `dataFreshness` per source so the UI can grey out stale fields.
