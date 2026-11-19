/**
 * Offline self-check for the shipped Client bundle.
 *
 * Runs `plugin/client.js` against a minimal stub of the loader, of the three
 * services it reads (`theme`, `locale`, `slots`) and of the DOM calls it makes,
 * then asserts the layers it installs:
 *
 *   - exactly the product tokens the shipped stylesheets read are covered;
 *   - every value is a `{ light, dark }` pair of non-empty strings;
 *   - colours are `#rrggbb` / `#rrggbbaa` / `color-mix()` over literals;
 *   - the border tokens Material 3 does not draw are `transparent` while the
 *     one that paints the switch track and the ring gauges stays visible;
 *   - every elevation and shadow composite resolves to `none`;
 *   - every state-layer token is an 8%–12% `color-mix()` over the palette;
 *   - the captured surface ramp strictly descends from lowest to highest;
 *   - the `--dsh-m3-*` bridge carries both schemes;
 *   - the two theme ids are registered with the matching colour scheme;
 *   - preset mode, system mode, the system-mode fallback and the disabled state
 *     each install exactly what they should, and every one cleans up.
 *
 *   node build/self-check.mjs
 *
 * This is a logic check, not a visual one: it proves the data and the wiring,
 * not how the result looks in the running application.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BUNDLE = resolve(REPO, 'plugin/client.js');
const SURVEY = resolve(REPO, 'vendor/dsh-survey');

const failures = [];
let assertions = 0;
function check(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

const SHIPPED_CSS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
];

/** The colour authority, exactly as `build/validate-coverage.mjs` defines it. */
const COLOUR_SHEET = 'design-platform.css';

// ---------------------------------------------------------------------------
// DOM stub — only the calls this bundle actually makes.
// ---------------------------------------------------------------------------

function createDom() {
  const head = { children: [], appendChild(node) { this.children.push(node); } };
  const tags = [];

  const document = {
    head,
    body: { dataset: {} },
    querySelector: () => null,
    createElement(tagName) {
      const node = {
        tagName: tagName.toUpperCase(),
        dataset: {},
        textContent: '',
        remove() {
          const index = tags.indexOf(node);
          if (index >= 0) tags.splice(index, 1);
        },
      };
      tags.push(node);
      return node;
    },
  };

  return { document, tags };
}

// ---------------------------------------------------------------------------
// Service stubs
// ---------------------------------------------------------------------------

function createThemeStub() {
  const calls = { overrides: [], registered: [], disposed: 0 };
  return {
    calls,
    getTheme: () => ({ active: { colorScheme: 'light' } }),
    overrideTokens(source, tokens) {
      calls.overrides.push({ source, tokens });
      return () => { calls.disposed += 1; };
    },
    register(definition) {
      calls.registered.push(definition);
      return () => { calls.disposed += 1; };
    },
  };
}

function createLocaleStub() {
  const dicts = [];
  return {
    __dicts: dicts,
    register(namespace, entries) {
      dicts.push(entries);
      return () => {};
    },
    bind() {
      return (key) => key;
    },
  };
}

function createSlotsStub() {
  const registrations = [];
  return {
    __registrations: registrations,
    inject(key, callback) {
      callback();
      return () => {};
    },
    register(options, component) {
      registrations.push({ options, component });
      return () => {};
    },
  };
}

// ---------------------------------------------------------------------------
// Harness: load the bundle once, then drive `apply` with a fresh context each
// time so the four scenarios cannot leak into each other.
// ---------------------------------------------------------------------------

const source = await readFile(BUNDLE, 'utf8');
const dom = createDom();

/**
 * Timer queue.
 *
 * The Client half retries the accent-colour question on a backoff, so a scenario
 * that answers "the Host is down" now schedules work instead of finishing inside
 * one microtask. Driving those timers by hand keeps the check fast and makes the
 * retry order observable.
 */
const timers = [];
let nextTimerId = 1;
const queueTimer = (callback) => {
  const id = nextTimerId++;
  timers.push({ id, callback });
  return id;
};
const dropTimer = (id) => {
  const entry = timers.find((timer) => timer.id === id);
  if (entry !== undefined) entry.callback = null;
};

let factory;
const sandbox = {
  console: { log() {}, warn() {}, error() {} },
  setTimeout: queueTimer,
  clearTimeout: dropTimer,
  AbortController,
  URL,
};
sandbox.globalThis = sandbox;
sandbox.window = {
  localStorage: null, // replaced per scenario
  addEventListener() {},
  removeEventListener() {},
  setTimeout: queueTimer,
  clearTimeout: dropTimer,
  fetch: null, // replaced per scenario
};
sandbox.window.__ModuleLoader__ = {
  load(options) {
    factory = options.factory;
  },
};
sandbox.document = dom.document;

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'plugin/client.js' });

check(typeof factory === 'function', 'the bundle did not call __ModuleLoader__.load');
if (typeof factory !== 'function') {
  report();
  process.exit(1);
}

const plugin = factory((id) => {
  if (id !== 'react') throw new Error(`unexpected require("${id}")`);
  return {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
  };
});

check(Array.isArray(plugin.inject), 'the plugin does not declare inject');
check(plugin.inject.includes('theme'), 'the plugin does not declare the theme service');
check(typeof plugin.apply === 'function', 'the plugin does not expose apply()');

/**
 * Run one scenario.
 *
 * @param {object} options
 * @param {Record<string,string>} options.storage   localStorage seed
 * @param {Function|null} options.fetch             `window.fetch` replacement
 */
async function scenario({ storage, fetch }) {
  const store = new Map(Object.entries(storage ?? {}));
  sandbox.window.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  sandbox.window.fetch = fetch ?? (() => Promise.reject(new Error('no fetch')));

  /** Number of times the Client asked the Host for the accent palette. */
  let attempts = 0;
  const hostFetch = sandbox.window.fetch;
  sandbox.window.fetch = (...args) => {
    attempts += 1;
    return hostFetch(...args);
  };

  dom.tags.length = 0;

  const theme = createThemeStub();
  const locale = createLocaleStub();
  const slots = createSlotsStub();
  const effects = [];

  const ctx = {
    slots,
    get(name) {
      if (name === 'theme') return theme;
      if (name === 'locale') return locale;
      if (name === 'slots') return slots;
      return undefined;
    },
    effect(callback, label) {
      const dispose = callback();
      effects.push({ label, dispose });
      return dispose;
    },
    on() {
      return () => {};
    },
    provide() {
      return () => {};
    },
    console: sandbox.console,
  };

  plugin.apply(ctx);
  // System mode resolves across an await; preset mode does not, but awaiting a
  // microtask is harmless for both and is what makes the assertions reliable.
  await new Promise((tick) => setImmediate(tick));

  /**
   * Drive the retry backoff to exhaustion.
   *
   * Without this the assertions would see the mid-flight state — the layers from
   * the previous palette — instead of the settled one, which is what a user
   * actually ends up looking at.
   */
  const settle = async () => {
    for (let round = 0; round < 8; round += 1) {
      await new Promise((tick) => setImmediate(tick));
      const pending = timers.splice(0, timers.length);
      if (pending.length === 0) return;
      for (const timer of pending) {
        if (typeof timer.callback === 'function') timer.callback();
      }
    }
  };
  await settle();

  return {
    theme,
    locale,
    slots,
    effects,
    store,
    settle,
    attempts: () => attempts,
    disposeAll() {
      for (const effect of effects) {
        if (typeof effect.dispose === 'function') effect.dispose();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Expected token set
// ---------------------------------------------------------------------------

/**
 * The names the colour authority assigns, minus the raw `--dsw-static-*` ramps.
 *
 * Only `design-platform.css` defines the colour contract, so only its colour
 * tokens have to appear in the override layer. Font, radius and easing variables
 * live in other sheets and stay with the product: this theme has no opinion
 * about them, and overriding them would make the bundle's scope harder to read.
 */
const declared = new Set();
{
  const css = await readFile(resolve(SURVEY, COLOUR_SHEET), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
}
const expected = [...declared]
  .filter((name) => !name.startsWith('--dsw-static-'))
  .filter((name) => name.startsWith('--dsw-alias-') || name.startsWith('--dsw-specific-'))
  .sort();

/** Every name any vendored sheet assigns, plus the ones read through a fallback. */
const everywhere = new Set(['--dsw-alias-border-selected']);
for (const name of SHIPPED_CSS) {
  const css = await readFile(resolve(SURVEY, name), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) everywhere.add(match[1]);
}

// ---------------------------------------------------------------------------
// Scenario 1: preset mode (synchronous, no Host round trip)
// ---------------------------------------------------------------------------

const preset = await scenario({
  storage: { 'dsh.stars-material.source': 'preset', 'dsh.stars-material.preset': 'baseline' },
});

check(preset.theme.calls.overrides.length === 2, `expected two override layers, got ${preset.theme.calls.overrides.length}`);

const override = preset.theme.calls.overrides[0];
check(override?.source === 'dsh-stars-material', `override source is "${override?.source}"`);
const bridge = preset.theme.calls.overrides[1];
check(bridge?.source === 'dsh-stars-material/bridge', `bridge source is "${bridge?.source}"`);

const tokens = override?.tokens ?? {};
const productNames = Object.keys(tokens).sort();

const missing = expected.filter((name) => !productNames.includes(name));
const invented = productNames.filter((name) => !everywhere.has(name));
check(missing.length === 0, `tokens missing from the override layer: ${missing.join(', ')}`);
check(invented.length === 0, `override layer invents tokens: ${invented.join(', ')}`);

const colorLiteral = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const colorMix = /^(?:color-mix\(in srgb, #(?:[0-9a-f]{6}) \d+%, (?:(?:#(?:[0-9a-f]{6}))|transparent)\)|light-dark\(#(?:[0-9a-f]{6}), #(?:[0-9a-f]{6})\))$/;
const noPaint = new Set(['transparent', 'none']);

let derived = 0;
let literal = 0;
let cleared = 0;
const sameInBothSchemes = [];
const differInBothSchemes = [];

for (const [name, modes] of Object.entries(tokens)) {
  if (modes === null || typeof modes !== 'object') {
    failures.push(`${name}: value is not an object`);
    continue;
  }
  if (typeof modes.light !== 'string' || typeof modes.dark !== 'string') {
    failures.push(`${name}: missing a light/dark string pair`);
    continue;
  }
  for (const [scheme, value] of [['light', modes.light], ['dark', modes.dark]]) {
    if (noPaint.has(value)) {
      cleared += 1;
      continue;
    }
    if (colorMix.test(value)) {
      derived += 1;
      continue;
    }
    if (colorLiteral.test(value)) {
      literal += 1;
      continue;
    }
    failures.push(`${name} (${scheme}): malformed value "${value}"`);
  }
  if (modes.light === modes.dark) sameInBothSchemes.push(name);
  else differInBothSchemes.push(name);
}

check(derived > 0, 'no color-mix() values were derived');
check(cleared > 0, 'no token was cleared to transparent/none');
check(
  literal + derived + cleared === productNames.length * 2,
  `processed ${literal + derived + cleared} values for ${productNames.length} tokens; expected two per token`,
);

// Strokes Material 3 does not draw. Every border token goes transparent, `l3`
// included: the four rules that painted a *fill* with it are repainted from the
// bridge variables in the stylesheet, and the two SVG gauge tracks keep their
// foreground arc and label.
for (const name of [
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-border-l2-darkmode-thin',
  '--dsw-alias-settings-card-stroke',
  '--dsw-alias-border-selected',
]) {
  check(tokens[name]?.light === 'transparent', `${name} must be transparent`);
}

// Elevation is tone, not shadow.
for (const name of [
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv3',
  '--dsw-elevation-stroke',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
]) {
  check(tokens[name]?.light === 'none', `${name} must resolve to none`);
}

// Hover is a state layer over the surface, never a shadow.
for (const name of [
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-button-primary-hover',
]) {
  const value = tokens[name]?.light ?? '';
  check(
    /^color-mix\(in srgb, #(?:[0-9a-f]{6}) (?:\d+)%, /u.test(value),
    `${name} must be a state-layer color-mix, got "${value}"`,
  );
}
check(
  (tokens['--dsw-alias-interactive-bg-hover']?.light ?? '').includes('transparent'),
  '--dsw-alias-interactive-bg-hover must mix into transparent so it works on any surface',
);

// Artwork that must not vary, and surfaces that must.
for (const name of ['--dsw-alias-bg-mask-photo', '--dsw-alias-border-inverted']) {
  check(tokens[name]?.light === tokens[name]?.dark, `${name} must not vary between schemes`);
}
check(!sameInBothSchemes.includes('--dsw-alias-bg-base'), '--dsw-alias-bg-base is identical in both schemes');
check(differInBothSchemes.length > 90, `only ${differInBothSchemes.length} tokens differ between schemes`);

// The captured surface ramp must descend: lowest is the brightest light surface.
{
  const ramp = [
    '--dsw-alias-bg-base',
    '--dsw-alias-bg-layer-1',
    '--dsw-alias-bg-layer-2',
    '--dsw-alias-bg-layer-3',
    '--dsw-alias-bg-overlay',
  ];
  const luminance = (hex) => {
    const value = Number.parseInt(hex.slice(1, 7), 16);
    return ((value >> 16) & 0xff) + ((value >> 8) & 0xff) + (value & 0xff);
  };
  const lightValues = ramp.map((name) => tokens[name]?.light ?? '#000000');
  const descending = lightValues.every(
    (value, index) => index === 0 || luminance(lightValues[index - 1]) >= luminance(value),
  );
  check(descending, `the light surface ramp does not descend: ${lightValues.join(' ')}`);

  const darkValues = ramp.map((name) => tokens[name]?.dark ?? '#000000');
  const ascending = darkValues.every(
    (value, index) => index === 0 || luminance(darkValues[index - 1]) <= luminance(value),
  );
  check(ascending, `the dark surface ramp does not ascend: ${darkValues.join(' ')}`);
}

// Bridge properties carry both schemes through light-dark().
const bridgeNames = Object.keys(bridge?.tokens ?? {});
check(bridgeNames.length >= 15, `only ${bridgeNames.length} bridge properties were published`);
for (const name of bridgeNames) {
  check(name.startsWith('--dsh-m3-'), `bridge property "${name}" does not use the --dsh-m3- prefix`);
  check(
    /^light-dark\(#(?:[0-9a-f]{6}), #(?:[0-9a-f]{6})\)$/u.test(bridge.tokens[name]?.light ?? ''),
    `bridge property "${name}" is not a light-dark() pair`,
  );
}

// Registered themes.
const ids = preset.theme.calls.registered.map((entry) => `${entry.id}:${entry.colorScheme}`).sort();
check(
  ids.join(',') === 'stars-material-dark:dark,stars-material-light:light',
  `registered themes are [${ids.join(', ')}]`,
);
for (const entry of preset.theme.calls.registered) {
  const own = Object.keys(entry.tokens);
  const bad = own.filter((name) => !name.startsWith('--dsw-'));
  check(bad.length === 0, `theme "${entry.id}" carries non-product tokens: ${bad.join(', ')}`);
  const mismatch = own.filter((name) => entry.tokens[name] !== tokens[name]?.[entry.colorScheme]);
  check(mismatch.length === 0, `theme "${entry.id}" disagrees with the override layer`);
}

// Locales.
check(preset.locale.__dicts.length === 1, `expected one dictionary set, got ${preset.locale.__dicts.length}`);
const en = preset.locale.__dicts[0]?.en;
const zh = preset.locale.__dicts[0]?.zh;
check(en !== undefined && zh !== undefined, 'locale dictionaries are missing');
if (en && zh) {
  check(
    Object.keys(en).sort().join(',') === Object.keys(zh).sort().join(','),
    'en and zh dictionaries have different keys',
  );
  check(en['page.sourceSystem'] !== undefined, 'locale misses page.sourceSystem');
  check(!Object.keys(en).some((key) => key.startsWith('variant.')), 'the removed harmony variants are still translated');
}

// The settings page is contributed to `settings.section` under its own id.
check(preset.slots.__registrations.length === 1, `expected one settings section, got ${preset.slots.__registrations.length}`);
check(
  preset.slots.__registrations[0]?.options?.id === 'stars-material',
  'the settings section id is not "stars-material"',
);
check(
  preset.slots.__registrations[0]?.options?.order === 26,
  'the settings section order is not 26',
);

// Stylesheet: one tag, carries the shape scale, the motion curves and the rules.
check(dom.tags.length === 1, `expected exactly one <style>, got ${dom.tags.length}`);
const sheet = dom.tags[0]?.textContent ?? '';
check(sheet.includes('--dsw-radius-panel'), 'the shape scale is missing from the injected stylesheet');
check(sheet.includes('--dsw-m3-ease-emphasized-decelerate'), 'the motion curve is missing');
check(sheet.includes('[role="switch"]'), 'the switch repaint rule is missing');
check(sheet.includes('prefers-reduced-motion'), 'the reduced-motion guard is missing');
check(!/\._[a-z0-9]+_[a-z0-9]+_\d+/u.test(sheet), 'the stylesheet hardcodes a CSS module hash class');

preset.disposeAll();
check(preset.theme.calls.disposed >= 4, `only ${preset.theme.calls.disposed} layers were disposed`);
check(dom.tags.length === 0, 'the <style> element outlived the plugin');

// ---------------------------------------------------------------------------
// Scenario 2: system mode with a Host answer
// ---------------------------------------------------------------------------

const ANSWER = {
  ok: true,
  seed: '#00639b',
  light: 'a'.repeat(270),
  dark: 'b'.repeat(270),
  appsUseLightTheme: true,
};

const system = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(ANSWER) }),
});

check(system.theme.calls.overrides.length === 2, 'system mode did not install both override layers');
check(
  system.theme.calls.registered.length === 2,
  `system mode registered ${system.theme.calls.registered.length} themes`,
);
// 'a' is not a colour; every role must still come out as a well-formed literal.
const systemTokens = system.theme.calls.overrides[0]?.tokens ?? {};
check(
  systemTokens['--dsw-alias-bg-base']?.light === '#aaaaaa',
  `system mode did not use the Host palette: "${systemTokens['--dsw-alias-bg-base']?.light}"`,
);
const state = system.slots.__registrations[0]?.options?.inject?.()?.state;
check(state?.systemSeed === '#00639b', `the settings page does not show the system seed: "${state?.systemSeed}"`);
system.disposeAll();
check(dom.tags.length === 0, 'the system-mode stylesheet outlived the plugin');

// ---------------------------------------------------------------------------
// Scenario 3: system mode when the Host is unavailable
// ---------------------------------------------------------------------------

const fallback = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: () => Promise.reject(new Error('ECONNREFUSED')),
});

check(fallback.theme.calls.overrides.length === 2, 'the fallback did not install both override layers');
const fallbackState = fallback.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  fallbackState?.systemSeed === null,
  'the settings page must report that no system colour is available',
);
check(
  fallback.theme.calls.overrides[0]?.tokens?.['--dsw-alias-bg-base']?.light === '#fdf7ff',
  'the fallback palette is not the Material baseline',
);
check(
  fallback.attempts() === 4,
  `a Host that never answers must be retried four times, not ${fallback.attempts()}`,
);
fallback.disposeAll();
check(dom.tags.length === 0, 'the fallback stylesheet outlived the plugin');

// A first attempt that fails must not be final: the next retry upgrades the
// layers instead of leaving the baseline palette in place for the session.
const recovered = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: (() => {
    let calls = 0;
    return () => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error('ECONNREFUSED'))
        : Promise.resolve({ ok: true, json: () => Promise.resolve(ANSWER) });
    };
  })(),
});
check(recovered.attempts() >= 2, `the Host was only asked ${recovered.attempts()} times`);
// The last install contributes two layers: tokens first, then the bridge pairs.
check(
  recovered.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light === '#aaaaaa',
  'a retry that succeeds did not replace the fallback palette',
);
const recoveredState = recovered.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  recoveredState?.systemSeed === '#00639b',
  `the recovered seed is not reported: "${recoveredState?.systemSeed}"`,
);
recovered.disposeAll();

// ---------------------------------------------------------------------------
// Scenario 4: disabled
// ---------------------------------------------------------------------------

const off = await scenario({
  storage: { 'dsh.stars-material.enabled': '0', 'dsh.stars-material.source': 'preset' },
});

check(off.theme.calls.overrides.length === 0, 'a disabled theme still installed an override layer');
check(off.theme.calls.registered.length === 0, 'a disabled theme still registered a theme');
check(dom.tags.length === 1, 'the settings stylesheet must stay present while disabled');
const offSheet = dom.tags[0]?.textContent ?? '';
check(!offSheet.includes('--dsw-radius-panel'), 'theme-only rules leaked into the disabled stylesheet');
check(offSheet.includes('-page'), 'the settings stylesheet disappeared while disabled');
off.disposeAll();
check(dom.tags.length === 0, 'the disabled stylesheet outlived the plugin');

// ---------------------------------------------------------------------------
// Scenario 5: a profile that still holds pre-rename keys
// ---------------------------------------------------------------------------

// The plugin used to be called dsh-material-3 and wrote dsh.material-3.*. A
// rename must not silently reset the preference, so the old keys are read once.
const legacy = await scenario({
  storage: { 'dsh.material-3.enabled': '0', 'dsh.material-3.source': 'preset' },
});
check(
  legacy.theme.calls.overrides.length === 0,
  'a legacy "enabled: 0" was ignored, so the rename reset the user preference',
);
const legacyState = legacy.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  legacyState?.enabled === false,
  `legacy preference not carried over: enabled is "${legacyState?.enabled}"`,
);
const legacyPreset = await scenario({
  storage: { 'dsh.material-3.source': 'preset', 'dsh.material-3.preset': 'teal' },
});
check(
  legacyPreset.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base'] !== undefined,
  'legacy preset mode did not install a palette',
);
legacy.disposeAll();
legacyPreset.disposeAll();

// The current key must win over the legacy one once it exists.
const bothKeys = await scenario({
  storage: { 'dsh.stars-material.enabled': '1', 'dsh.material-3.enabled': '0' },
});
check(
  bothKeys.theme.calls.overrides.length === 2,
  'the current key did not take precedence over the legacy key',
);
bothKeys.disposeAll();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

report();

function report() {
  if (failures.length > 0) {
    process.stderr.write(`self-check FAILED (${failures.length} of ${assertions})\n`);
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`tokens        ${productNames.length} (${differInBothSchemes.length} differ by scheme)\n`);
  process.stdout.write(`colours       ${literal} literals, ${derived} derived, ${cleared} cleared\n`);
  process.stdout.write(`bridge        ${bridgeNames.length} --dsh-m3-* properties\n`);
  process.stdout.write(`themes        ${ids.join(', ')}\n`);
  process.stdout.write(`locales       en + zh, ${Object.keys(en ?? {}).length} keys aligned\n`);
  process.stdout.write(`scenarios     preset, system, fallback, recovered, disabled, legacy (${assertions} assertions)\n`);
  process.stdout.write('self-check OK\n');
}
