# Vendored DSH token sheets

Extracted verbatim from the installed DeepSeek Harness `app.asar`. Regenerate
with:

```
node build/vendor-survey.mjs
```

| File | Bytes | Why it is here |
| --- | --- | --- |
| `design-platform.css` | 29861 | Sole colour authority: every --dsw-* colour token, light and dark. |
| `base.css` | 1933 | Radius scale and font families the shape mapping must agree with. |
| `focus.css` | 1018 | Proves --dsw-focus-ring-width is already 2px, i.e. already M3. |
| `gradient-shadow-text.css` | 15273 | Declares --dsw-shadow-lv* and --dsw-elevation-*, which no other sheet defines. |

`build/validate-coverage.mjs` reads all four. `design-platform.css` supplies
the set of colour tokens the product is guaranteed to read (so nothing may be
missing); the union of all four supplies the set of names that exist at all (so
nothing may be invented).

## When DSH ships a new frontend build

1. `node build/vendor-survey.mjs`
2. `node build/validate-coverage.mjs` — exits non-zero if a token was renamed,
   added or removed.
3. Update `src/parts/token-map.js` for whatever the check reports.
4. `node build/verify.mjs`, then reinstall the bundle.

The compiled frontend bundle (`dist/assets/index-*.css`, ~92 KB) is deliberately
not vendored: it is a build artifact, and every token it consumes is declared in
one of the four sheets above.
