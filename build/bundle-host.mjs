/**
 * 打包 Host 端运行时依赖（`plugin/lib/`）。
 *
 * 将 `vendor/material-color-utilities` 复制到 `plugin/lib/mcu/`，并将配色规格与引擎
 * 合并为 `plugin/lib/palette.js`，使插件安装后无需额外 `node_modules` 即可在运行时
 * 根据系统强调色或自定义种子色推导配色。
 *
 *   node build/bundle-host.mjs
 */

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const VENDOR = resolve(REPO, 'vendor/material-color-utilities');
const LIB = resolve(REPO, 'plugin/lib');
const MCU_OUT = resolve(LIB, 'mcu');

/** 随插件包完整复制的 Material Color Utilities 目录条目，避免手工裁剪导致间接引用失效。 */
const KEEP = [
  'index.js',
  'LICENSE',
  'blend',
  'contrast',
  'dislike',
  'dynamiccolor',
  'hct',
  'palettes',
  'quantize',
  'scheme',
  'score',
  'temperature',
  'utils',
];

async function main() {
  await rm(MCU_OUT, { recursive: true, force: true });
  await mkdir(MCU_OUT, { recursive: true });

  // 1. 复制已补全 ESM `.js` 后缀的 Material Color Utilities 源码。
  for (const name of KEEP) {
    await cp(resolve(VENDOR, name), resolve(MCU_OUT, name), { recursive: true });
  }

  await writeFile(
    resolve(MCU_OUT, 'package.json'),
    JSON.stringify(
      {
        name: 'material-color-utilities-vendored',
        version: '0.4.0',
        private: true,
        type: 'module',
        main: 'index.js',
        license: 'Apache-2.0',
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  // 2. 合并配色规格、配色引擎与 MCU 命名空间为单一 ESM 模块。
  const spec = await readFile(resolve(REPO, 'src/parts/palette-spec.js'), 'utf8');
  const engine = await readFile(resolve(REPO, 'src/parts/palette-engine.js'), 'utf8');

  const strip = (source) =>
    source
      .replace(/^\s*import\s[\s\S]*?;\s*$/gmu, '')
      .replace(/^export\s+(?=(?:const|let|var|function|class|async)\b)/gmu, '');

  const palette = `/**
 * Host 端配色模块 —— 由 build/bundle-host.mjs 自动生成，请勿手动修改。
 * 合并了 src/parts/palette-spec.js、src/parts/palette-engine.js 与 ./mcu/index.js。
 */

import * as mcu from './mcu/index.js';

${strip(spec)}

${strip(engine)}

export { createPaletteEngine, ROLE_ORDER, FIXED_ROLE_ORDER, PRESETS, DEFAULT_PRESET };
export { mcu };
`;

  await mkdir(LIB, { recursive: true });
  await writeFile(resolve(LIB, 'palette.js'), palette, 'utf8');

  const bytes = Buffer.byteLength(palette, 'utf8');
  console.log(`已写出 ${resolve(LIB, 'mcu')}/（${KEEP.length} 项）`);
  console.log(`已写出 ${resolve(LIB, 'palette.js')}（${bytes} 字节）`);
}

await main();
