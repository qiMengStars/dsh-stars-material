# Vendored Material Color Utilities

`vendor/material-color-utilities` is a copy of
[`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities)
**v0.4.0**, Apache-2.0. `LICENSE` is copied verbatim beside the sources.

## Why a copy

The published package is ESM whose relative imports omit the `.js`
extension (`import { Cam16 } from './hct/cam16'`). Node refuses to resolve
those specifiers, so a fresh install cannot be imported directly.

Committed under `vendor/` for two reasons:

1. `build/generate-palettes.mjs` needs it, and the repository must be able to
   regenerate palettes without network access or a `node_modules` tree.
2. The packaged copy under `.tmp/` is throwaway scratch; the build pipeline
   must survive its deletion.

## How it was produced

```sh
cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache .tmp/npm-cache --prefix .tmp/mcu"
node build/vendor-mcu.mjs
```

`build/vendor-mcu.mjs` copies the JavaScript tree and appends `.js` to every
relative import/export specifier that lacks a file extension. 45 files are
copied, 10 are patched. No other transformation is applied — the colour
maths is untouched Apache-2.0 code.

## How it is used

Only at build time:

```sh
node build/generate-palettes.mjs   # writes src/generated/palettes.js
```

`src/generated/palettes.js` is committed, so the shipped Client bundle never
loads this library. The runtime unpacks pre-computed hex values instead.

## Updating

```sh
cmd /c "npm install @material/material-color-utilities@<version> --no-audit --no-fund --ignore-scripts --cache .tmp/npm-cache --prefix .tmp/mcu"
node build/vendor-mcu.mjs
node build/generate-palettes.mjs
node build/verify.mjs
```

Re-run `build/verify.mjs` because a palette change can move token values that
`build/self-check.mjs` asserts on (for example how many tokens differ between
light and dark).
