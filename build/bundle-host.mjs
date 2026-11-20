/**
 * 打包 Host 端的配色库。
 *
 *   node build/bundle-host.mjs
 *
 * Host 半边需要两样 Client 半边不能有的东西：Material Color Utilities 的实现（用来
 * 从系统强调色推导配色）和配色引擎。两样都抄进 `plugin/lib/`，这样发出去的包自带
 * 依赖，不需要 `node_modules` 也能装。
 *
 * 和 `build/bundle-client.mjs` 不同，这里不做拼接：Host 半边就是一个普通的 Node ESM
 * 模块图，`import` 能用，每个文件也各自保留作用域。
 *
 * 产物：
 *   plugin/lib/mcu/index.js      vendored 库的入口
 *   plugin/lib/mcu/**            库的其余部分，`.js` 后缀保持不变
 *   plugin/lib/palette.js        引擎 + 角色表 + MCU，合成一个模块
 *   plugin/lib/mcu/LICENSE       Apache-2.0，再分发必须带上
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
 * 抄进包里的条目。
 *
 * 整棵树照抄，不挑子集：`index.js` 会把每个目录都再导出一遍，裁剪就等于要改第三方
 * 的入口文件。这些是只在 Host 跑的代码（永远不进浏览器），整棵树约 340 KB，比手工
 * 维护一份子集便宜——那种子集会在某个间接 import 出现时悄悄坏掉。
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

/** 读一个模块，把它的相对路径改写成在 `plugin/lib` 里也能解析的形式。 */
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

  // 1. 原样抄库。它已经是打过补丁的版本，每个相对 import 都带 `.js`——那份是
  //    `build/vendor-mcu.mjs` 生成的。
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

  // 2. 生成配色模块：角色表、引擎，以及引擎所依赖的 MCU 命名空间。
  const spec = await readFile(resolve(REPO, 'src/parts/palette-spec.js'), 'utf8');
  const engine = await readFile(resolve(REPO, 'src/parts/palette-engine.js'), 'utf8');

  const strip = (source) =>
    source
      .replace(/^\s*import\s[\s\S]*?;\s*$/gmu, '')
      .replace(/^export\s+(?=(?:const|let|var|function|class|async)\b)/gmu, '');

  const palette = `/**
 * Host 端的配色引擎 —— 由 build/bundle-host.mjs 生成。
 *
 * 拼起三样必须彼此一致的东西：角色表、引擎，以及引擎赖以构建的 Material Color
 * Utilities 命名空间。要重新生成就跑：
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
