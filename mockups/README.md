# Mockups

`index.html` is a **generated, self-contained** static mockup of all five player-card styles and the six audience views. Open it in any browser; it has the React bundle inlined and needs no network. **All data is fictional.**

## Source

| File | What it is |
| --- | --- |
| `src/components.tsx` | Card components and the fictional sample data, ported from the original concept page |
| `src/prompts.ts` | Build-prompt text and audience specs (the source of the files in [`../prompts/`](../prompts/)) |
| `src/shim.tsx` | Dark theme tokens standing in for the original design system |
| `src/main.tsx` | The mockup page: style sections, customer picker, audience switch |
| `template.html` | HTML shell the bundle is inlined into |

## Rebuild

```sh
npm ci
npm run typecheck
npm run build        # writes index.html
npm run screenshot   # refreshes ../docs/img/*.png (needs Chrome or Chromium; set CHROME_BIN)
```

Do not hand-edit `index.html`; change `src/` and rebuild. If you change a shared rule (risk weights, bands, audience fields), update `src/prompts.ts`, the files in `../prompts/` and the docs in the same pull request (see [AGENTS.md](../AGENTS.md)).
