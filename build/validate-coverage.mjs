/**
 * 校验插件是否覆盖产品读取的全部 token，且未声明实际不存在的 token。
 *
 *   node build/validate-coverage.mjs
 *
 * 比对两个集合。产品 token 指在 `design-platform.css` 中被赋值的名字，遗漏会使对应
 * 界面区域无法应用主题配色。声明名指任意 vendored 样式表中被赋值的每个 `--dsw-*`，
 * 声明不存在的名字意味着笔误或尚未同步的改名。
 *
 * 任一集合不匹配即以非零码退出：新版 DSH 中的改名会在校验阶段失败，而不会变成界面上
 * 一个永不变化的颜色。
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

/** 颜色权威样式表：仅该表的完整名字集合必须被覆盖。 */
const COLOUR_SHEET = resolve(SURVEY, 'design-platform.css');

/** 全部样式表，用于判断被声明的名字是否存在。 */
const ALL_SHEETS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
].map((name) => resolve(SURVEY, name));

/** 产品会读取、但任何 vendored 样式表均未给其赋值的名字（依靠 fallback 生效）。 */
const REFERENCED_ONLY = new Set(['--dsw-alias-border-selected']);

/** 给定来源中被赋值的名字，排除 `--dsw-static-*` 原始色阶。 */
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
