/**
 * Coverage check: every colour token the product actually reads must be
 * produced by the plugin, and the plugin must not invent a token that exists
 * nowhere.
 *
 *   node build/validate-coverage.mjs
 *
 * Two sets are compared:
 *
 *   - "product tokens" — the names assigned by `design-platform.css`, the sole
 *     colour authority. Missing one means the plugin forgets to recolour
 *     something; the base DSH colour shows through.
 *   - "declared names" — every `--dsw-*` name assigned by any vendored sheet.
 *     Claiming a name that appears nowhere means the plugin writes a variable
 *     nothing reads, usually a typo.
 *
 * The sheets are vendored under `vendor/dsh-survey/` (see
 * `build/vendor-survey.mjs`) so this check keeps working with no access to the
 * installed archive.
 *
 * Exits non-zero when either side is out of sync, so a future DSH release that
 * renames a token fails loudly instead of degrading silently.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALPHA_TOKENS,
  CLEARED_TOKENS,
  DIFF_TOKENS,
  ELEVATION_TOKENS,
  ILLUSTRATION_TOKENS,
  LITERAL_TOKENS,
  MIX_TOKENS,
  ROLE_TOKENS,
  STATE_LAYER_TOKENS,
} from '../src/parts/token-map.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SURVEY = resolve(REPO, 'vendor/dsh-survey');

/** The colour authority: the only sheet whose full name set must be covered. */
const COLOUR_SHEET = resolve(SURVEY, 'design-platform.css');

/** Every sheet, used to decide whether a claimed name exists at all. */
const ALL_SHEETS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
].map((name) => resolve(SURVEY, name));

/** Names the product reads but no vendored sheet assigns (they rely on a fallback). */
const REFERENCED_ONLY = new Set(['--dsw-alias-border-selected']);

/** Names assigned in the given sources, minus the raw `--dsw-static-*` ramps. */
function declaredNames(sources) {
  const names = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(/(--[a-z0-9-]+)\s*:/g)) names.add(match[1]);
  }
  return [...names].filter((name) => !name.startsWith('--dsw-static-')).sort();
}

const colourSheet = await readFile(COLOUR_SHEET, 'utf8');
const allSheets = await Promise.all(ALL_SHEETS.map((path) => readFile(path, 'utf8')));

const product = declaredNames([colourSheet]);
const everywhere = new Set([...declaredNames(allSheets), ...REFERENCED_ONLY]);

const owned = new Set([
  ...Object.keys(ROLE_TOKENS),
  ...Object.keys(STATE_LAYER_TOKENS),
  ...Object.keys(ALPHA_TOKENS),
  ...Object.keys(MIX_TOKENS),
  ...Object.keys(DIFF_TOKENS),
  ...Object.keys(ILLUSTRATION_TOKENS),
  ...Object.keys(LITERAL_TOKENS),
  ...CLEARED_TOKENS,
  ...ELEVATION_TOKENS,
]);

const missing = product.filter((name) => !owned.has(name));
const invented = [...owned].filter((name) => !everywhere.has(name)).sort();

console.log(`product tokens: ${product.length}`);
console.log(`owned tokens:   ${owned.size}`);
console.log(`missing (${missing.length}): ${missing.join(', ') || 'none'}`);
console.log(`invented (${invented.length}): ${invented.join(', ') || 'none'}`);

if (missing.length > 0 || invented.length > 0) {
  process.exitCode = 1;
} else {
  console.log('coverage OK');
}
