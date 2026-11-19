# Vendored DSH token sheet

These two files are extracted verbatim from the shipped DeepSeek Harness
`app.asar` (Electron ASAR, version whatever is installed in
`<dsh-install>\resources\app.asar` at extraction time).

| File | Origin | Why it is here |
| --- | --- | --- |
| `design-platform.css` | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/` | The sole colour authority: holds all 201 `--dsw-*` token declarations in six CSS blocks (`body` / `body[data-ds-dark-theme]` x3). `build/validate-coverage.mjs` reads it to prove the plugin covers exactly the tokens the product uses. |
| `base.css` | Inlined in `@deepseek-ai/dsh-client-ui-theme/lib/client.js` (`STYLES` array) | Owns the radius scale (`--dsw-radius-xs..panel`) and font families, i.e. the values the plugin's shape mapping must agree with. |

## Extraction recipe

The ASAR pickled header puts `headerSize` at byte offset 12 and the JSON
directory at offset 16; the payload starts at `16 + ceil(headerSize / 4) * 4`.
`docs/research/dsh-theme-architecture.md` documents a reader that resolves this
correctly. Once the directory is parsed, pull the two CSS files out of their
asset paths.

## When to refresh

When DSH ships a new frontend build:

1. Re-extract both files over these copies.
2. `node build/validate-coverage.mjs` — it exits non-zero if a token was
   renamed, added or removed.
3. Update `src/parts/token-map.js` for whatever the check reports.
4. `node build/verify.mjs`, then reinstall the bundle.

If the version you extract from differs, record it here:

- Extracted from: the Harness build installed on this machine at the time of
  writing (see `git log --follow` on this file for the date).
