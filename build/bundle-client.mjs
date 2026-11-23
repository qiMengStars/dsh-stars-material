/**
 * 打包发布用的 Client 端浏览器脚本（`plugin/client.js`）。
 *
 * 宿主通过 `window.__ModuleLoader__.load({ id, factory })` 加载浏览器插件，
 * `factory` 内的 `require` 仅提供 `react` 且不执行 ESM 模块解析。因此本脚本按依赖顺序
 * 拼接 `MODULES`，剥离顶层 `import`/`export` 语句，生成单一自包含文件。
 *
 *   node build/bundle-client.mjs
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = resolve(REPO, 'plugin');
const OUT_FILE = resolve(OUT_DIR, 'client.js');

/** 按依赖顺序排列的源码模块，被依赖项排在前面。 */
const MODULES = [
  'src/generated/palettes.js',
  'src/parts/palette-spec.js',
  'src/parts/token-map.js',
  'src/client/stylesheet.js',
  'src/client/main.js',
];

const PACKAGE_ID = 'dsh-stars-material';

const IMPORT_LINE = /^\s*import\s[\s\S]*?;\s*$/u;
const EXPORT_DECL = /^export\s+(?=(?:const|let|var|function|class|async)\b)/u;
const EXPORT_LIST = /^export\s*\{[^}]*\}\s*;?\s*$/u;

function stripModule(source, path) {
  const out = [];
  const lines = source.split('\n');
  let skippingImport = false;

  for (const line of lines) {
    if (skippingImport) {
      if (line.includes(';')) skippingImport = false;
      continue;
    }
    // 仅处理单行 import 声明，遇到多行写法直接报错以免残留在产物中。
    if (IMPORT_LINE.test(line)) {
      if (!line.includes(';')) skippingImport = true;
      continue;
    }
    if (line.includes('import ') && /^\s*import\b/u.test(line)) {
      throw new Error(`${path}：打包脚本暂不支持多行 import 语法`);
    }
    if (EXPORT_LIST.test(line)) continue;
    out.push(line.replace(EXPORT_DECL, ''));
  }

  const body = out.join('\n');
  if (/^\s*(?:import|export)\b/mu.test(body)) {
    throw new Error(`${path}：剥离后仍残留 import/export 语句`);
  }
  return body.trim();
}

const parts = [];
for (const modulePath of MODULES) {
  const absolute = resolve(REPO, modulePath);
  const source = await readFile(absolute, 'utf8');
  parts.push(`/* ---- ${relative(REPO, absolute).replaceAll('\\', '/')} ---- */\n${stripModule(source, modulePath)}`);
}

const wrapper = `/* 由 build/bundle-client.mjs 自动生成，请勿手动修改。 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(PACKAGE_ID)},
  factory: (require) => {
    'use strict';

    const React = require('react');
    const h = React.createElement;

${parts.join('\n\n')}

    return {
      inject: ['slots', 'locale', 'theme'],
      apply: applyClient,
    };
  },
});
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, wrapper, 'utf8');

// 通过 Function 构造器校验生成产物的 JS 语法合法性。
try {
  // eslint-disable-next-line no-new-func
  new Function(wrapper);
} catch (error) {
  throw new Error(`生成的 client.js 存在语法错误：${error.message}`);
}

for (const required of ['window.__ModuleLoader__.load', 'applyClient', 'buildTokenMap']) {
  if (!wrapper.includes(required)) {
    throw new Error(`生成的 client.js 缺少必要标识 "${required}"`);
  }
}

const bytes = Buffer.byteLength(wrapper, 'utf8');
console.log(`已写出 ${OUT_FILE}（${bytes} 字节）`);
console.log(`模块数=${MODULES.length} 解析=通过`);
