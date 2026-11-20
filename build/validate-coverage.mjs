/**
 * 检查插件是否给产品会读的每个 token 都上了色，且没有声明任何实际不存在的 token。
 *
 *   node build/validate-coverage.mjs
 *
 * 这里比对两个集合。产品 token 是 `design-platform.css` 里被赋值的名字；漏一个，界面
 * 那一部分就还是原装颜色。声明名是任意 vendored 样式表里被赋值的每个 `--dsw-*`；声明
 * 一个哪儿都找不到的名字，要么是笔误，要么是一次我们还没跟上的改名。
 *
 * 两边只要有一边对不上就以非零码退出，于是新版 DSH 里的一次改名会在这里失败，而不是
 * 变成界面上某个永远不变的颜色。
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

/** 颜色权威：只有这张表的完整名字集合必须被覆盖。 */
const COLOUR_SHEET = resolve(SURVEY, 'design-platform.css');

/** 全部样式表，用来判断一个被声明的名字到底存不存在。 */
const ALL_SHEETS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
].map((name) => resolve(SURVEY, name));

/** 产品会读、但没有任何 vendored 样式表给它赋值的名字（它们靠 fallback 生效）。 */
const REFERENCED_ONLY = new Set(['--dsw-alias-border-selected']);

/** 给定来源里被赋值的名字，去掉 `--dsw-static-*` 那几组原始色阶。 */
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
