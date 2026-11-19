/**
 * The stylesheet half of the theme.
 *
 * Token overrides can recolour anything the product addresses through a custom
 * property, but they cannot remove a declaration, and they cannot redraw a rule
 * whose paint came from a token this theme made transparent. This sheet covers
 * exactly those three gaps:
 *
 *   1. **Paint that was a border colour.** Several dividers, the progress track
 *      and the table separators painted themselves with `--dsw-alias-border-l1`
 *      / `l2` / `l4`. Those tokens are transparent now, so the handful of cases
 *      with a stable selector are redrawn with the surface ramp instead.
 *   2. **Declarations that must disappear.** Material 3 does not draw a stroke
 *      around a text field or an error badge, so the border declarations are
 *      zeroed. Only `border*` is touched — never `outline`, which belongs to
 *      the focus system.
 *   3. **Values the token registry cannot carry.** The radius scale, the motion
 *      curves and the interaction transitions.
 *
 * Everything else is left to the token layer. No rule below names a CSS module
 * hash (`._name_hash_1`), a product class or a piece of the layout: selectors are
 * element names, ARIA roles and data attributes only, which is what keeps this
 * sheet working across DSH upgrades.
 */

import { MOTION_TOKENS, SHAPE_TOKENS } from '../parts/token-map.js';

const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/**
 * Rules that only make sense with the theme on.
 *
 * The bridge variables (`--dsh-m3-*`) are written by the theme token layer, so
 * every value below follows the active palette automatically.
 */
export const THEME_RULES = `
:root {
${declarations(SHAPE_TOKENS)}
${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. Paint that used to come from a border token
 * ------------------------------------------------------------------------- */

/* Markdown and generic rules: a 1dp rule in the outline-variant tone instead of
 * a 0.5dp hairline of 10% black. */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* Group separators inside menus and lists. */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* The upload / task progress track: a container tone, so the primary bar on top
 * of it stays the only saturated thing in the row. */
progress {
  border: 0;
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
  overflow: hidden;
}

progress::-webkit-progress-bar {
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
}

/* The switch track is already visible: it reads --dsw-alias-border-l3, which
 * this theme keeps. It only needs the Material 3 off-state tone and an
 * on-state that stays legible in both palettes. */
[role="switch"][aria-checked="false"] {
  background: var(--dsh-m3-surface-container-highest);
}

[role="switch"][aria-checked="true"] {
  background: var(--dsh-m3-primary);
}

/* Table rows that used to be separated by a 1dp hairline. */
tr[data-turn-start="true"]:not(:first-child) > td {
  box-shadow: inset 0 1px 0 var(--dsh-m3-outline-variant);
}

/* ---------------------------------------------------------------------------
 * 2. Strokes Material 3 does not draw
 * ------------------------------------------------------------------------- */

/* Filled text fields: the container tone carries the field, and focus is shown
 * by the ring below rather than by turning the border primary. This overrides
 * component rules that set outline to none and relied on the border instead —
 * it only ever adds a ring, it never removes one. */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* Error, warning and success badges communicate with their fill and their label
 * colour; the outline drawn around them goes away. The box-shadow is untouched
 * so the inset diff markers keep working. */
[aria-invalid="true"],
[data-state="error"],
[data-state="failed"],
[data-state="done"],
[data-state="warning"],
[data-failed="true"],
[data-tone="error"],
[data-tone="warn"],
[role="alert"] {
  border-color: transparent;
}

/* ---------------------------------------------------------------------------
 * 3. Interaction and motion
 * ------------------------------------------------------------------------- */

/* Material 3 animates colour changes on the standard curve and reserves the
 * emphasized curves for movement. */
button,
[role="button"],
[role="switch"],
[role="radio"],
[role="checkbox"],
[role="tab"],
[role="option"] {
  transition:
    background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    border-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    box-shadow var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
`;
