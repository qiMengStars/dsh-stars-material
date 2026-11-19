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
 *        b. `theme.register()` for `material-3-light` / `material-3-dark` — so
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

const NS = 'dsh-material-3';
const SOURCE = 'dsh-material-3';

const LIGHT_THEME_ID = 'material-3-light';
const DARK_THEME_ID = 'material-3-dark';

const STORAGE_PREFIX = 'dsh.material-3.';
const STORAGE_ENABLED = STORAGE_PREFIX + 'enabled';
const STORAGE_SOURCE = STORAGE_PREFIX + 'source';
const STORAGE_PRESET = STORAGE_PREFIX + 'preset';

/** `system` follows the OS accent colour; `preset` pins one Material 3 seed. */
const SOURCE_SYSTEM = 'system';
const SOURCE_PRESET = 'preset';

const SETTINGS_SECTION_ID = 'material-3';
const SETTINGS_SECTION_ORDER = 26;

const STYLE_TAG_ID = NS + '/material-3.css';

/** Host route that answers with the OS accent colour and its palette. */
const HOST_PALETTE_ROUTE = '/material-3/palette';

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
  return source === SOURCE_SYSTEM ? SOURCE_SYSTEM : SOURCE_PRESET;
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

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A profile with storage disabled keeps the choice in memory only.
  }
}

function readPreferences() {
  return {
    enabled: readStorage(STORAGE_ENABLED, '1') !== '0',
    source: clampSource(readStorage(STORAGE_SOURCE, SOURCE_SYSTEM)),
    preset: clampPreset(readStorage(STORAGE_PRESET, DEFAULT_PRESET)),
  };
}

// ---------------------------------------------------------------------------
// Palette resolution
// ---------------------------------------------------------------------------

/**
 * Ask the Host half for the operating system accent colour.
 *
 * The Host owns this because reading a registry value needs a child process and
 * a colour library, neither of which belongs in a browser bundle. A failure is
 * normal (no accent colour configured, a non-Windows build, a blocked child
 * process) and only downgrades the theme to the preset palette.
 */
async function fetchSystemPalette() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), HOST_TIMEOUT_MS);
  try {
    const response = await window.fetch(HOST_PALETTE_ROUTE, { signal: controller.signal });
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

  React.useEffect(() => {
    setDraft(state);
  }, [state.enabled, state.source, state.preset, state.revision]);

  const commit = (patch) => {
    const next = { enabled: draft.enabled, source: draft.source, preset: draft.preset, ...patch };
    setDraft(next);
    props.onChange(next);
  };

  const manual = draft.source === SOURCE_PRESET;

  return h(
    'div',
    { className: NS + '-page', 'data-dsh-material-3-settings': '' },
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
        manual ? t('page.sourcePresetDescription') : describeSystem(state, t),
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
  const resolveSystem = async (attempt) => {
    retryTimer = null;
    try {
      const answer = await fetchSystemPalette();
      resolved = answer.palette;
      published.systemSeed = answer.seed;
      install();
      return;
    } catch (error) {
      const next = attempt + 1;
      if (next < HOST_RETRY_MS.length) {
        retryTimer = window.setTimeout(() => {
          void resolveSystem(next);
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

  /** Resolve the palette for `preference.source`, then install it. */
  const resolve = async () => {
    cancelRetry();
    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      install();
      return;
    }
    await resolveSystem(0);
  };

  const retune = (next) => {
    preference.enabled = next.enabled;
    preference.source = clampSource(next.source);
    preference.preset = clampPreset(next.preset);

    writeStorage(STORAGE_ENABLED, preference.enabled ? '1' : '0');
    writeStorage(STORAGE_SOURCE, preference.source);
    writeStorage(STORAGE_PRESET, preference.preset);

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
    'page.sourcePreset': 'Pick a colour',
    'page.systemDescription': 'Derived from your Windows accent colour.',
    'page.systemUnavailable': 'No accent colour is set on this system, so the Material baseline palette is used.',
    'page.sourcePresetDescription': 'One of the eight Material 3 seed colours.',
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
    'page.sourcePreset': '自选颜色',
    'page.systemDescription': '由 Windows 强调色推导。',
    'page.systemUnavailable': '此系统未设置强调色，因此使用 Material 基准配色。',
    'page.sourcePresetDescription': '从 8 个 Material 3 官方种子色中选择。',
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
