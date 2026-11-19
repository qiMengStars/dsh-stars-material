// Print the full role -> hex table for one palette, so screen colours found in
// a screenshot can be attributed to an exact Material 3 role.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const palettes = await import(pathToFileURL(resolve(cwd, 'src/generated/palettes.js')).href);
const seed = process.argv[2] ?? 'deepseek';
const variant = process.argv[3] ?? 'tonalSpot';
const scheme = process.argv[4] ?? 'light';

const { ROLES, PALETTES } = palettes;
const packed = PALETTES[seed][variant][scheme];
const lines = ROLES.map((role, i) => `${('#' + packed.slice(i * 6, i * 6 + 6)).toLowerCase()}  ${role}`);
process.stdout.write(lines.sort().join('\n') + '\n');
