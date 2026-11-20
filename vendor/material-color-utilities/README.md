# Vendored Material Color Utilities

This is `@material/material-color-utilities@0.4.0` (Apache-2.0, see `LICENSE`),
copied here so that the palette pipeline in `build/generate-palettes.mjs` runs
with nothing installed and no network access.

## Why a patched copy

The published package is ESM, but its relative imports omit the `.js`
extension (`import { ... } from './dynamiccolor/dynamic_color'`). Node's ESM
resolver rejects that with `ERR_MODULE_NOT_FOUND`, so every relative specifier
has been rewritten to carry an explicit `.js`. That rewrite is the **only**
change; no algorithmic edits were made.

## Refreshing

`build/vendor-mcu.mjs` reproduces this directory from a freshly installed
package. Install it wherever writable — a scratch directory outside the repo is
fine — and pass its path:

```sh
cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
node build/verify.mjs
```

The script rewrites every `.js` file through the extension patch and copies
`LICENSE` and `package.json` across; it prints `vendored N files, patched M`.
With no argument it falls back to `.tmp/mcu/node_modules/@material/material-color-utilities`.

## What consumes it

Only the build. `build/generate-palettes.mjs` imports
`vendor/material-color-utilities/index.js` to turn each seed colour into an M3
`DynamicScheme` and flatten the result into
[`src/generated/palettes.js`](../../src/generated/palettes.js). The shipped
plugin never loads any of this — it only slices pre-computed hex strings.

## License

Material Color Utilities is licensed under the Apache License 2.0. The original
license text is preserved verbatim in [`LICENSE`](LICENSE). This repository's
own code is MIT (see the root [`LICENSE`](../../LICENSE)).
