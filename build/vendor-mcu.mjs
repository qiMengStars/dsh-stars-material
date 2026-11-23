/**
 * 从已安装的 `@material/material-color-utilities` 重建 `vendor/material-color-utilities/` 副本。
 *
 * 上游包在相对 import/export 中省略了 `.js` 后缀，Node ESM 加载会报错；本脚本复制源码并
 * 自动补齐 `.js` 后缀，同时附带 `LICENSE` 与 `package.json`。生成的副本供
 * `build/generate-palettes.mjs`（构建期预设）与 `build/bundle-host.mjs`（Host 端运行时依赖）共同使用。
 *
 *   cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
 *   node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
 */

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const TARGET = resolve(REPO, 'vendor/material-color-utilities');
const ARGUMENT = process.argv[2];

if (ARGUMENT === undefined) {
  process.stderr.write('缺少包目录参数：node build/vendor-mcu.mjs <package-dir>\n');
  process.exit(1);
}

const SOURCE = resolve(REPO, ARGUMENT);

try {
  await stat(join(SOURCE, 'index.js'));
} catch {
  process.stderr.write('未找到 Material Color Utilities 包（缺少 index.js）：' + SOURCE + '\n');
  process.stderr.write('用法：node build/vendor-mcu.mjs <package-dir>\n');
  process.exit(1);
}

const RELATIVE = /(from\s*|import\s*|export\s*\*\s*from\s*)(['"])(\.\.?\/[^'"]*)\2/g;
const BARE = /^(\s*import\s*)(['"])(\.\.?\/[^'"]*)\2/gm;
const HAS_EXTENSION = /\.(js|json|mjs|cjs)$/;

function addExtensions(source) {
  return source
    .replace(RELATIVE, (match, keyword, quote, specifier) =>
      HAS_EXTENSION.test(specifier) ? match : keyword + quote + specifier + '.js' + quote,
    )
    .replace(BARE, (match, keyword, quote, specifier) =>
      HAS_EXTENSION.test(specifier) ? match : keyword + quote + specifier + '.js' + quote,
    );
}

async function walk(dir, relativePath = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    const relative = relativePath === '' ? entry.name : relativePath + '/' + entry.name;
    if (entry.isDirectory()) {
      await walk(absolute, relative);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;
    const source = await readFile(absolute, 'utf8');
    const patched = addExtensions(source);
    const target = join(TARGET, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, patched, 'utf8');
    if (patched !== source) patchedCount += 1;
    fileCount += 1;
  }
}

let fileCount = 0;
let patchedCount = 0;

await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });
await walk(SOURCE);
for (const extra of ['LICENSE', 'package.json']) {
  await cp(join(SOURCE, extra), join(TARGET, extra));
}

process.stdout.write('已复制 ' + fileCount + ' 个 .js 文件（其中补齐后缀 ' + patchedCount + ' 个）\n');
process.stdout.write('输出目录：' + TARGET + '\n');
