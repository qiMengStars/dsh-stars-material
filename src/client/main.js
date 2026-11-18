/**
 * Client half of the Material 3 theme bundle.
 *
 * What it does, in the order it runs:
 *
 *   1. Reads the stored preference (enabled / seed / variant).
 *   2. Derives one flat `Record<token, { light, dark }>` from the generated
 *      palette table — a pure function: no DOM, no clock, no randomness.
 *   3. Installs two layers:
 *        a. `theme.overrideTokens(source, tokens)` — every themed token. Layers
 *           stack per token over whatever theme is active, so this keeps
 *           working on top of the built-in palettes and of third-party themes
 *           without fighting them for the preference.
 *        b. `theme.register()` for `material-3-light` / `material-3-dark` — so
 *           the theme is visible to `getTheme().themes` and selectable through
 *           `setTheme` like any other registered theme.
 *   4. Adds one `<style>` element for the values the theme registry cannot
 *      express: `--dsw-radius-*`, the M3 motion curves, and focus-ring tuning.
 *   5. Contributes a settings page.
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
const STORAGE_SEED = STORAGE_PREFIX + 'seed';
const STORAGE_VARIANT = STORAGE_PREFIX + 'variant';

const DEFAULT_SEED = 'deepseek';
const DEFAULT_VARIANT = 'tonalSpot';

const SETTINGS_SECTION_ID = 'material-3';
const SETTINGS_SECTION_ORDER = 26;

const STYLE_TAG_ID = NS + '/material-3.css';

const ROLE_INDEX = new Map(ROLES.map((role, index) => [role, index]));

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

function clampSeed(seed) {
  return Object.hasOwn(PALETTES, seed) ? seed : DEFAULT_SEED;
}

function clampVariant(variant) {
  return VARIANTS.some((entry) => entry.id === variant) ? variant : DEFAULT_VARIANT;
}

function paletteFor(seed, variant, scheme) {
  const byVariant = PALETTES[clampSeed(seed)][clampVariant(variant)];
  return scheme === 'dark' ? byVariant.dark : byVariant.light;
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
 */
function buildTokenMap(seed, variant) {
  const light = paletteFor(seed, variant, 'light');
  const dark = paletteFor(seed, variant, 'dark');

  const tokens = {};

  const put = (name, lightValue, darkValue) => {
    tokens[name] = { light: lightValue, dark: darkValue };
  };

  const putRole = (name, role) => put(name, unpackRole(light, role), unpackRole(dark, role));

  for (const [name, role] of Object.entries(ROLE_TOKENS)) putRole(name, role);
  for (const [name, role] of Object.entries(EXTRA_TOKENS)) putRole(name, role);
  for (const [name, role] of Object.entries(ILLUSTRATION_TOKENS)) putRole(name, role);

  for (const [name, value] of Object.entries(LITERAL_TOKENS)) put(name, value, value);

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

  return tokens;
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
    seed: clampSeed(readStorage(STORAGE_SEED, DEFAULT_SEED)),
    variant: clampVariant(readStorage(STORAGE_VARIANT, DEFAULT_VARIANT)),
  };
}

// ---------------------------------------------------------------------------
// Layer 2: stylesheet for values the registry cannot carry
// ---------------------------------------------------------------------------

const SHAPE_DECLARATIONS = Object.entries(SHAPE_TOKENS)
  .map(([name, value]) => '  ' + name + ': ' + value + ';')
  .join('\n');

const MOTION_DECLARATIONS = Object.entries(MOTION_TOKENS)
  .map(([name, value]) => '  ' + name + ': ' + value + ';')
  .join('\n');

const STYLESHEET = `
:root {
${SHAPE_DECLARATIONS}
${MOTION_DECLARATIONS}
}

/* Material 3 replaces the default focus ring with a 2dp offset outline. */
:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}

/* Material 3 state changes are animated on the standard curve. */
button,
[role="button"],
[role="switch"],
[role="radio"] {
  transition:
    background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    border-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
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
  border-bottom: .5px solid var(--dsw-alias-border-l2);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
}
.${NS}-row:last-child { border-bottom: 0; }
.${NS}-row-head { display: flex; align-items: center; gap: 8px; }
.${NS}-row-title { color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 22px; }
.${NS}-row-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.${NS}-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.${NS}-chip {
  box-sizing: border-box;
  align-items: center;
  gap: 6px;
  display: inline-flex;
  border: .5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-xl);
  background: 0 0;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 8px 14px;
  cursor: pointer;
}
.${NS}-chip:hover { background: var(--dsw-alias-interactive-bg-hover); }
.${NS}-chip:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.${NS}-chip[aria-checked="true"] {
  background: var(--dsw-alias-bg-module-platform);
  border-color: var(--dsw-alias-brand-primary);
}
.${NS}-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: .5px solid var(--dsw-alias-border-l4);
  flex: none;
}
.${NS}-toggle { display: inline-flex; align-items: center; gap: 10px; }
.${NS}-switch {
  box-sizing: border-box;
  width: 40px;
  height: 24px;
  border-radius: 999px;
  border: .5px solid var(--dsw-alias-border-l4);
  background: var(--dsw-alias-bg-layer-3);
  padding: 2px;
  cursor: pointer;
  display: inline-flex;
}
.${NS}-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.${NS}-switch:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 2px;
}
.${NS}-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dsw-alias-switch-thumb);
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
 * motion curves, focus ring) are only included while the theme is enabled, so
 * switching it off really does restore the previous look.
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
      node.textContent = enabled ? SETTINGS_STYLE + STYLESHEET : SETTINGS_STYLE;
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
    props.label,
  );
}

function Material3SettingsPage(props) {
  const t = props.t;
  const state = props.state;
  const [draft, setDraft] = React.useState(state);

  React.useEffect(() => {
    setDraft(state);
  }, [state.enabled, state.seed, state.variant, state.revision]);

  const commit = (patch) => {
    const next = { enabled: draft.enabled, seed: draft.seed, variant: draft.variant, ...patch };
    setDraft(next);
    props.onChange(next);
  };

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
      h('span', { className: NS + '-row-title' }, t('page.seedTitle')),
      h('span', { className: NS + '-row-desc' }, t('page.seedDescription')),
      h(
        'div',
        { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.seedTitle') },
        SEEDS.map((entry) =>
          h(Chip, {
            key: entry.id,
            selected: entry.id === draft.seed,
            swatch: entry.hex,
            label: t('seed.' + entry.id),
            title: entry.hex,
            onSelect: () => commit({ seed: entry.id }),
          }),
        ),
      ),
    ),

    h(
      'div',
      { className: NS + '-row' },
      h('span', { className: NS + '-row-title' }, t('page.variantTitle')),
      h('span', { className: NS + '-row-desc' }, t('page.variantDescription')),
      h(
        'div',
        { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.variantTitle') },
        VARIANTS.map((entry) =>
          h(Chip, {
            key: entry.id,
            selected: entry.id === draft.variant,
            label: t('variant.' + entry.id),
            title: entry.label,
            onSelect: () => commit({ variant: entry.id }),
          }),
        ),
      ),
    ),

    h('p', { className: NS + '-note' }, t('page.note')),
  );
}

// ---------------------------------------------------------------------------
// Theme layers
// ---------------------------------------------------------------------------

/**
 * Install both theme layers for one preference set.
 *
 * Returns a disposer that removes exactly what this call added. `register()`
 * rejects a duplicate id, so a retune must always dispose before re-registering
 * — which is why this is the only place that touches the registry.
 */
function createThemeLayers(theme, preference) {
  if (!preference.enabled) {
    return { dispose() {} };
  }

  const tokens = buildTokenMap(preference.seed, preference.variant);
  const disposers = [];

  if (typeof theme.overrideTokens === 'function') {
    disposers.push(theme.overrideTokens(SOURCE, tokens));
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
    seed: preference.seed,
    variant: preference.variant,
    revision: 0,
  };

  let styles = installStyles();
  ctx.effect(() => {
    return () => styles.dispose();
  }, NS + ' stylesheet');
  styles.apply(preference.enabled);

  let layers = createThemeLayers(theme, preference);

  ctx.effect(() => {
    return () => {
      layers.dispose();
      layers = { dispose() {} };
    };
  }, NS + ' theme layers');

  const publish = () => {
    published.enabled = preference.enabled;
    published.seed = preference.seed;
    published.variant = preference.variant;
    published.revision += 1;
  };

  const retune = (next) => {
    preference.enabled = next.enabled;
    preference.seed = clampSeed(next.seed);
    preference.variant = clampVariant(next.variant);

    layers.dispose();
    layers = createThemeLayers(theme, preference);
    styles.apply(preference.enabled);

    writeStorage(STORAGE_ENABLED, preference.enabled ? '1' : '0');
    writeStorage(STORAGE_SEED, preference.seed);
    writeStorage(STORAGE_VARIANT, preference.variant);

    publish();
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
      retune(stored);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, NS + ' storage');
}

const DICTS = {
  en: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 theme',
    'page.description':
      'Material You colour roles derived from one seed colour. Light and dark are generated together, so the two palettes always agree.',
    'page.enabledTitle': 'Use Material 3 colours',
    'page.enabledDescription':
      'Recolours surfaces, labels, borders and state colours with Material 3 roles. Turn it off to return to the theme you had before.',
    'page.on': 'On',
    'page.off': 'Off',
    'page.enable': 'Enable Material 3',
    'page.disable': 'Disable Material 3',
    'page.seedTitle': 'Seed colour',
    'page.seedDescription': 'The source colour the whole palette is derived from.',
    'page.variantTitle': 'Colour harmony',
    'page.variantDescription':
      'How far the palette departs from the seed. Tonal spot is the Material 3 default; expressive follows the Material 3 Expressive reading.',
    'page.note':
      'Changes apply immediately and are remembered in this browser, so they survive a reload without restarting the harness.',
    'seed.deepseek': 'DeepSeek blue',
    'seed.indigo': 'Indigo',
    'seed.violet': 'Violet',
    'seed.purple': 'Purple',
    'seed.pink': 'Pink',
    'seed.red': 'Red',
    'seed.orange': 'Orange',
    'seed.amber': 'Amber',
    'seed.green': 'Green',
    'seed.teal': 'Teal',
    'seed.cyan': 'Cyan',
    'seed.graphite': 'Graphite',
    'variant.tonalSpot': 'Tonal spot',
    'variant.expressive': 'Expressive',
    'variant.vibrant': 'Vibrant',
    'variant.content': 'Content',
    'variant.fidelity': 'Fidelity',
    'variant.neutral': 'Neutral',
    'variant.monochrome': 'Monochrome',
    'variant.rainbow': 'Rainbow',
    'variant.fruitSalad': 'Fruit salad',
  },
  zh: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 主题',
    'page.description':
      '由一颗种子色推导出整套 Material You 颜色角色。明暗两套同时生成，因此始终彼此协调。',
    'page.enabledTitle': '启用 Material 3 配色',
    'page.enabledDescription':
      '用 Material 3 角色重新着色表面、文字、边框与状态色。关闭后回到你原先使用的主题。',
    'page.on': '已启用',
    'page.off': '已关闭',
    'page.enable': '启用 Material 3',
    'page.disable': '关闭 Material 3',
    'page.seedTitle': '种子色',
    'page.seedDescription': '整套配色由这颗颜色推导而来。',
    'page.variantTitle': '配色调和方式',
    'page.variantDescription':
      '决定配色偏离种子色的程度。色调斑点是 Material 3 默认值，表现力取向参考 M3 Expressive。',
    'page.note': '修改立即生效，并记忆在本浏览器中，刷新页面即可恢复，无需重启应用。',
    'seed.deepseek': 'DeepSeek 蓝',
    'seed.indigo': '靛蓝',
    'seed.violet': '紫罗兰',
    'seed.purple': '紫色',
    'seed.pink': '品红',
    'seed.red': '红色',
    'seed.orange': '橙色',
    'seed.amber': '琥珀',
    'seed.green': '绿色',
    'seed.teal': '青色',
    'seed.cyan': '天蓝',
    'seed.graphite': '石墨灰',
    'variant.tonalSpot': '色调斑点',
    'variant.expressive': '表现力',
    'variant.vibrant': '鲜艳',
    'variant.content': '内容',
    'variant.fidelity': '保真',
    'variant.neutral': '中性',
    'variant.monochrome': '单色',
    'variant.rainbow': '彩虹',
    'variant.fruitSalad': '水果沙拉',
  },
};
