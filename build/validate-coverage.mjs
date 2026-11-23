/**
 * 校验宿主 CSS 变量映射的完整性。
 *
 *   node build/validate-coverage.mjs
 *
 * 比对 `src/parts/token-map.js` 与 `vendor/dsh-survey/`：
 *   - 漏掉 `design-platform.css` 中声明的变量会报错（missing）。
 *   - 声明了四份参考样式表之外的变量会报错（invented）。
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

/** 宿主颜色变量权威样式表，其中声明的变量必须全覆盖。 */
const COLOUR_SHEET = resolve(SURVEY, 'design-platform.css');

/** 全部参考样式表，用于校验映射表中声明的变量名称是否真实存在。 */
const ALL_SHEETS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
].map((name) => resolve(SURVEY, name));

/** 宿主仅通过回退值引用、未在参考样式表中直接赋值的变量。 */
const REFERENCED_ONLY = new Set(['--dsw-alias-border-selected']);

/** 提取样式表中定义的变量名，排除 `--dsw-static-*` 静态基础色阶。 */
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
console.log(`missing (${missing.length}): ${missing.join(', ') || '无'}`);
console.log(`invented (${invented.length}): ${invented.join(', ') || '无'}`);

if (missing.length > 0 || invented.length > 0) {
  process.exitCode = 1;
} else {
  console.log('coverage OK');
}
