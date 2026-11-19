# dsh-stars-material — a Material 3 theme for the DeepSeek Harness

A Material You (Material 3) UI theme for the DeepSeek Harness. It is not a colour
swap: the theme repaints the harness with Material 3 roles, replaces borders with
a surface tone ramp, and replaces shadows with state layers.

Open **Settings → Material 3** to switch it on and pick a colour source.

## What it changes

- **Colour** — 164 `--dsw-*` product tokens are overridden with `{ light, dark }`
  pairs derived from 45 Material 3 roles. Light and dark are generated together
  from one seed, so the two schemes always agree.
- **Hierarchy** — borders are gone. Eleven stroke tokens resolve to `transparent`,
  and the hierarchy they used to express is carried by the six-step surface ramp
  (`surface` → `surfaceContainerLow` → … → `surfaceContainerHighest`).
- **Interaction** — shadows are gone too: the seven elevation tokens resolve to
  `none`. Hover and pressed states are `on-surface` state layers
  (`color-mix(in srgb, <onSurface> 8%, transparent)` for hover, 12 % for pressed),
  and selected rows are a separate container tone.
- **Shape and motion** — one injected `<style>` sets the six-step radius scale
  (4/8/12/16/20/28 px) and the motion curves the token registry cannot carry.
- **Dynamic colour** — in "follow system" mode the Host half reads the Windows
  accent colour (Electron API, falling back to the registry) and derives all 45
  Material 3 roles with Material Color Utilities.

## Settings

| Control | Values |
| --- | --- |
| Enable switch | on / off — off restores the previous look exactly |
| Colour source | **Follow system** (Windows accent colour) / **Pick a colour** |
| Preset | eight Material 3 seed colours, shown when "Pick a colour" is selected |

The eight presets are `baseline` `#6750a4`, `blue` `#00639b`, `green` `#006e1c`,
`teal` `#006a6a`, `orange` `#8e4e00`, `pink` `#984061`, `red` `#b3261e`,
`blueGrey` `#525e7d`. All of them use `SchemeTonalSpot`.

Preferences live in `localStorage` under `dsh.stars-material.enabled` / `.source` /
`.preset`, so they survive a reload without restarting the harness. If the accent
colour cannot be read, the theme retries four times and then falls back to the
Material baseline palette rather than staying unthemed.

## Repository layout

```
plugin/                   what the profile installs
  package.json            manifest (dsh.client, dsh.bundle.patch, files)
  cordis.patch.yml        three-line patch that inserts the plugin
  index.js                Host half: accent colour reader + /stars-material/palette
  client.js               Client half: the five modules bundled into one file
  icon.svg, locale/*.json icon and flat message catalogues (26 keys each)
  lib/palette.js          palette engine, pre-concatenated for the Host
  lib/mcu/**              vendored Material Color Utilities 0.4.0
src/                      the actual sources
  parts/palette-spec.js   role order, eight presets, harmony, bridge roles
  parts/palette-engine.js seed → 45 roles, packing, WCAG contrast
  parts/token-map.js      the eleven token tables
  client/main.js          token map, theme layers, settings page, retry
  client/stylesheet.js    rules the token registry cannot express
  generated/palettes.js   build output: 8 schemes × 45 roles
build/                    seven pipeline steps (generate-palettes, bundle-host,
                          bundle-client, validate-coverage, validate-manifest,
                          self-check, host-check), the verify.mjs driver, and
                          helpers (vendor-mcu, vendor-survey, scan-css,
                          attribute-colours.py, verify-scrim.py, palette dumps)
vendor/                   upstream MCU source + product CSS from app.asar
docs/                     architecture, decisions, handoff, roadmap, evidence
```

## Development

```pwsh
node build/verify.mjs
```

Seven steps, in order, stopping at the first failure. `all checks passed` at the
end is the only acceptance signal.

| Step | What it proves |
| --- | --- |
| `generate palettes` | 8 presets × 45 roles, all contrast pairs above threshold |
| `bundle host` | MCU vendored (13 entries) and `lib/palette.js` written |
| `bundle client` | the 5 modules parse as one bundle |
| `token coverage` | 155 product tokens covered, 0 missing, 0 invented |
| `manifest` | 6 declared files resolve, en/zh aligned, no harness client requires |
| `behaviour` | six scenarios, 118 assertions |
| `host route` | exact route, origin bound, cache reuse, dispose |

`plugin/` is build output: never edit `plugin/client.js` or `plugin/lib/**` by
hand — the next `verify` run overwrites them.

## Verification status

Measured on the live light-mode window: **83.5 %** of pixels are exactly a
Material 3 role colour, **0.29 %** are leftover stock harness colours, and no
unattributed colour patch exceeds 1 %. Border-token pixels and soft-shadow pixels
are both zero. Evidence and the colour tables are in `docs/VERIFICATION.md`.

Not verified, because desktop input to the harness window is refused in this
environment: dark-mode appearance, live hover/pressed pixels, the settings page's
final look, and menus/dialogs/toasts after elevation goes to `none`. The known
deviations (switch size, native checkboxes, button radii, tab indicator, font
stack, two SVG ring tracks, hairline separators) are listed in `docs/HANDOFF.md`.

## Licence

MIT for this plugin. `plugin/lib/mcu/**` and `vendor/material-color-utilities/**`
are Apache-2.0 (Material Color Utilities). The research notes under
`docs/research/material-3/` carry their own upstream licence.
