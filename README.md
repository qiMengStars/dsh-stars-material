# Material 3 theme for the DeepSeek Harness

A Material 3 / Material You theme for the DSH desktop web UI. One seed colour
produces a complete Material 3 role set, with light and dark generated together
so the two palettes always agree.

```
设置 → Material 3
```

## What it changes

- **Colour** — the 119 `--dsw-alias-*` / `--dsw-specific-*` tokens the product
  actually reads are recoloured from Material 3 roles
  (`surface`, `onSurface`, `primaryContainer`, `outlineVariant`, …).
- **Shape** — the six radius steps are aligned to the Material 3 shape scale.
- **Motion** — Material 3 standard / emphasized easing curves, with an
  automatic `prefers-reduced-motion` fallback.
- **Focus** — a 2dp Material focus ring instead of the default outline.

It never touches UI structure: no new DOM outside one `<style>` element, no
app-root replacement, no iframes, and no import of any Harness Client package.

## Settings

| Control | Effect |
| --- | --- |
| Use Material 3 colours | Turn the whole theme on or off. Off restores the previous look exactly. |
| Seed colour | Twelve seeds. `deepseek` (`#4176e6`) is the DSH brand blue; `purple` (`#6750a4`) is the Material baseline. |
| Scheme variant | Nine Material 3 harmonisation strategies — `TonalSpot` (baseline), `Expressive` (Material 3 Expressive), `Vibrant`, `Content`, `Fidelity`, `Neutral`, `Monochrome`, `Rainbow`, `FruitSalad`. |

Choices persist in `localStorage` under `dsh.material-3.*`. That is deliberate:
`theme.setTheme` only writes built-in preferences (`light` / `dark` / `system`)
back to settings, so a third-party theme id would not survive a restart on its
own.

## Repository layout

```
plugin/                     the installable bundle (client.js is generated)
src/parts/palette-spec.js   role order, seed colours, scheme variants
src/parts/token-map.js      DSH token -> Material 3 role mapping
src/client/main.js          the Client half source
src/generated/palettes.js   generated colour tables (12 seeds x 9 variants)
build/                      generator, bundler, five checks, pixel forensics
vendor/                     Material Color Utilities + the DSH token sheet
docs/                       architecture, decisions, roadmap, handoff, verification
```

## Development

```sh
node build/verify.mjs
```

Regenerates the palettes, bundles the Client half, then runs every check:

| Check | Guards against |
| --- | --- |
| `validate-coverage.mjs` | A DSH release renaming or dropping a token the plugin overrides |
| `validate-manifest.mjs` | A malformed bundle, missing file, unlocalised title, bad icon, or a forbidden `require` |
| `self-check.mjs` | Runtime regressions — runs `client.js` in a `vm` sandbox with stubbed services, including the disabled path |

Palettes are pre-computed at build time, so the shipped bundle has **no runtime
dependencies** beyond React: no colour library, no Harness Client package.

To reinstall after a change:

```sh
node build/verify.mjs
# then: plugin_manager action=install_bundle target=<abs path>/plugin
```

## Verification status

Colour, install and registration are proven — including pixel forensics against
a live screenshot showing 49.6% of the screen matching exact Material 3 role
values while the stock DSH greys drop to 0.13%.

Dark-mode appearance and the interactive settings controls were **not** visually
verified, because this session could not drive the DSH window. See
[`docs/VERIFICATION.md`](docs/VERIFICATION.md) for the evidence and the exact
remaining steps.

## Licence

MIT for this plugin. Vendored Material Color Utilities is Apache-2.0; the
inherited Material 3 design guidance is under `docs/research/material-3/LICENSE`.
