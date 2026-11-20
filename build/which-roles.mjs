/**
 * 打印令牌表引用的 Material 3 角色。
 *
 * 开发期辅助工具，不属于校验流水线；覆盖门禁由 `build/validate-coverage.mjs` 执行。
 * 本脚本汇总 `src/parts/token-map.js` 中各类令牌引用的角色，与
 * `src/parts/palette-spec.js` 声明的角色表比对，列出被引用、未使用和未声明的角色。
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

console.log('被引用角色数：', roles.size);
console.log('保留（按顺序）：', ordered.length);
console.log('未使用：', unused.length ? unused.join('、') : '无');
console.log('未声明：', unknown.length ? unknown.join('、') : '无');
