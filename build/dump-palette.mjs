// Write the role -> hex tables a screenshot attribution needs, straight to disk.
//
// `pwsh` cannot wrap `node` in a redirection or pipe in this sandbox, so the
// tables are written by node itself.
//
//   node build/dump-palette.mjs '#6750a4'      -> %TEMP%/m3-live-light.txt, -dark.txt
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const spec = await import(pathToFileURL(resolve(cwd, 'src/parts/palette-spec.js')).href);
const host = await import(pathToFileURL(resolve(cwd, 'plugin/lib/palette.js')).href);

const engine = host.createPaletteEngine(host.mcu);
const roles = [...spec.ROLE_ORDER, 'surfaceTint', ...spec.FIXED_ROLE_ORDER];

const requested = process.argv[2] ?? spec.DEFAULT_PRESET;
const known = new Map(spec.PRESETS.map((preset) => [preset.id, preset.hex]));
const seed = known.get(requested) ?? requested;
if (!/^#[0-9a-f]{6}$/iu.test(seed)) {
  process.stderr.write(`not a preset id or #rrggbb seed: ${requested}\n`);
  process.exit(1);
}

const palette = engine.paletteFromSeed(seed);
for (const scheme of ['light', 'dark']) {
  const packed = scheme === 'dark' ? palette.dark : palette.light;
  const lines = roles.map((role, i) => `${('#' + packed.slice(i * 6, i * 6 + 6)).toLowerCase()}  ${role}`);
  const file = join(tmpdir(), `m3-live-${scheme}.txt`);
  writeFileSync(file, lines.sort().join('\n') + '\n');
  process.stdout.write(`${file}\n`);
}
process.stdout.write(`seed ${seed} (${requested})\n`);
