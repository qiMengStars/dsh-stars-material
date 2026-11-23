/**
 * 将指定种子色或预设 ID 生成的明暗两套配色表导出为临时文件，供截图分析脚本读取。
 *
 *   node build/dump-palette.mjs '#6750a4'
 *   node build/dump-palette.mjs baseline
 *
 * 输出文件位于系统临时目录：`m3-live-light.txt` 与 `m3-live-dark.txt`（每行 `<#rrggbb>  <role>`）。
 */
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
  process.stderr.write(`参数须为有效的预设 ID 或 #rrggbb 色值：${requested}\n`);
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
process.stdout.write(`种子色：${seed}（参数：${requested}）\n`);
