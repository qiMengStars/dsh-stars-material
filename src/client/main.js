/**
 * Client half of the Material 3 theme bundle.
 *
 * What it does, in the order it runs:
 *
 *   1. Reads the stored preference (enabled / colour source / preset).
 *   2. Resolves the palette for the active colour source. Manual mode slices
 *      the build-time preset table; automatic mode asks the Host half for the
 *      operating system accent colour and the palette derived from it, so no
 *      colour library has to run in the browser.
 *   3. Derives one flat `Record<token, { light, dark }>` from that palette — a
 *      pure function: no DOM, no clock, no randomness.
 *   4. Installs the layers:
 *        a. `theme.overrideTokens(source, tokens)` — every themed token. Layers
 *           stack per token over whatever theme is active, so this keeps working
 *           on top of the built-in palettes and of third-party themes without
 *           fighting them for the preference.
 *        b. `theme.register()` for `stars-material-light` / `stars-material-dark` — so
 *           the theme is visible to `getTheme().themes` and selectable through
 *           `setTheme` like any other registered theme.
 *        c. `--dsh-m3-*` bridge properties on `:root`, so the stylesheet can
 *           name a role without repeating the palette.
 *   5. Adds one `<style>` element for the values the token registry cannot
 *      express: the shape scale, the motion curves, the paint that used to come
 *      from a border colour, and the strokes Material 3 does not draw.
 *   6. Contributes a settings page.
 *
 * The Client bundle must not `require` a Harness client package, so React is
 * the only runtime import and every control below is a plain element styled
 * with the `--dsw-alias-*` tokens the host already publishes.
 */

const NS = 'dsh-stars-material';
const SOURCE = 'dsh-stars-material';

const LIGHT_THEME_ID = 'stars-material-light';
const DARK_THEME_ID = 'stars-material-dark';

const STORAGE_PREFIX = 'dsh.stars-material.';
const STORAGE_ENABLED = STORAGE_PREFIX + 'enabled';
const STORAGE_SOURCE = STORAGE_PREFIX + 'source';
const STORAGE_PRESET = STORAGE_PREFIX + 'preset';
const STORAGE_CUSTOM_SEED = STORAGE_PREFIX + 'customSeed';

/**
 * Keys this plugin wrote before it was renamed to `dsh-stars-material`.
 *
 * They are only ever read, never written again: a profile that already had a
 * preference keeps it across the rename, and the first change copies the value
 * to the new key. Without this a rename silently resets everyone's settings.
 */
const LEGACY_PREFIX = 'dsh.material-3.';

/** `system` follows the OS accent; `preset` pins a built-in seed; `custom` uses the user's own hex seed. */
const SOURCE_SYSTEM = 'system';
const SOURCE_PRESET = 'preset';
const SOURCE_CUSTOM = 'custom';

/** Seed shown before the user picks one in custom mode. */
const DEFAULT_CUSTOM_SEED = '#6750a4';

const HEX_SEED = /^#[0-9a-f]{6}$/iu;

const SETTINGS_SECTION_ID = 'stars-material';
const SETTINGS_SECTION_ORDER = 26;

const STYLE_TAG_ID = NS + '/stars-material.css';

/** Host route that answers with the OS accent colour and its palette. */
const HOST_PALETTE_ROUTE = '/stars-material/palette';

/** A Host round trip that has not answered by now is not worth waiting for. */
const HOST_TIMEOUT_MS = 1500;

/** Retry schedule for the accent-colour question, in milliseconds. */
const HOST_RETRY_MS = [0, 2000, 6000, 15000];

const ROLE_INDEX = new Map(ROLES.map((role, index) => [role, index]));
const PRESET_INDEX = new Map(PRESETS.map((preset) => [preset.id, preset]));

/** `#rrggbb` for one role out of a packed palette string. */
function unpackRole(packed, role) {
  const index = ROLE_INDEX.get(role);
  if (index === undefined) {
    throw new Error('Material 3 theme: unknown role "' + role + '"');
  }
  const start = index * 6;
  return '#' + packed.slice(start, start + 6);
}

/** `#rrggbbaa` for one role out of a packed palette string. */
function unpackRoleAlpha(packed, role, alpha) {
  const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return unpackRole(packed, role) + byte.toString(16).padStart(2, '0');
}

function clampPreset(preset) {
  return PRESET_INDEX.has(preset) ? preset : DEFAULT_PRESET;
}

function clampSource(source) {
  if (source === SOURCE_SYSTEM) return SOURCE_SYSTEM;
  if (source === SOURCE_CUSTOM) return SOURCE_CUSTOM;
  return SOURCE_PRESET;
}

/** Accept `#rrggbb` in either case; everything else falls back to the baseline. */
function clampHexSeed(seed) {
  return typeof seed === 'string' && HEX_SEED.test(seed) ? seed.toLowerCase() : DEFAULT_CUSTOM_SEED;
}

/** The build-time palette for a preset id. */
function presetPalette(preset) {
  return PRESET_TABLE[clampPreset(preset)];
}

/**
 * Every value in the map is either a literal or a `color-mix()` over two
 * literals, so the browser resolves derived colours itself and the shipped
 * script still needs no colour library.
 */
function mixExpression(first, into, weight) {
  return 'color-mix(in srgb, ' + first + ' ' + weight + '%, ' + into + ')';
}

/**
 * Build the complete token map for one palette.
 *
 * Pure data: identical inputs always produce an identical map, which is what
 * lets `overrideTokens` be re-called on every preference change.
 *
 * `palette` is `{ light, dark }`, each a packed role string. Both the preset
 * table and the Host answer use that shape, so this function does not care
 * where the palette came from.
 */
function buildTokenMap(palette) {
  const light = palette.light;
  const dark = palette.dark;

  const tokens = {};

  const put = (name, lightValue, darkValue) => {
    tokens[name] = { light: lightValue, dark: darkValue };
  };

  const putRole = (name, role) => put(name, unpackRole(light, role), unpackRole(dark, role));

  for (const [name, role] of Object.entries(ROLE_TOKENS)) putRole(name, role);
  for (const [name, role] of Object.entries(ILLUSTRATION_TOKENS)) putRole(name, role);

  for (const [name, value] of Object.entries(LITERAL_TOKENS)) put(name, value, value);

  // Removed strokes and removed shadows are both "this must paint nothing".
  for (const name of CLEARED_TOKENS) put(name, 'transparent', 'transparent');

  for (const [name, spec] of Object.entries(STATE_LAYER_TOKENS)) {
    if (spec.weight === undefined) {
      putRole(name, spec.role);
      continue;
    }
    const composite = (scheme) => {
      const base = unpackRole(scheme, spec.role);
      return spec.into === null || spec.into === undefined
        ? mixExpression(base, 'transparent', spec.weight)
        : mixExpression(base, unpackRole(scheme, spec.into), spec.weight);
    };
    put(name, composite(light), composite(dark));
  }

  for (const [name, spec] of Object.entries(ALPHA_TOKENS)) {
    if (spec.literal !== undefined) {
      putRole(name, spec.literal);
      continue;
    }
    put(
      name,
      unpackRoleAlpha(light, spec.role, spec.alpha),
      unpackRoleAlpha(dark, spec.role, spec.alpha),
    );
  }

  for (const [name, spec] of Object.entries(MIX_TOKENS)) {
    put(
      name,
      mixExpression(unpackRole(light, spec.role), unpackRole(light, spec.into), spec.weight),
      mixExpression(unpackRole(dark, spec.role), unpackRole(dark, spec.into), spec.weight),
    );
  }

  for (const [name, spec] of Object.entries(DIFF_TOKENS)) {
    if (spec.toward === undefined) {
      putRole(name, spec.role);
      continue;
    }
    put(
      name,
      mixExpression(unpackRole(light, spec.role), unpackRole(light, spec.toward), spec.weight),
      mixExpression(unpackRole(dark, spec.role), unpackRole(dark, spec.toward), spec.weight),
    );
  }

  // The elevation composites paint a 0.5dp stroke plus two soft glows. Material
  // 3 expresses elevation with tone alone, so all five resolve to nothing.
  for (const name of ELEVATION_TOKENS) put(name, 'none', 'none');

  return tokens;
}

/**
 * The stylesheet-side bridge.
 *
 * The sheet cannot call `unpackRole`, so the resolved value of each bridged role
 * is published as a custom property. Both schemes are published through
 * `light-dark()`, which is the one CSS primitive that can carry a two-scheme
 * value through a single property.
 */
function buildBridgeTokens(palette) {
  const out = {};
  for (const { variable, role } of BRIDGE_ROLES) {
    out[variable] =
      'light-dark(' +
      unpackRole(palette.light, role) +
      ', ' +
      unpackRole(palette.dark, role) +
      ')';
  }
  return out;
}

/** The subset `theme.register()` carries: product tokens, current scheme only. */
function productTokens(tokens, colorScheme) {
  const out = {};
  for (const [name, modes] of Object.entries(tokens)) {
    if (name.startsWith('--dsw-')) out[name] = modes[colorScheme];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Preference storage
// ---------------------------------------------------------------------------

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/**
 * Read one preference, falling back to the pre-rename key.
 *
 * @param {string} key   current key
 * @param {string} legacy equivalent key under the old prefix
 * @param {string} fallback value used when neither key is set
 */
function readPreference(key, legacy, fallback) {
  const current = readStorage(key, null);
  if (current !== null) return current;
  return readStorage(legacy, fallback);
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A profile with storage disabled keeps the choice in memory only.
  }
}

function readPreferences() {
  return {
    enabled: readPreference(STORAGE_ENABLED, LEGACY_PREFIX + 'enabled', '1') !== '0',
    source: clampSource(
      readPreference(STORAGE_SOURCE, LEGACY_PREFIX + 'source', SOURCE_SYSTEM),
    ),
    preset: clampPreset(readPreference(STORAGE_PRESET, LEGACY_PREFIX + 'preset', DEFAULT_PRESET)),
    customSeed: clampHexSeed(readStorage(STORAGE_CUSTOM_SEED, DEFAULT_CUSTOM_SEED)),
  };
}

// ---------------------------------------------------------------------------
// Palette resolution
// ---------------------------------------------------------------------------

/**
 * Ask the Host half for a palette.
 *
 * With no `seed` this is the operating system accent; with one, it is the
 * custom colour the user picked. The Host owns the derivation because a colour
 * library does not belong in this browser bundle. A failed system read is
 * normal (no accent configured, a non-Windows build, a blocked child process);
 * a failed custom read just leaves the previous palette in place.
 */
async function fetchPalette(seed) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), HOST_TIMEOUT_MS);
  const url = seed === undefined ? HOST_PALETTE_ROUTE : HOST_PALETTE_ROUTE + '?seed=' + encodeURIComponent(seed);
  try {
    const response = await window.fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('status ' + response.status);
    const payload = await response.json();
    if (payload.ok !== true || typeof payload.light !== 'string' || typeof payload.dark !== 'string') {
      throw new Error(payload.reason ?? 'unsupported answer');
    }
    return { palette: { light: payload.light, dark: payload.dark }, seed: payload.seed };
  } finally {
    window.clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

const SETTINGS_STYLE = `
.${NS}-page { display: flex; flex-direction: column; }
.${NS}-title {
  color: var(--dsw-alias-label-primary);
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
  margin: 0 0 4px;
}
.${NS}-lede {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  margin: 0 0 8px;
}
.${NS}-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
}
.${NS}-row + .${NS}-row { padding-top: 0; }
.${NS}-row-head { display: flex; align-items: center; gap: 8px; }
.${NS}-row-title { color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 22px; }
.${NS}-row-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.${NS}-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.${NS}-chip {
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  display: inline-flex;
  border: 0;
  /* Material 3 chips are 8dp rounded rectangles, not capsules. */
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}
.${NS}-chip:hover { background: var(--dsw-alias-interactive-bg-hover-solid); }
.${NS}-chip[aria-checked="true"] {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}
.${NS}-chip[aria-checked="true"] .${NS}-chip-label { font-weight: 500; }
.${NS}-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex: none;
}
.${NS}-custom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.${NS}-color {
  box-sizing: border-box;
  width: 44px;
  height: 34px;
  padding: 2px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
}
.${NS}-hex {
  box-sizing: border-box;
  width: 104px;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  text-transform: lowercase;
}
.${NS}-apply {
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-label-primary-foreground);
}
.${NS}-apply[disabled] { opacity: 0.5; cursor: default; }
.${NS}-apply[disabled]:hover { background: var(--dsw-alias-brand-primary); }
.${NS}-custom-error {
  color: var(--dsh-m3-error, var(--dsw-alias-label-primary));
  font-size: 12px;
  line-height: 18px;
}
.${NS}-toggle { display: inline-flex; align-items: center; gap: 10px; }
.${NS}-switch {
  box-sizing: border-box;
  width: 40px;
  height: 24px;
  border-radius: 999px;
  border: 0;
  background: var(--dsw-alias-bg-layer-3);
  padding: 3px;
  cursor: pointer;
  display: inline-flex;
  transition: background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}
.${NS}-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.${NS}-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dsw-alias-label-primary-foreground);
  transition: transform var(--dsw-m3-duration-short) var(--dsw-m3-ease-emphasized);
}
.${NS}-switch[aria-checked="true"] .${NS}-knob { transform: translateX(16px); }
.${NS}-note {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  padding: 10px 12px;
  margin: 0;
}
`;

/**
 * Insert (or refresh) the package stylesheet.
 *
 * The loader hands every bundle a `styles` builtin for exactly this. When it is
 * missing (an older host), one `<style>` element in `<head>` is the documented
 * fallback — never `document.body`, and never a second tag.
 *
 * The settings page rules are always present; the theme rules (shape scale,
 * motion curves, de-bordering, bridge consumers) are only included while the
 * theme is enabled, so switching it off really does restore the previous look.
 */
function installStyles() {
  const selector = 'style[data-plugin-css=' + JSON.stringify(STYLE_TAG_ID) + ']';
  let tag = document.querySelector(selector);
  if (tag === null) {
    tag = document.createElement('style');
    tag.dataset.plugin = NS;
    tag.dataset.pluginCss = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }

  const node = tag;
  const dispose = () => node.remove();

  return {
    apply(enabled) {
      node.textContent = enabled ? SETTINGS_STYLE + THEME_RULES : SETTINGS_STYLE;
    },
    dispose,
  };
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

function Chip(props) {
  return h(
    'button',
    {
      type: 'button',
      className: NS + '-chip',
      role: 'radio',
      'aria-checked': props.selected ? 'true' : 'false',
      title: props.title,
      onClick: props.onSelect,
    },
    props.swatch === undefined ? null : h('span', { className: NS + '-swatch', style: { background: props.swatch } }),
    h('span', { className: NS + '-chip-label' }, props.label),
  );
}

function Material3SettingsPage(props) {
  const t = props.t;
  const state = props.state;
  const [draft, setDraft] = React.useState(state);
  const [hexDraft, setHexDraft] = React.useState(state.customSeed ?? DEFAULT_CUSTOM_SEED);

  React.useEffect(() => {
    setDraft(state);
    setHexDraft(state.customSeed ?? DEFAULT_CUSTOM_SEED);
  }, [state.enabled, state.source, state.preset, state.customSeed, state.revision]);

  const commit = (patch) => {
    const next = {
      enabled: draft.enabled,
      source: draft.source,
      preset: draft.preset,
      customSeed: draft.customSeed,
      ...patch,
    };
    setDraft(next);
    props.onChange(next);
  };

  /**
   * The picker and the hex field only edit a local draft. Deriving a palette is
   * a Host round trip, so it must not run once per colour while the picker is
   * being dragged — only when the user presses Apply.
   */
  const candidate = hexDraft.startsWith('#') ? hexDraft : '#' + hexDraft;
  const draftSeed = HEX_SEED.test(candidate) ? candidate.toLowerCase() : null;
  const pickerValue = draftSeed ?? draft.customSeed;
  const pending = draftSeed !== null && draftSeed !== draft.customSeed;

  const applyCustomSeed = () => {
    if (draftSeed === null) return;
    setHexDraft(draftSeed);
    commit({ customSeed: draftSeed });
  };

  const manual = draft.source === SOURCE_PRESET;
  const custom = draft.source === SOURCE_CUSTOM;

  return h(
    'div',
    { className: NS + '-page', 'data-dsh-stars-material-settings': '' },
    h('h2', { className: NS + '-title' }, t('page.title')),
    h('p', { className: NS + '-lede' }, t('page.description')),

    h(
      'div',
      { className: NS + '-row' },
      h('span', { className: NS + '-row-title' }, t('page.enabledTitle')),
      h('span', { className: NS + '-row-desc' }, t('page.enabledDescription')),
      h(
        'div',
        { className: NS + '-toggle' },
        h(
          'button',
          {
            type: 'button',
            className: NS + '-switch',
            role: 'switch',
            'aria-checked': draft.enabled ? 'true' : 'false',
            'aria-label': t('page.enabledTitle'),
            title: draft.enabled ? t('page.disable') : t('page.enable'),
            onClick: () => commit({ enabled: !draft.enabled }),
          },
          h('span', { className: NS + '-knob' }),
        ),
        h('span', { className: NS + '-row-desc' }, draft.enabled ? t('page.on') : t('page.off')),
      ),
    ),

    h(
      'div',
      { className: NS + '-row' },
      h('span', { className: NS + '-row-title' }, t('page.sourceTitle')),
      h(
        'span',
        { className: NS + '-row-desc' },
        custom
          ? t('page.sourceCustomDescription')
          : manual
            ? t('page.sourcePresetDescription')
            : describeSystem(state, t),
      ),
      h(
        'div',
        { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.sourceTitle') },
        h(Chip, {
          selected: draft.source === SOURCE_SYSTEM,
          swatch: state.systemSeed,
          label: t('page.sourceSystem'),
          title: state.systemSeed,
          onSelect: () => commit({ source: SOURCE_SYSTEM }),
        }),
        h(Chip, {
          selected: manual,
          label: t('page.sourcePreset'),
          onSelect: () => commit({ source: SOURCE_PRESET }),
        }),
        h(Chip, {
          selected: custom,
          swatch: draft.customSeed,
          label: t('page.sourceCustom'),
          title: draft.customSeed,
          onSelect: () => commit({ source: SOURCE_CUSTOM }),
        }),
      ),
      manual
        ? h(
            'div',
            { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.sourcePreset') },
            PRESETS.map((preset) =>
              h(Chip, {
                key: preset.id,
                selected: preset.id === draft.preset,
                swatch: preset.hex,
                label: t('preset.' + preset.id),
                title: preset.hex,
                onSelect: () => commit({ preset: preset.id }),
              }),
            ),
          )
        : null,
      custom
        ? h(
            'div',
            { className: NS + '-custom' },
            h(
              'input',
              {
                type: 'color',
                className: NS + '-color',
                value: pickerValue,
                'aria-label': t('page.customPickerLabel'),
                title: t('page.customPickerLabel'),
                onChange: (event) => setHexDraft(event.target.value),
              },
            ),
            h('input', {
              type: 'text',
              className: NS + '-hex',
              value: hexDraft,
              maxLength: 7,
              spellCheck: false,
              'aria-label': t('page.customHexLabel'),
              title: t('page.customHexLabel'),
              onChange: (event) => setHexDraft(event.target.value),
            }),
            h(
              'button',
              {
                type: 'button',
                className: NS + '-chip ' + NS + '-apply',
                disabled: !pending,
                onClick: applyCustomSeed,
              },
              t('page.customApply'),
            ),
            h(
              'span',
              { className: NS + '-row-desc' },
              pending ? t('page.customPending') + ' ' + draftSeed : draft.customSeed,
            ),
          )
        : null,
      custom && state.customError
        ? h(
            'p',
            { className: NS + '-custom-error' },
            t(state.customStale ? 'page.customStaleHost' : 'page.customUnavailable'),
          )
        : null,
    ),

    h('p', { className: NS + '-note' }, t('page.note')),
  );
}

/**
 * The line under the colour-source title.
 *
 * Automatic mode has three states worth telling apart: the OS colour was read,
 * the OS colour was read but the palette could not be derived, or the OS colour
 * was not available at all. Saying which one is active avoids the "why is my
 * theme purple" question.
 */
function describeSystem(state, t) {
  if (state.systemSeed === null || state.systemSeed === undefined) return t('page.systemUnavailable');
  return t('page.systemDescription') + ' ' + state.systemSeed;
}

// ---------------------------------------------------------------------------
// Theme layers
// ---------------------------------------------------------------------------

/**
 * Install every theme layer for one resolved palette.
 *
 * Returns a disposer that removes exactly what this call added. `register()`
 * rejects a duplicate id, so a retune must always dispose before re-registering
 * — which is why this is the only place that touches the registry.
 */
function createThemeLayers(theme, enabled, palette) {
  if (!enabled) {
    return { dispose() {} };
  }

  const tokens = buildTokenMap(palette);
  const bridge = buildBridgeTokens(palette);
  const disposers = [];

  if (typeof theme.overrideTokens === 'function') {
    disposers.push(theme.overrideTokens(SOURCE, tokens));
  }

  // Bridge properties go through the same override machinery, so they are
  // removed and restacked exactly like the token layer.
  if (typeof theme.overrideTokens === 'function') {
    const pairs = {};
    for (const [name, value] of Object.entries(bridge)) {
      pairs[name] = { light: value, dark: value };
    }
    disposers.push(theme.overrideTokens(SOURCE + '/bridge', pairs));
  }

  if (typeof theme.register === 'function') {
    const schemes = [
      [LIGHT_THEME_ID, 'light'],
      [DARK_THEME_ID, 'dark'],
    ];
    for (const [id, colorScheme] of schemes) {
      try {
        disposers.push(
          theme.register({ id, colorScheme, tokens: productTokens(tokens, colorScheme) }),
        );
      } catch (error) {
        // A stale registration from an earlier generation is not fatal: the
        // override layer is what colours the UI.
        console.error('Material 3 theme: could not register ' + id, error);
      }
    }
  }

  return {
    dispose() {
      while (disposers.length > 0) {
        const dispose = disposers.pop();
        try {
          dispose();
        } catch (error) {
          console.error('Material 3 theme: layer cleanup failed', error);
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

function applyClient(ctx) {
  const theme = ctx.get('theme');
  if (theme === undefined) {
    console.error('Material 3 theme: the "theme" service is unavailable');
    return;
  }

  const locale = ctx.get('locale');
  const slots = ctx.get('slots');

  let translate = (key) => key;
  if (locale !== undefined && typeof locale.register === 'function') {
    ctx.effect(() => locale.register(NS, DICTS), NS + ' locale');
    translate = locale.bind(NS);
  } else if (locale !== undefined && typeof locale.bind === 'function') {
    translate = locale.bind(NS);
  }
  const t = translate;

  const preference = readPreferences();
  const published = {
    enabled: preference.enabled,
    source: preference.source,
    preset: preference.preset,
    customSeed: preference.customSeed,
    customError: false,
    customStale: false,
    systemSeed: null,
    revision: 0,
  };

  /** Palette in use right now. Preset mode knows it up front; system mode starts
   *  from the baseline so the UI is themed on the first frame and upgrades when
   *  the Host answers. */
  let resolved = preference.source === SOURCE_PRESET
    ? presetPalette(preference.preset)
    : presetPalette(DEFAULT_PRESET);

  let styles = installStyles();
  ctx.effect(() => {
    return () => styles.dispose();
  }, NS + ' stylesheet');
  styles.apply(preference.enabled);

  /** Layers in place right now; replaced wholesale on every retune. */
  let layers = { dispose() {} };

  ctx.effect(() => {
    return () => {
      layers.dispose();
      layers = { dispose() {} };
    };
  }, NS + ' theme layers');

  const publish = () => {
    published.enabled = preference.enabled;
    published.source = preference.source;
    published.preset = preference.preset;
    published.customSeed = preference.customSeed;
    published.revision += 1;
  };

  /** Re-install every layer for the current preference. */
  const install = () => {
    layers.dispose();
    layers = createThemeLayers(theme, preference.enabled && resolved !== null, resolved);
    styles.apply(preference.enabled);
    publish();
  };

  /** Handle of the pending accent-colour retry, so a retune can cancel it. */
  let retryTimer = null;

  /**
   * Monotonic id for the current resolution. Every async answer checks it:
   * dragging the colour picker fires many requests, and an older answer must
   * never overwrite a newer one.
   */
  let resolutionId = 0;

  const cancelRetry = () => {
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  /**
   * Ask the Host for the accent palette, retrying a few times.
   *
   * The Host route is registered while the Host half loads, and a page can be
   * ready before that happens — a slow first boot, or a reload that runs the
   * new Client against the previous Host generation. One failed attempt must not
   * pin the theme to the baseline palette for the rest of the session, so the
   * question is repeated on a short backoff before the fallback is accepted as
   * final.
   */
  const resolveSystem = async (attempt, id) => {
    retryTimer = null;
    try {
      const answer = await fetchPalette(undefined);
      if (id !== resolutionId) return;
      resolved = answer.palette;
      published.systemSeed = answer.seed;
      install();
      return;
    } catch (error) {
      if (id !== resolutionId) return;
      const next = attempt + 1;
      if (next < HOST_RETRY_MS.length) {
        retryTimer = window.setTimeout(() => {
          if (id === resolutionId) void resolveSystem(next, id);
        }, HOST_RETRY_MS[next]);
        return;
      }
      // Falling back keeps the theme usable: the Material baseline palette is
      // still a correct Material 3 palette, just not the user's own colour.
      console.warn('Material 3 theme: system accent colour unavailable, using baseline', error);
      resolved = presetPalette(DEFAULT_PRESET);
      published.systemSeed = null;
      install();
    }
  };

  /**
   * Derive the palette for the user's own seed. There is no retry backoff here:
   * a colour change is one explicit request, and the previous palette stays on
   * screen if the Host cannot answer.
   */
  const resolveCustom = async (id) => {
    try {
      const answer = await fetchPalette(preference.customSeed);
      if (id !== resolutionId) return;
      // An old Host still owns the route from before the custom seed was
      // added. It answers the system palette and echoes a different seed;
      // accepting that would look exactly like "the colour did nothing".
      const answered = typeof answer.seed === 'string' ? answer.seed.toLowerCase() : null;
      if (answered !== preference.customSeed) {
        console.warn('Material 3 theme: Host answered seed ' + answered + ', expected ' + preference.customSeed);
        published.customError = true;
        published.customStale = true;
        install();
        return;
      }
      resolved = answer.palette;
      published.customError = false;
      published.customStale = false;
      install();
    } catch (error) {
      if (id !== resolutionId) return;
      console.warn('Material 3 theme: custom colour could not be derived', error);
      published.customError = true;
      published.customStale = false;
      // `resolved` is still the last good palette (the Material baseline on a
      // cold start), so re-install it instead of leaving the UI unthemed.
      install();
    }
  };

  /** Resolve the palette for `preference.source`, then install it. */
  const resolve = async () => {
    const id = ++resolutionId;
    cancelRetry();
    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      published.customError = false;
      published.customStale = false;
      install();
      return;
    }
    if (preference.source === SOURCE_CUSTOM) {
      await resolveCustom(id);
      return;
    }
    await resolveSystem(0, id);
  };

  const retune = (next) => {
    preference.enabled = next.enabled;
    preference.source = clampSource(next.source);
    preference.preset = clampPreset(next.preset);
    preference.customSeed = clampHexSeed(next.customSeed);

    writeStorage(STORAGE_ENABLED, preference.enabled ? '1' : '0');
    writeStorage(STORAGE_SOURCE, preference.source);
    writeStorage(STORAGE_PRESET, preference.preset);
    writeStorage(STORAGE_CUSTOM_SEED, preference.customSeed);

    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      install();
      return;
    }

    // Automatic mode needs a Host round trip; the layers stay as they are until
    // it answers so the UI never flashes an unstyled frame.
    published.source = preference.source;
    published.preset = preference.preset;
    published.enabled = preference.enabled;
    void resolve();
  };

  if (slots !== undefined && typeof slots.inject === 'function') {
    slots.inject('settings.section', () =>
      ctx.slots.register(
        {
          name: 'settings.section',
          id: SETTINGS_SECTION_ID,
          order: SETTINGS_SECTION_ORDER,
          label: () => t('nav.title'),
          locale: NS,
          inject: () => ({
            t,
            state: published,
            onChange: retune,
          }),
        },
        Material3SettingsPage,
      ),
    );
  }

  ctx.effect(() => {
    const onStorage = (event) => {
      if (event.key !== null && !event.key.startsWith(STORAGE_PREFIX)) return;
      const stored = readPreferences();
      preference.enabled = stored.enabled;
      preference.source = stored.source;
      preference.preset = stored.preset;
      preference.customSeed = stored.customSeed;
      void resolve();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, NS + ' storage');

  ctx.effect(() => () => cancelRetry(), NS + ' palette retry');

  // Automatic mode is the default, so the first resolution runs on load.
  void resolve();
}
const DICTS = {
  en: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 theme',
    'page.description':
      'Material You colour roles, surface tones instead of borders, and state layers instead of shadows. Light and dark are generated together, so the two palettes always agree.',
    'page.enabledTitle': 'Use Material 3 colours',
    'page.enabledDescription':
      'Recolours surfaces, labels, borders and state colours with Material 3 roles. Turn it off to return to the theme you had before.',
    'page.on': 'On',
    'page.off': 'Off',
    'page.enable': 'Enable Material 3',
    'page.disable': 'Disable Material 3',
    'page.sourceTitle': 'Colour source',
    'page.sourceSystem': 'Follow system',
    'page.sourcePreset': 'Use a preset',
    'page.sourceCustom': 'Custom colour',
    'page.systemDescription': 'Derived from your Windows accent colour.',
    'page.systemUnavailable': 'No accent colour is set on this system, so the Material baseline palette is used.',
    'page.sourcePresetDescription': 'One of the eight Material 3 seed colours.',
    'page.sourceCustomDescription': 'Pick any colour; light and dark palettes are generated from it.',
    'page.customPickerLabel': 'Pick a custom seed colour',
    'page.customHexLabel': 'Seed colour in #rrggbb format',
    'page.customApply': 'Apply',
    'page.customPending': 'Click Apply to use',
    'page.customUnavailable': 'The custom palette could not be generated. The previous palette is still in use.',
    'page.customStaleHost': 'The running Host is an older version and ignored the seed. Restart dsh, then pick the colour again.',
    'page.note':
      'Changes apply immediately and are remembered in this browser, so they survive a reload without restarting the harness.',
    'preset.baseline': 'Baseline',
    'preset.blue': 'Blue',
    'preset.green': 'Green',
    'preset.teal': 'Teal',
    'preset.orange': 'Orange',
    'preset.pink': 'Pink',
    'preset.red': 'Red',
    'preset.blueGrey': 'Blue grey',
  },
  zh: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 主题',
    'page.description':
      '采用 Material You 颜色角色：用色块而不是边框表达层级，用状态层而不是阴影表达交互。明暗两套同时生成，因此始终彼此协调。',
    'page.enabledTitle': '启用 Material 3 配色',
    'page.enabledDescription':
      '用 Material 3 角色重新着色表面、文字、分隔与状态色。关闭后回到你原先使用的主题。',
    'page.on': '已启用',
    'page.off': '已关闭',
    'page.enable': '启用 Material 3',
    'page.disable': '关闭 Material 3',
    'page.sourceTitle': '取色来源',
    'page.sourceSystem': '跟随系统',
    'page.sourcePreset': '预设颜色',
    'page.sourceCustom': '自选颜色',
    'page.systemDescription': '由 Windows 强调色推导。',
    'page.systemUnavailable': '此系统未设置强调色，因此使用 Material 基准配色。',
    'page.sourcePresetDescription': '从 8 个 Material 3 官方种子色中选择。',
    'page.sourceCustomDescription': '任意挑选一种颜色，自动生成配套的浅色与深色配色。',
    'page.customPickerLabel': '选择自定义种子色',
    'page.customHexLabel': '种子色（#rrggbb 格式）',
    'page.customApply': '确定',
    'page.customPending': '点击确定后生效：',
    'page.customUnavailable': '自定义配色生成失败，当前仍使用上一次的配色。',
    'page.customStaleHost': '当前 Host 是旧版本，没有读取自选种子色。请重启 dsh 后重新选择颜色。',
    'page.note': '修改立即生效，并记忆在本浏览器中，刷新页面即可恢复，无需重启应用。',
    'preset.baseline': '基准紫',
    'preset.blue': '蓝色',
    'preset.green': '绿色',
    'preset.teal': '青色',
    'preset.orange': '橙色',
    'preset.pink': '粉色',
    'preset.red': '红色',
    'preset.blueGrey': '蓝灰',
  },
};
