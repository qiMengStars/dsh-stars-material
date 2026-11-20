/**
 * 打包 Host 端的配色库。
 *
 *   node build/bundle-host.mjs
 *
 * Host 端需要 Material Color Utilities 实现（用于从系统强调色推导配色）和配色引擎，
 * Client 端不携带这两项。本脚本将其复制到 `plugin/lib/`，使发布包自带依赖，
 * 安装时无需 `node_modules`。
 *
 * 与 `build/bundle-client.mjs` 不同，本脚本不做源码拼接：Host 产物保持为普通 Node ESM
 * 模块图，`import` 声明原样保留，各模块作用域独立。
 *
 * 产物：
 *   plugin/lib/mcu/index.js      vendored 库的入口
 *   plugin/lib/mcu/**            库的其余部分，`.js` 后缀保持不变
 *   plugin/lib/palette.js        配色引擎、角色表与 MCU 命名空间合成的单一模块
 *   plugin/lib/mcu/LICENSE       Apache-2.0 许可证，再分发时必须附带
 */

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const VENDOR = resolve(REPO, 'vendor/material-color-utilities');
const LIB = resolve(REPO, 'plugin/lib');
const MCU_OUT = resolve(LIB, 'mcu');

/**
 * 复制到发布包中的 vendored 库条目。
 *
 * 整树复制而非筛选子集：`index.js` 会再导出每个目录，裁剪子集需要改动第三方入口文件。
 * 这些代码仅在 Host 端运行，整树约 340 KB；维护手工子集会随间接 import 变化而失效。
 */
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

/** 读取模块源码，将相对 import 路径改写为在 `plugin/lib` 中可解析的形式。 */
function rewriteSpecifiers(source, moduleResolver) {
  return source.replace(
    /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.\.?\/[^'"]+)\2/gu,
    (whole, head, quote, specifier) => {
      const resolved = moduleResolver(specifier);
      return resolved === null ? whole : head + quote + resolved + quote;
    },
  );
}

async function main() {
  await rm(MCU_OUT, { recursive: true, force: true });
  await mkdir(MCU_OUT, { recursive: true });

  // 1. 原样复制 vendored 库。该版本已由 build/vendor-mcu.mjs 打过补丁，
  //    每个相对 import 均带 `.js` 后缀。
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

  // 2. 生成配色模块：合并角色表、配色引擎，以及引擎依赖的 MCU 命名空间。
  const spec = await readFile(resolve(REPO, 'src/parts/palette-spec.js'), 'utf8');
  const engine = await readFile(resolve(REPO, 'src/parts/palette-engine.js'), 'utf8');

  const strip = (source) =>
    source
      .replace(/^\s*import\s[\s\S]*?;\s*$/gmu, '')
      .replace(/^export\s+(?=(?:const|let|var|function|class|async)\b)/gmu, '');

  const palette = `/**
 * Host 端的配色引擎 —— 由 build/bundle-host.mjs 生成。
 *
 * 本模块合并角色表、配色引擎，以及引擎依赖的 Material Color Utilities 命名空间，
 * 三者必须彼此一致。重新生成时执行：
 *
 *   node build/bundle-host.mjs
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
