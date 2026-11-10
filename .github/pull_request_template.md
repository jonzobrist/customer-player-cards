## Summary

<!-- What does this change do and why? Link the issue: Closes #123 -->

## Type

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] test
- [ ] refactor / perf
- [ ] build / ci / chore

## How I tested it

<!-- Commands run and results. Say so if you could not run something. -->

## Definition of done (see [AGENTS.md](../AGENTS.md#5-definition-of-done))

### Tested

- [ ] Unit tests added or updated, and they fail without this change
- [ ] Integration / contract tests against mocked Salesforce and ops APIs (if adapters, pipelines or APIs changed)
- [ ] UI: component, visual regression and axe-core accessibility checks; keyboard and reduced-motion verified (if UI changed)
- [ ] Coverage thresholds hold; no skipped, quarantined or deleted tests
- [ ] CI is green

### Operationally instrumented

- [ ] Traces, metrics and structured logs with the required fields (if runtime code changed)
- [ ] No PII, secrets or customer content in logs, traces, metrics or errors
- [ ] `/healthz` and `/readyz`, SLOs and alerts (if a new service)
- [ ] Runbook entry in `docs/runbooks/` for each new failure mode
- [ ] New behavior behind a feature flag (default off) with owner and removal date

### Documented

- [ ] `docs/` and `README.md` updated where behavior, fields, rules or commands changed
- [ ] Prompts in `prompts/` and mockup source updated if shared rules changed
- [ ] ADR added in `docs/adr/` for significant decisions (link: )
- [ ] `CHANGELOG.md` updated under Unreleased
- [ ] Inline TSDoc for new or changed public APIs

### Security

- [ ] Least-privilege Salesforce scopes unchanged, or change justified in an ADR
- [ ] Per-audience field filtering enforced server-side (eng view has no commercial fields)
- [ ] No secrets or real customer data committed; fictional data only

## Screenshots

<!-- UI changes: 360 px and desktop -->
