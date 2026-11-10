# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** Jon Zobrist

## Context

This project will be built by a mix of humans and AI coding agents across several phases. Decisions about the risk model, data sources, audience field rules, stack and integration patterns need to survive turnover of people and agent sessions, and reviewers need to know why something is the way it is.

## Decision

We record architecturally significant decisions as Architecture Decision Records (ADRs) in `docs/adr/`, using the lightweight format described by Michael Nygard.

- One decision per file, named `NNNN-short-title.md` with a zero-padded, never-reused number.
- Each ADR has: Status (Proposed, Accepted, Deprecated, Superseded by NNNN), Date, Deciders, Context, Decision, Consequences, and optionally Alternatives considered.
- ADRs are immutable once Accepted. To change a decision, write a new ADR that supersedes the old one and update the old one's status line only.
- A pull request that makes a significant decision includes its ADR. Significant includes: changing risk weights, bands or overrides; adding or removing a data source; changing what an audience can see; adding a service, datastore or dependency with operational cost; changing auth, permissions or data retention.

## Consequences

- Reviewers and agents can read `docs/adr/` to learn the reasoning behind the current design.
- Writing an ADR adds a small amount of work to significant pull requests.
- [AGENTS.md](../../AGENTS.md) and the pull request template require an ADR link when one applies.
