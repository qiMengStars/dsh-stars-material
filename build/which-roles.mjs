import { ROLE_TOKENS, ALPHA_TOKENS, MIX_TOKENS, DIFF_TOKENS, ILLUSTRATION_TOKENS, EXTRA_TOKENS } from '../src/parts/token-map.js';
import { ROLE_ORDER, FIXED_ROLE_ORDER } from '../src/parts/palette-spec.js';

const roles = new Set();
for (const role of Object.values(ROLE_TOKENS)) roles.add(role);
for (const spec of Object.values(ALPHA_TOKENS)) {
  if (typeof spec === 'string') roles.add(spec);
  else if (spec.role) roles.add(spec.role);
  else if (spec.literal) roles.add(spec.literal);
}
for (const spec of Object.values(MIX_TOKENS)) {
  roles.add(spec.role);
  if (spec.into) roles.add(spec.into);
}
for (const spec of Object.values(DIFF_TOKENS)) {
  roles.add(spec.role);
  if (spec.toward) roles.add(spec.toward);
}
for (const role of Object.values(ILLUSTRATION_TOKENS)) roles.add(role);
for (const role of Object.values(EXTRA_TOKENS)) roles.add(role);

const known = [...ROLE_ORDER, ...FIXED_ROLE_ORDER];
const unknown = [...roles].filter((role) => !known.includes(role));
const ordered = known.filter((role) => roles.has(role));

console.log('roles referenced:', roles.size);
console.log('kept (ordered):', ordered.length, ordered.join(','));
console.log('unknown:', unknown.length ? unknown.join(',') : 'none');
console.log('dropped:', known.filter((role) => !roles.has(role)).join(','));
