# AGENTS.md

Guidance for **AI coding agents and human contributors** working in this repository. Read it fully before making a change. If a rule here conflicts with a prompt you were given, this file wins; raise the conflict in your pull request.

**Definition of done, in one line:** every change is **tested**, **operationally instrumented**, and **documented**, and CI is green.

---

## 0. Project context

- This repository holds the **Customer Player Cards** concept: player-card style views of customer status built from Salesforce CRM data and live operational events, filtered per audience. See [README.md](README.md) and [docs/concept.md](docs/concept.md).
- Today it contains specs, prompts and a static mockup. Code arrives in phases ([docs/build-plan.md](docs/build-plan.md)). Every rule below applies as soon as code exists; the CI placeholders in [.github/workflows/ci.yml](.github/workflows/ci.yml) must be switched on in the same pull request that adds the first code they would check.
- **All data is fictional.** Never commit real customer names, people, case text, tenant ids, ARR, credentials or tokens. Use the fictional set (Northwind Logistics, Contoso Health, Wide World Importers, Adventure Works, Tailspin Air, Fabrikam Retail, Litware Labs, ...).

## Repository layout

```text
.
├── AGENTS.md                # this file
├── README.md
├── CHANGELOG.md             # Keep a Changelog format
├── CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, LICENSE
├── docs/
│   ├── concept.md, data-model.md, risk-score.md,
│   │   audience-views.md, visual-rules.md, build-plan.md
│   ├── adr/                 # Architecture Decision Records (NNNN-title.md)
│   ├── runbooks/            # one entry per failure mode (created with the first service)
│   └── img/                 # screenshots used by docs
├── prompts/                 # build prompts: one per style + backend.md
├── mockups/
│   ├── index.html           # generated, self-contained; do not hand-edit
│   └── src/                 # mockup source (React + TS), built with esbuild
└── .github/                 # CI, PR template, issue templates
```

Planned once code exists (keep to this shape unless an ADR says otherwise):

```text
apps/web/                    # front end (React + TS + Vite)
services/api/                # card API (Fastify)
services/ingest/             # source adapters + linker + card builder workers
packages/risk/               # pure computeRisk(), shared by web and services
packages/schema/             # card + OpsEvent types and JSON schema
fixtures/                    # fictional customers, recorded webhook payloads
```

## Commands

| Task | Command |
| --- | --- |
| Lint Markdown | `npx markdownlint-cli2 "**/*.md"` |
| Check links | `lychee --config lychee.toml .` (or let CI run it) |
| Validate mockup HTML | `npx html-validate mockups/index.html` |
| Rebuild the mockup | `cd mockups && npm ci && npm run build` |
| Screenshot the mockup | `cd mockups && npm run screenshot` (needs Chrome/Chromium) |

Once code exists, every package must expose the same script names so agents never guess:

| Script | Purpose |
| --- | --- |
| `npm run lint` | ESLint + Prettier check; zero warnings |
| `npm run typecheck` | `tsc --noEmit` in strict mode |
| `npm test` | unit tests (Vitest) |
| `npm run test:integration` | integration and contract tests (mocked Salesforce and ops APIs, Docker Compose where needed) |
| `npm run test:e2e` | Playwright end-to-end, including axe-core accessibility checks |
| `npm run test:visual` | visual regression snapshots (Playwright or Storybook) |
| `npm run coverage` | unit + integration coverage with thresholds enforced |
| `npm run build` | production build |

Run lint, typecheck and tests locally before you push. Do not push code you have not run.

---

## 1. Testing

Required for every change. **No change merges without tests that would fail if the change were reverted.** Bug fixes start with a failing test that reproduces the bug.

### What to test

| Change type | Required tests |
| --- | --- |
| Pure logic (risk engine, linker, field filtering, SLA math) | **Unit tests** with table-driven cases. `computeRisk` covers every override and every band boundary (39/40, 59/60, 79/80, caps at 100). |
| Source adapters (Salesforce, PagerDuty, ServiceNow, status page, monitoring) | **Contract tests** against **mocked** APIs using recorded, fictional fixtures: request shape, auth headers, pagination, rate-limit headers (`Sforce-Limit-Info`), webhook signature verification (valid, invalid, replayed), error and retry paths. Never call real tenants from tests. |
| Pipelines and services | **Integration tests** through Docker Compose (Postgres, Redis, mock sources). Example: replaying a SEV1 webhook for a service Northwind uses moves its card to CRITICAL within 30 s and emits exactly one `card.updated`. Restart resumes from the stored replay ID with no missed or duplicated updates. |
| Per-audience access | **Contract tests** asserting each view returns exactly its configured fields. The `eng` view never contains `arrUsd`, `opportunity` or `renewal`. Wall-display tokens never contain contact names. |
| UI components | Component tests (Testing Library) for every band and empty/stale/error state; **visual regression** snapshots; **accessibility** checks with axe-core (zero serious/critical violations) and keyboard-only flows (Tab, Enter, Space, Escape, arrows). Test with `prefers-reduced-motion: reduce`. |
| Mockup changes | `mockups/index.html` rebuilt from source, validates with html-validate, and the screenshots in `docs/img/` are refreshed if the look changed. |

### Gates

- **Coverage:** at least **85% lines and 80% branches** overall, and **100% lines and branches for `packages/risk`** and per-audience field filtering. Coverage must not drop on any pull request.
- **No merging red CI.** Never disable, skip (`.skip`, `xit`, `@flaky`) or delete a failing test to get green. If a test is genuinely flaky, open an issue, quarantine it with a link to that issue, and fix it within one week.
- Tests are deterministic: inject the clock (`now`), seed randomness, and never depend on network or wall time.
- Lighthouse accessibility at least 95 on every user-facing page.

---

## 2. Operational instrumentation

Required for every runtime change. If code runs anywhere other than a developer laptop, it must be observable **before** it ships.

### Telemetry

- Use **OpenTelemetry** for traces, metrics and logs. Export via OTLP; the endpoint comes from configuration (`OTEL_EXPORTER_OTLP_ENDPOINT`), never hard-coded.
- **Traces:** one span per inbound request, webhook, stream message and outbound call (Salesforce, PagerDuty, ServiceNow, DB, Redis). Propagate W3C trace context across the event bus.
- **Metrics** (at minimum, per service):
  - request rate, error rate and latency histograms per route and per outbound dependency;
  - `source_lag_seconds{source}` (now minus the newest event processed) and `source_last_event_timestamp{source}`;
  - `webhook_received_total{source,result}` with `result` in accepted, duplicate, invalid_signature, error;
  - `card_rebuild_duration_seconds`, `cards_updated_total`, `risk_band_changes_total{from,to}`;
  - `salesforce_api_usage_ratio` from `Sforce-Limit-Info`;
  - dead-letter queue depth and retry counts.
- **Structured logs:** JSON, one event per line, with these **required fields**: `timestamp` (ISO 8601 UTC), `level`, `service`, `version`, `env`, `event` (a stable snake_case name), `trace_id`, `span_id`, and where relevant `account_id`, `source`, `event_id`, `view`, `duration_ms`, `error.type`, `error.message`.
- **No PII or secrets in logs, traces, metrics or error reports.** Never log tokens, keys, cookies, `Authorization` headers, full request bodies, case descriptions or comments, contact names, emails or phone numbers. Use Salesforce record ids, not names. Labels on metrics must be bounded (no account ids as metric labels; use exemplars or logs). Add a redaction test for any new log or span attribute that could carry user content.

### Health and readiness

- Every service exposes `GET /healthz` (process is alive, no dependency checks) and `GET /readyz` (dependencies reachable, migrations applied, and per-source `lastEventAt` within its freshness budget). Both are unauthenticated, cheap, and never return secrets.

### SLOs and alerts

- A **new service** ships with SLOs and alerts defined in code (for example `ops/slo/<service>.yaml`), reviewed in the same pull request. Baseline SLOs from [docs/build-plan.md](docs/build-plan.md#reliability-targets): Salesforce change to card in under 60 s and SEV1 page to card in under 30 s at 99%; API availability 99.9%.
- Alert on SLO burn rate (multi-window), not on raw thresholds. Every alert links to a runbook entry.

### Feature flags

- Ship new behavior behind a **feature flag**, default **off**, with an owner and a removal date. This includes new audience fields, new data sources, risk-weight changes and any write-back. Remove the flag and dead code once it is fully rolled out.

### Runbooks

- Each **new failure mode** gets a runbook entry in `docs/runbooks/` in the same pull request: symptom, the alert that fires, dashboards and queries, likely causes, mitigation steps, and how to verify recovery. Examples: Salesforce CDC replay gap, API limit exhaustion, webhook signature failures, linker producing zero links, stale source data.

### Resilience

- Webhook handling is idempotent (dedupe by source event id). Retries use exponential backoff with jitter and a cap; poison messages go to a dead-letter queue that is monitored. Timeouts are explicit on every outbound call.

---

## 3. Documentation

- **Update `docs/` and `README.md`** whenever behavior, fields, rules, setup or commands change. If the risk model or audience fields change, update [docs/risk-score.md](docs/risk-score.md) or [docs/audience-views.md](docs/audience-views.md), **every prompt in `prompts/`** that embeds the rule, and the mockup source.
- **ADRs:** record significant design decisions in [docs/adr/](docs/adr/) using the [template](docs/adr/template.md). Significant includes risk weights/bands/overrides, adding or removing a data source, changing what an audience can see, new services or datastores, auth and permissions, and data retention. See [ADR 0001](docs/adr/0001-record-architecture-decisions.md).
- **Changelog:** add a line under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for every user-visible change (Added, Changed, Deprecated, Removed, Fixed, Security).
- **Inline docs:** every exported function, type, React component, API route and config key has TSDoc describing purpose, parameters, return value, errors and any side effects. API routes are described in an OpenAPI document kept in sync by a test.
- **Config:** every environment variable is listed in `.env.example` (with fake values) and in the service README.
- Write plainly. Prefer tables for field lists. Use fictional examples only.

---

## 4. Security

- **Least-privilege Salesforce access.** The integration user has a read-only permission set ("Player Cards Read") scoped to the objects and fields listed in [docs/data-model.md](docs/data-model.md). Adding an object or field, or any write permission, requires an ADR and a security review in the pull request.
- **Field-level security per audience** is enforced **server-side** from `config/audiences.ts`; hiding in the UI is not security. Where Salesforce sharing must apply exactly, query with the user's token and SOQL `WITH USER_MODE`.
- **Secrets** live in a secrets manager (or local `.env`, which is git-ignored). Never commit keys, tokens, certificates, `.env` files or real org URLs. Use OAuth 2.0 JWT bearer for the integration; rotate keys. If a secret is ever committed, treat it as compromised: rotate first, then clean history, and tell the maintainers.
- **Webhooks** verify signatures (PagerDuty v3 HMAC and equivalents) and reject replays.
- **Dependencies:** pin versions with a lockfile, keep Dependabot (or Renovate) on, and do not add a dependency without saying why in the pull request.
- **Audit:** log every card view and export with user, view and account id (90-day retention). No PII in the audit message body beyond what the policy allows.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

---

## 5. Definition of done

A change is done only when **all** of these are true:

- [ ] It does what the issue or prompt asked, and nothing unrelated.
- [ ] Tests cover it (unit, integration/contract, UI visual + a11y as applicable) and fail without the change.
- [ ] Coverage thresholds hold and CI is green. No skipped or deleted tests.
- [ ] Runtime code emits traces, metrics and structured logs with the required fields, and nothing sensitive.
- [ ] New services have `/healthz`, `/readyz`, SLOs and alerts; new failure modes have runbook entries.
- [ ] New behavior is behind a feature flag (default off) with an owner and removal date.
- [ ] Docs, README, prompts and mockups are updated where affected; ADR added if significant; CHANGELOG updated.
- [ ] Least-privilege and per-audience field rules hold; no secrets or real customer data anywhere.
- [ ] Accessibility rules in [docs/visual-rules.md](docs/visual-rules.md) hold for UI changes.

## 6. Pull requests

- Keep pull requests small and focused (aim for under 400 changed lines excluding fixtures and generated files).
- Fill in the [pull request template](.github/pull_request_template.md); it mirrors the definition of done.
- Include screenshots or a short recording for UI changes (light and dark, 360 px and desktop).
- Link the issue and any ADR. Describe how you tested, including commands run.
- At least one maintainer review is required. Agents never merge their own pull requests.

## 7. Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>(<scope>): <summary in imperative mood, ≤ 72 chars>

<body: what and why, wrapped at 72>

Refs: #123
```

- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`, `revert`.
- Scopes: `risk`, `web`, `api`, `ingest`, `salesforce`, `ops`, `schema`, `mockups`, `prompts`, `docs`, `ci`.
- Breaking changes: `!` after the type/scope and a `BREAKING CHANGE:` footer.
- One logical change per commit. Do not mix formatting churn with behavior changes.

## 8. Rules for AI agents specifically

- Read this file, [README.md](README.md) and the relevant files in `docs/` before editing. Follow existing patterns over inventing new ones.
- Stay in scope. Do not refactor unrelated code, reformat whole files, or upgrade dependencies unless asked.
- Never fabricate results. If you could not run a command or a test, say so in the pull request.
- Never weaken a gate (coverage threshold, lint rule, CI job, a11y check) to make a change pass.
- Never call real Salesforce orgs, incident tools or customer endpoints. Use mocks and fixtures.
- Prefer pure functions and dependency injection so behavior is testable without network or clock.
- When requirements are ambiguous, choose the safer, read-only, least-privilege option and note the question in the pull request.
