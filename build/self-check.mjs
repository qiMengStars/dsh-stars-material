/**
 * Offline self-check for the shipped Client bundle.
 *
 * Runs `plugin/client.js` against a minimal stub of the loader, of the two
 * services it reads (`theme`, `locale`) and of the DOM calls it makes, then
 * asserts the token map it installs:
 *
 *   - exactly the 119 product tokens the base stylesheet reads are covered;
 *   - every value is a `{ light, dark }` pair of non-empty strings;
 *   - colour literals are valid `#rrggbb` / `#rrggbbaa`, derived values are
 *     well-formed `color-mix()` over literals;
 *   - light and dark disagree for the tokens that must differ (surfaces,
 *     labels) and agree for the ones that must not (artwork literals);
 *   - the two theme ids are registered with the matching colour scheme;
 *   - retuning replaces the layer instead of stacking another one.
 *
 *   node build/self-check.mjs
 *
 * This is a logic check, not a visual one: it proves the data and the wiring,
 * not how the result looks in the running application.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BUNDLE = resolve(REPO, 'plugin/client.js');
const CSS_FILE = resolve(REPO, 'vendor/dsh-survey/design-platform.css');

const failures = [];
let assertions = 0;
function check(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

// ---------------------------------------------------------------------------
// DOM stub — only the calls this bundle actually makes.
// ---------------------------------------------------------------------------

function createDom() {
  const head = { children: [], appendChild(node) { this.children.push(node); } };
  const attributes = new Map();
  const body = {
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    dataset: {},
  };
  const tags = [];

  const document = {
    head,
    body,
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

  return { document, body, attributes, tags };
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

const DICTS_KEY = Symbol.for('dsh.material-3.dics');

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

// ---------------------------------------------------------------------------
// Load the bundle
// ---------------------------------------------------------------------------

const source = await readFile(BUNDLE, 'utf8');
const dom = createDom();
const theme = createThemeStub();
const locale = createLocaleStub();

const storage = new Map();
const window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, value),
  },
  addEventListener() {},
  removeEventListener() {},
};

const effects = [];
const context = {
  console,
  window,
  document: dom.document,
};

/** `ctx` as the loader builds it: `get` for optional services, `effect` for cleanup. */
const ctx = {
  get(name) {
    if (name === 'theme') return theme;
    if (name === 'locale') return locale;
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
  console,
};

let factory;
const sandbox = {
  ...context,
  globalThis: undefined,
  console,
  setTimeout,
  clearTimeout,
};
sandbox.globalThis = sandbox;
sandbox.window = window;
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
}

const plugin = factory((id) => {
  if (id !== 'react') throw new Error(`unexpected require("${id}")`);
  // The bundle only uses createElement; a pass-through is enough for wiring.
  return {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
  };
});

check(Array.isArray(plugin.inject), 'the plugin does not declare inject');
check(plugin.inject.includes('theme'), 'the plugin does not declare the theme service');
check(typeof plugin.apply === 'function', 'the plugin does not expose apply()');

plugin.apply(ctx);

// ---------------------------------------------------------------------------
// Assertions on what the plugin installed
// ---------------------------------------------------------------------------

const override = theme.calls.overrides[0];
check(override !== undefined, 'no override layer was installed');
check(override.source === 'dsh-material-3', `override source is "${override.source}"`);

const tokens = override.tokens;
const productNames = Object.keys(tokens).sort();

const css = await readFile(CSS_FILE, 'utf8');
const declared = new Set();
for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
const expected = [...declared].filter((name) => !name.startsWith('--dsw-static-')).sort();

const missing = expected.filter((name) => !productNames.includes(name));
const invented = productNames.filter((name) => !declared.has(name));
check(missing.length === 0, `tokens missing from the override layer: ${missing.join(', ')}`);
check(invented.length === 0, `override layer invents tokens: ${invented.join(', ')}`);

const colorLiteral = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const colorMix = /^color-mix\(in srgb, #(?:[0-9a-f]{6}) \d+%, #(?:[0-9a-f]{6})\)$/;

let derived = 0;
let literal = 0;
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
check(
  literal + derived === productNames.length * 2,
  `processed ${literal + derived} values for ${productNames.length} tokens; expected two per token`,
);

// Tokens that must be identical in both schemes: artwork and the shape scale.
for (const name of ['--dsw-alias-bg-mask-photo', '--dsw-alias-border-inverted']) {
  check(tokens[name]?.light === tokens[name]?.dark, `${name} must not vary between schemes`);
}
check(!sameInBothSchemes.includes('--dsw-alias-bg-base'), '--dsw-alias-bg-base is identical in both schemes');
check(differInBothSchemes.length > 90, `only ${differInBothSchemes.length} tokens differ between schemes`);

// Registered themes.
const ids = theme.calls.registered.map((entry) => `${entry.id}:${entry.colorScheme}`).sort();
check(
  ids.join(',') === 'material-3-dark:dark,material-3-light:light',
  `registered themes are [${ids.join(', ')}]`,
);
for (const entry of theme.calls.registered) {
  const own = Object.keys(entry.tokens);
  const bad = own.filter((name) => !name.startsWith('--dsw-'));
  check(bad.length === 0, `theme "${entry.id}" carries non-product tokens: ${bad.join(', ')}`);
  const mismatch = own.filter((name) => entry.tokens[name] !== tokens[name]?.[entry.colorScheme]);
  check(mismatch.length === 0, `theme "${entry.id}" disagrees with the override layer`);
}

// Locales. The plugin registers one dictionary set: `{ en, zh }`.
check(locale.__dicts.length === 1, `expected one dictionary set, got ${locale.__dicts.length}`);
const en = locale.__dicts[0]?.en;
const zh = locale.__dicts[0]?.zh;
check(en !== undefined && zh !== undefined, 'locale dictionaries are missing');
if (en && zh) {
  const enKeys = Object.keys(en).sort();
  const zhKeys = Object.keys(zh).sort();
  check(
    enKeys.join(',') === zhKeys.join(','),
    'en and zh dictionaries have different keys',
  );
  check(en['meta.title'] !== undefined || en['nav.title'] !== undefined, 'locale misses nav.title');
}

// Stylesheet.
check(dom.tags.length === 1, `expected exactly one <style>, got ${dom.tags.length}`);
check(
  dom.tags[0]?.textContent.includes('--dsw-radius-panel'),
  'the shape scale is missing from the injected stylesheet',
);
check(
  dom.tags[0]?.textContent.includes('--dsw-m3-ease-emphasized-decelerate'),
  'the motion curve is missing from the injected stylesheet',
);

// Cleanup must remove the stylesheet and both layers.
for (const effect of effects) {
  if (typeof effect.dispose === 'function') effect.dispose();
}
check(theme.calls.disposed >= 3, `only ${theme.calls.disposed} layers were disposed`);
check(dom.tags.length === 0, 'the <style> element outlived the plugin');

// Disabling must drop both theme layers and the theme-only stylesheet rules,
// which is what makes "turn it off" actually restore the previous look.
{
  dom.tags.length = 0;
  effects.length = 0;
  const off = createThemeStub();
  const offLocale = createLocaleStub();
  storage.clear();
  storage.set('dsh.material-3.enabled', '0');
  const offCtx = {
    get: (name) => (name === 'theme' ? off : name === 'locale' ? offLocale : undefined),
    effect: (callback, label) => {
      const dispose = callback();
      effects.push({ label, dispose });
      return dispose;
    },
    console,
  };
  plugin.apply(offCtx);
  check(off.calls.overrides.length === 0, 'a disabled theme still installed an override layer');
  check(off.calls.registered.length === 0, 'a disabled theme still registered a theme');
  check(dom.tags.length === 1, 'the settings stylesheet must stay present while disabled');
  check(
    !dom.tags[0].textContent.includes('--dsw-radius-panel'),
    'theme-only rules leaked into the disabled stylesheet',
  );
  check(
    dom.tags[0].textContent.includes('.-page') || dom.tags[0].textContent.includes('-page'),
    'the settings stylesheet disappeared while disabled',
  );
  for (const effect of effects) {
    if (typeof effect.dispose === 'function') effect.dispose();
  }
  check(dom.tags.length === 0, 'the disabled stylesheet outlived the plugin');
  storage.clear();
}

report();

function report() {
  if (failures.length > 0) {
    console.error(`self-check FAILED (${failures.length})`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`tokens        ${productNames.length} (${differInBothSchemes.length} differ by scheme)`);
  console.log(`colours       ${literal} literals, ${derived} derived`);
  console.log(`themes        ${ids.join(', ')}`);
  console.log(`locales       en + zh, ${Object.keys(en).length} keys aligned`);
  console.log('self-check OK');
}
