/**
 * 打印令牌表实际引用了哪些 Material 3 角色。
 *
 * 这是开发时的小工具，不是流水线的一步：真正管覆盖的是
 * `build/validate-coverage.mjs`。往 `palette-spec.js` 里加角色时想知道有没有东西用它，
 * 或者删角色时想知道还有没有表指着它，就用这个。
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
console.log('没用到：', unused.length ? unused.join('、') : '无');
console.log('不认识的：', unknown.length ? unknown.join('、') : '无');
