// 把截图归属需要的「角色 → 十六进制」表直接写到磁盘。
//
// 这个沙箱里 pwsh 没法给 node 加重定向或管道，所以表由 node 自己写文件。
//
//   node build/dump-palette.mjs '#6750a4'      -> %TEMP%/m3-live-light.txt、-dark.txt
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
  process.stderr.write(`既不是预设 id 也不是 #rrggbb 种子色：${requested}\n`);
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
process.stdout.write(`种子色 ${seed}（${requested}）\n`);
