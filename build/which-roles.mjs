/**
 * 开发期辅助脚本：统计 `token-map.js` 与 `BRIDGE_ROLES` 实际引用的 Material 3 角色，
 * 并与 `palette-spec.js` 中声明的 `ROLE_ORDER` / `FIXED_ROLE_ORDER` 比对。
 *
 *   node build/which-roles.mjs
 */
import {
  ROLE_TOKENS,
  ALPHA_TOKENS,
  MIX_TOKENS,
  DIFF_TOKENS,
  ILLUSTRATION_TOKENS,
  STATE_LAYER_TOKENS,
} from '../src/parts/token-map.js';
import { ROLE_ORDER, FIXED_ROLE_ORDER, BRIDGE_ROLES } from '../src/parts/palette-spec.js';

const roles = new Set();

for (const role of Object.values(ROLE_TOKENS)) roles.add(role);
for (const role of Object.values(ILLUSTRATION_TOKENS)) roles.add(role);
for (const entry of BRIDGE_ROLES) roles.add(entry.role);

for (const spec of Object.values(ALPHA_TOKENS)) {
  if (spec.role !== undefined) roles.add(spec.role);
  if (spec.literal !== undefined) roles.add(spec.literal);
}

for (const spec of Object.values(MIX_TOKENS)) {
  roles.add(spec.role);
  if (spec.into !== undefined) roles.add(spec.into);
}

for (const spec of Object.values(DIFF_TOKENS)) {
  roles.add(spec.role);
  if (spec.toward !== undefined) roles.add(spec.toward);
}

for (const spec of Object.values(STATE_LAYER_TOKENS)) {
  roles.add(spec.role);
  if (spec.into !== undefined && spec.into !== null) roles.add(spec.into);
}

const known = [...ROLE_ORDER, ...FIXED_ROLE_ORDER];
const unknown = [...roles].filter((role) => !known.includes(role));
const ordered = known.filter((role) => roles.has(role));
const unused = known.filter((role) => !roles.has(role));

console.log('已引用角色数：', roles.size);
console.log('已声明命中数：', ordered.length);
console.log('未引用角色：', unused.length ? unused.join('、') : '无');
console.log('未声明角色：', unknown.length ? unknown.join('、') : '无');
