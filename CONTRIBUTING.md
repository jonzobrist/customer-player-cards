# Contributing

Thanks for helping shape Customer Player Cards.

**Start with [AGENTS.md](AGENTS.md).** It is the contributor guide for humans and AI agents alike, and it defines what "done" means here: every change is **tested**, **operationally instrumented**, and **documented**, with CI green.

## Ways to contribute

- **Ideas and feedback** on the concept, styles, audience views or risk model: open a [feature request](https://github.com/jonzobrist/customer-player-cards/issues/new/choose).
- **Bugs** in the docs, prompts or mockup: open a [bug report](https://github.com/jonzobrist/customer-player-cards/issues/new/choose).
- **New display styles:** add a mockup in `mockups/src/`, a prompt in `prompts/`, and a section in `docs/concept.md`, following the shared rules.
- **Prototypes built from the prompts:** welcome as links in an issue first; code lands only once the phase plan in [docs/build-plan.md](docs/build-plan.md) calls for it.

## Workflow

1. Open or pick an issue and say you are working on it.
2. Fork the repo and create a branch: `feat/<short-name>`, `fix/<short-name>` or `docs/<short-name>`.
3. Make the change following [AGENTS.md](AGENTS.md). Use fictional data only.
4. Run the checks locally (see [AGENTS.md § Commands](AGENTS.md#commands)).
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
6. Open a pull request and fill in the template. CI must be green before review.

## Ground rules

- Be kind; we follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Never commit real customer data, credentials or tokens. Report security issues privately per [SECURITY.md](SECURITY.md).
- By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
