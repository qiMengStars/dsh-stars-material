/**
 * Print which Material 3 roles the token tables actually reference.
 *
 * A development aid, not a pipeline step: `build/validate-coverage.mjs` is what
 * enforces coverage. Use this when adding a role to `palette-spec.js` and you
 * want to know whether anything consumes it, or when a role is dropped and some
 * table still points at it.
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

console.log('roles referenced: ', roles.size);
console.log('kept (ordered):   ', ordered.length);
console.log('unused:           ', unused.length ? unused.join(', ') : 'none');
console.log('unknown:          ', unknown.length ? unknown.join(', ') : 'none');
