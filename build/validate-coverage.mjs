/**
 * Coverage check: every theme token the product actually reads must be produced
 * by the plugin, and the plugin must not invent tokens the product never reads.
 *
 *   node build/validate-coverage.mjs
 *
 * The reference sheet is `vendor/dsh-survey/design-platform.css`, extracted from
 * the shipped app.asar (see docs/research/dsh-theme-architecture.md for the
 * extraction recipe). It is vendored so this check keeps working with `.tmp/`
 * deleted, which is where the extraction originally landed.
 *
 * Exits non-zero when either side is out of sync, so CI-style checks catch a
 * token rename in a future DSH release.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALPHA_TOKENS,
  DIFF_TOKENS,
  EXTRA_TOKENS,
  ILLUSTRATION_TOKENS,
  LITERAL_TOKENS,
  MIX_TOKENS,
  ROLE_TOKENS,
} from '../src/parts/token-map.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const CSS_FILE = resolve(REPO, 'vendor/dsh-survey/design-platform.css');

const css = await readFile(CSS_FILE, 'utf8');

/** Names assigned in the base stylesheet, minus the raw `--dsw-static-*` ramps. */
function productTokens(source) {
  const names = new Set();
  for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/g)) names.add(match[1]);
  return [...names]
    .filter((name) => !name.startsWith('--dsw-static-'))
    .sort();
}

const owned = new Set([
  ...Object.keys(ROLE_TOKENS),
  ...Object.keys(ALPHA_TOKENS),
  ...Object.keys(MIX_TOKENS),
  ...Object.keys(EXTRA_TOKENS),
  ...Object.keys(DIFF_TOKENS),
  ...Object.keys(ILLUSTRATION_TOKENS),
  ...Object.keys(LITERAL_TOKENS),
]);

const product = productTokens(css);
const missing = product.filter((name) => !owned.has(name));
const invented = [...owned].filter((name) => !product.includes(name)).sort();

console.log(`product tokens: ${product.length}`);
console.log(`owned tokens:   ${owned.size}`);
console.log(`missing (${missing.length}): ${missing.join(', ') || 'none'}`);
console.log(`invented (${invented.length}): ${invented.join(', ') || 'none'}`);

if (missing.length > 0 || invented.length > 0) {
  process.exitCode = 1;
} else {
  console.log('coverage OK');
}
