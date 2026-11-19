/**
 * Manifest and packaging check for the bundle in `plugin/`.
 *
 * Verifies the things a browser cannot tell you and a user would only discover
 * after installing:
 *
 *   - `package.json` declares the fields the loader needs (`name`, `type`,
 *     `exports`, `dsh.bundle.patch`, `dsh.client`) and never depends on a
 *     Harness client package at runtime;
 *   - every `exports`/`files` entry resolves to a real file in the package;
 *   - `cordis.patch.yml` inserts exactly one row whose name matches the package;
 *   - both locale files parse, carry `meta.title` / `meta.description` in
 *     sentence case, and expose the same key set;
 *   - the icon is a well-formed SVG with a `viewBox`, well under the size cap;
 *   - the Client bundle only `require`s modules from the allowed list.
 *
 *   node build/validate-manifest.mjs
 */

import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PKG_DIR = resolve(REPO, 'plugin');

const ICON_LIMIT = 256 * 1024;
const ALLOWED_REQUIRES = new Set(['react', 'react/jsx-runtime']);
const FORBIDDEN_PREFIXES = ['@deepseek-ai/'];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function readJson(path) {
  const text = await readFile(path, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`${path}: not valid JSON (${error.message})`);
    return {};
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

const pkg = await readJson(resolve(PKG_DIR, 'package.json'));

check(typeof pkg.name === 'string' && pkg.name.length > 0, 'package.json: missing "name"');
check(/^[a-z0-9][a-z0-9._-]*$/u.test(pkg.name ?? ''), `package.json: "name" is not a valid package id`);
check(typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/u.test(pkg.version), 'package.json: missing semver "version"');
check(pkg.type === 'module', 'package.json: "type" must be "module"');
check(pkg.private === true, 'package.json: expected "private": true for a bundled plugin');
check(pkg.dependencies === undefined, 'package.json: a bundle must not declare dependencies');
check(pkg.devDependencies === undefined, 'package.json: a bundle must not declare devDependencies');

const dsh = pkg.dsh ?? {};
check(typeof dsh.bundle?.patch === 'string', 'package.json: missing dsh.bundle.patch');
check(dsh.client?.platform === 'web', 'package.json: dsh.client.platform must be "web"');
check(Array.isArray(dsh.client?.inject), 'package.json: dsh.client.inject must be an array');
for (const entry of dsh.client?.inject ?? []) {
  check(
    !FORBIDDEN_PREFIXES.some((prefix) => entry.startsWith(prefix)) || entry.startsWith('@deepseek-ai/dsh-client-ui-'),
    `package.json: dsh.client.inject entry "${entry}" is not a UI package`,
  );
}

const exportsMap = pkg.exports ?? {};
check(exportsMap['.'] !== undefined, 'package.json: exports["."] is required');
check(exportsMap['./client'] !== undefined, 'package.json: exports["./client"] is required');
check(exportsMap['./icon'] !== undefined, 'package.json: exports["./icon"] is required');
check(exportsMap['./locale/*.json'] !== undefined, 'package.json: exports["./locale/*.json"] is required');

const targets = new Set();
for (const value of Object.values(exportsMap)) {
  if (typeof value === 'string') targets.add(value.replace(/^\.\//, ''));
}
for (const entry of pkg.files ?? []) targets.add(entry.replace(/^\.\//, ''));

for (const target of targets) {
  if (target.includes('*')) continue;
  check(await exists(resolve(PKG_DIR, target)), `package.json: "${target}" is listed but missing from the package`);
}

for (const required of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'locale/en.json', 'locale/zh.json']) {
  check(await exists(resolve(PKG_DIR, required)), `package is missing ${required}`);
}

// ---------------------------------------------------------------------------
// cordis.patch.yml
// ---------------------------------------------------------------------------

const patchPath = resolve(PKG_DIR, dsh.bundle?.patch ?? 'cordis.patch.yml');
if (await exists(patchPath)) {
  const patch = await readFile(patchPath, 'utf8');
  const rows = [...patch.matchAll(/^\s*-\s*id:\s*(\S+)\s*\n\s*name:\s*(\S+)\s*$/gmu)];
  check(rows.length === 1, `cordis.patch.yml: expected exactly one insert row, found ${rows.length}`);
  if (rows.length === 1) {
    const [, id, name] = rows[0];
    check(id === pkg.name, `cordis.patch.yml: id "${id}" does not match the package name`);
    check(
      name === pkg.name || name === `'${pkg.name}'`,
      `cordis.patch.yml: name "${name}" does not resolve to the package`,
    );
  }
} else {
  failures.push('cordis.patch.yml is missing');
}

// ---------------------------------------------------------------------------
// Locale files
// ---------------------------------------------------------------------------

const localeDir = resolve(PKG_DIR, 'locale');
const en = await readJson(resolve(localeDir, 'en.json'));
const zh = await readJson(resolve(localeDir, 'zh.json'));

function flatten(object, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (value !== null && typeof value === 'object') Object.assign(out, flatten(value, path));
    else out[path] = value;
  }
  return out;
}

const enFlat = flatten(en);
const zhFlat = flatten(zh);

check(typeof enFlat['meta.title'] === 'string' && enFlat['meta.title'].length > 0, 'en.json: missing meta.title');
check(
  typeof enFlat['meta.description'] === 'string' && enFlat['meta.description'].length > 0,
  'en.json: missing meta.description',
);
check(typeof zhFlat['meta.title'] === 'string' && zhFlat['meta.title'].length > 0, 'zh.json: missing meta.title');
check(
  typeof zhFlat['meta.description'] === 'string' && zhFlat['meta.description'].length > 0,
  'zh.json: missing meta.description',
);

// Sentence case: no Title Case Headings, no trailing full stop.
for (const [key, value] of Object.entries(enFlat)) {
  if (key === 'meta.title' || key === 'nav.title') {
    const words = value.split(' ').filter((word) => /^[A-Za-z]/.test(word));
    const inner = words.slice(1);
    check(
      inner.every((word) => !/^[A-Z][a-z]/.test(word)),
      `en.json: "${key}" is not sentence case ("${value}")`,
    );
  }
  if (key === 'meta.title') check(!value.endsWith('.'), 'en.json: meta.title must not end with a full stop');
}

const enKeys = Object.keys(enFlat).sort();
const zhKeys = Object.keys(zhFlat).sort();
check(enKeys.join(',') === zhKeys.join(','), 'locale files have different key sets');
for (const key of enKeys) {
  check(typeof zhFlat[key] === 'string' && zhFlat[key].length > 0, `zh.json: "${key}" is empty`);
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

const iconPath = resolve(PKG_DIR, 'icon.svg');
if (await exists(iconPath)) {
  const info = await stat(iconPath);
  check(info.size <= ICON_LIMIT, `icon.svg is ${info.size} B, above the 256 KiB cap`);
  const icon = await readFile(iconPath, 'utf8');
  check(/^<svg\b/u.test(icon.trim()), 'icon.svg: root element must be <svg>');
  check(icon.includes('xmlns="http://www.w3.org/2000/svg"'), 'icon.svg: missing the SVG namespace');
  check(/viewBox="[^"]+"/u.test(icon), 'icon.svg: missing a viewBox');
  check(!/<script\b/iu.test(icon), 'icon.svg: must not contain <script>');
  check(!/<style\b/iu.test(icon), 'icon.svg: must not contain <style>');
  check(!/href="(?:https?:)?\/\//u.test(icon), 'icon.svg: must not reference remote resources');
}

// ---------------------------------------------------------------------------
// Client bundle
// ---------------------------------------------------------------------------

const clientPath = resolve(PKG_DIR, 'client.js');
if (await exists(clientPath)) {
  const client = await readFile(clientPath, 'utf8');
  check(
    client.includes('window.__ModuleLoader__.load('),
    'client.js: must register itself through window.__ModuleLoader__.load',
  );
  check(
    client.includes(`id: ${JSON.stringify(pkg.name)}`) || client.includes(`id: '${pkg.name}'`),
    'client.js: the registered id must be the package name',
  );
  const requires = [...client.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/gu)].map((match) => match[1]);
  const unexpected = [...new Set(requires)].filter((id) => !ALLOWED_REQUIRES.has(id));
  check(unexpected.length === 0, `client.js requires modules outside the allowed list: ${unexpected.join(', ')}`);

  // The bundle is a browser script: an ESM import/export would fail to parse.
  check(!/^\s*import\s[\s\S]*?from\s+["']/mu.test(client), 'client.js: contains an ESM import statement');
  check(!/^\s*export\s+(?:const|let|var|function|class|default)\b/mu.test(client), 'client.js: contains an ESM export statement');

  // Hard-coded colours are only acceptable where they cannot follow the theme:
  // the eight seed swatches drawn in the settings page, and the artwork literals
  // in the token map. Anything else means a palette was pasted into the bundle,
  // which would stop following the active scheme.
  const { PRESETS } = await import(pathToFileURL(resolve(REPO, 'src/parts/palette-spec.js')).href);
  const { LITERAL_TOKENS } = await import(pathToFileURL(resolve(REPO, 'src/parts/token-map.js')).href);
  const allowedHex = new Set([
    ...PRESETS.map((preset) => preset.hex.toLowerCase()),
    ...Object.values(LITERAL_TOKENS).map((value) => value.toLowerCase()),
  ]);
  const hexLiterals = [...new Set((client.match(/#[0-9a-f]{6}(?:[0-9a-f]{2})?/giu) ?? []).map((value) => value.toLowerCase()))];
  const unexpectedHex = hexLiterals.filter((value) => !allowedHex.has(value));
  check(
    unexpectedHex.length === 0,
    `client.js: hard-coded colours outside the seed/artwork allowlist: ${unexpectedHex.join(', ')}`,
  );
}

if (failures.length > 0) {
  console.error(`manifest check FAILED (${failures.length})`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`package       ${pkg.name} ${pkg.version}`);
  console.log(`files         ${[...targets].length} declared targets resolve`);
  console.log(`locales       en + zh, ${enKeys.length} keys aligned`);
  console.log(`client        ${'no Harness client package requires'}`);
  console.log('manifest OK');
}
