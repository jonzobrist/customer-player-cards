# Security policy

## Supported versions

This project is currently a concept and specification repository. Security fixes apply to the `main` branch.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's [private vulnerability reporting](https://github.com/jonzobrist/customer-player-cards/security/advisories/new) for this repository, or by email to <jon@jonzobrist.com>. Include:

- what you found and where (file, path, or prompt),
- how to reproduce it,
- the impact you expect.

You can expect an acknowledgement within 3 business days and a status update within 10 business days. Please give us a reasonable window to fix the issue before disclosing it.

## What counts

- Secrets, tokens or real customer data committed anywhere in the repo or its history.
- Guidance in the docs or build prompts that would lead implementers to insecure designs (for example over-broad Salesforce permissions, client-side-only field filtering, unsigned webhooks, or PII in logs).
- Vulnerabilities in code, once code exists.

## Design commitments

The security rules every contribution must follow are in [AGENTS.md § Security](AGENTS.md#4-security): least-privilege Salesforce scopes, server-side field-level security per audience, secrets in a secrets manager, signed webhooks, and no PII or secrets in telemetry.
