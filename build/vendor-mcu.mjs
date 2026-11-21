/**
 * 重新生成 vendor 目录下的 Material Color Utilities 副本。
 *
 * 上游包为 ESM，相对 import 不带 `.js` 后缀，Node 无法解析。仓库因此在
 * `vendor/material-color-utilities` 保留一份补齐后缀的副本，脚本从已安装的包复现：
 * 先将包安装到任意可写目录，再把包路径作为命令行参数传入。
 *
 *   cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
 *   node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
 *
 * 包路径必须显式给出，没有适用于所有机器的默认路径。生成的副本由
 * `build/generate-palettes.mjs` 加载，配色流水线不依赖仓库之外的文件。
 * Material Color Utilities 采用 Apache-2.0 许可证，LICENSE 一并复制。
 */

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const TARGET = resolve(REPO, 'vendor/material-color-utilities');
const ARGUMENT = process.argv[2];

if (ARGUMENT === undefined) {
  process.stderr.write('缺少已安装包的路径：node build/vendor-mcu.mjs <package-dir>\n');
  process.exit(1);
}

const SOURCE = resolve(REPO, ARGUMENT);

try {
  await stat(join(SOURCE, 'index.js'));
} catch {
  process.stderr.write('该路径下不存在 Material Color Utilities 包：' + SOURCE + '\n');
  process.stderr.write('请传入包目录：node build/vendor-mcu.mjs <package-dir>\n');
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

process.stdout.write('已复制 ' + fileCount + ' 个文件，改了 ' + patchedCount + ' 个\n');
process.stdout.write('到 ' + TARGET + '\n');
