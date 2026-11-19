/**
 * Refresh the vendored Material Color Utilities copy.
 *
 * The published package is ESM whose relative imports omit the `.js`
 * extension, which Node refuses to resolve, so the repository keeps a patched
 * copy under `vendor/material-color-utilities`. This script reproduces it from
 * a freshly installed package. Install the package anywhere writable (a scratch
 * directory outside the repo is fine) and pass its path:
 *
 *   cmd /c "npm install @material/material-color-utilities@0.4.0 --no-audit --no-fund --ignore-scripts --cache %TEMP%\mcu-cache --prefix %TEMP%\mcu"
 *   node build/vendor-mcu.mjs %TEMP%\mcu\node_modules\@material\material-color-utilities
 *
 * With no argument it falls back to `.tmp/mcu/node_modules/@material/material-color-utilities`
 * for convenience. The vendored tree it writes is what
 * `build/generate-palettes.mjs` loads, so the palette pipeline needs nothing
 * outside the repository. Material Color Utilities is Apache-2.0; its LICENSE
 * file is copied alongside.
 */

import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const TARGET = resolve(REPO, 'vendor/material-color-utilities');
const SOURCE = resolve(
  REPO,
  process.argv[2] ?? '.tmp/mcu/node_modules/@material/material-color-utilities',
);

try {
  await stat(join(SOURCE, 'index.js'));
} catch {
  process.stderr.write('no Material Color Utilities package at ' + SOURCE + '\n');
  process.stderr.write('pass its path: node build/vendor-mcu.mjs <package-dir>\n');
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

process.stdout.write('vendored ' + fileCount + ' files, patched ' + patchedCount + '\n');
process.stdout.write('into ' + TARGET + '\n');
