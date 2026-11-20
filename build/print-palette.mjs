// 打印一份配色的完整「角色 → 十六进制」表，用来把截图里的某个颜色归到确切的
// Material 3 角色上。
//
// 它读的是随包发出去的 Host 引擎，而不是生成的预设表，所以只有运行中的 harness 才知道
// 的种子色（系统强调色）也能用产品同一条代码路径导出来。
//
//   node build/print-palette.mjs '#6750a4' light
//   node build/print-palette.mjs baseline dark
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cwd = process.cwd();
const spec = await import(pathToFileURL(resolve(cwd, 'src/parts/palette-spec.js')).href);
const host = await import(pathToFileURL(resolve(cwd, 'plugin/lib/palette.js')).href);

const engine = host.createPaletteEngine(host.mcu);
const roles = [...spec.ROLE_ORDER, 'surfaceTint', ...spec.FIXED_ROLE_ORDER];

const requested = process.argv[2] ?? spec.DEFAULT_PRESET;
const scheme = process.argv[3] ?? 'light';

const known = new Map(spec.PRESETS.map((preset) => [preset.id, preset.hex]));
const seed = known.get(requested) ?? requested;
if (!/^#[0-9a-f]{6}$/iu.test(seed)) {
  process.stderr.write(`既不是预设 id 也不是 #rrggbb 种子色：${requested}\n`);
  process.exit(1);
}

const palette = engine.paletteFromSeed(seed);
const packed = scheme === 'dark' ? palette.dark : palette.light;
const lines = roles.map((role, i) => `${('#' + packed.slice(i * 6, i * 6 + 6)).toLowerCase()}  ${role}`);
process.stdout.write(lines.sort().join('\n') + '\n');
