/**
 * 打包发布用的 Client 端脚本。
 *
 * Harness 通过 `window.__ModuleLoader__.load({ id, factory })` 加载浏览器产物。
 * factory 收到的 `require` 只能解析宿主暴露的模块（`react`），不解析相对路径，
 * 产物也不走 ESM 加载流程。因此 `plugin/client.js` 必须是一个自包含脚本。
 *
 * 本脚本按 MODULES 的顺序拼接 `src/` 下的 ESM 源码：移除 import 声明和 export
 * 关键字，其余内容原样保留。`src/client/main.js` 排在最后，提供 applyClient(ctx)，
 * 由文件末尾的包装交给加载器。
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

/** 拼接顺序即模块依赖顺序，被依赖的模块排在前。 */
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
    // 本仓库只用单行 import；出现跨行写法时报错，避免未剥离的 import 进入产物。
    if (IMPORT_LINE.test(line)) {
      if (!line.includes(';')) skippingImport = true;
      continue;
    }
    if (line.includes('import ') && /^\s*import\b/u.test(line)) {
      throw new Error(`${path}：本打包脚本不支持跨行 import`);
    }
    if (EXPORT_LIST.test(line)) continue;
    out.push(line.replace(EXPORT_DECL, ''));
  }

  const body = out.join('\n');
  if (/^\s*(?:import|export)\b/mu.test(body)) {
    throw new Error(`${path}：剥完之后还剩 import/export`);
  }
  return body.trim();
}

const parts = [];
for (const modulePath of MODULES) {
  const absolute = resolve(REPO, modulePath);
  const source = await readFile(absolute, 'utf8');
  parts.push(`/* ---- ${relative(REPO, absolute).replaceAll('\\', '/')} ---- */\n${stripModule(source, modulePath)}`);
}

const wrapper = `/* 由 build/bundle-client.mjs 生成，不要手改。 */
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

// 生成后先做语法校验，确保产物能被浏览器解析。
try {
  // eslint-disable-next-line no-new-func
  new Function(wrapper);
} catch (error) {
  throw new Error(`生成的 client.js 解析失败：${error.message}`);
}

for (const required of ['window.__ModuleLoader__.load', 'applyClient', 'buildTokenMap']) {
  if (!wrapper.includes(required)) {
    throw new Error(`生成的 client.js 里没有 "${required}"`);
  }
}

const bytes = Buffer.byteLength(wrapper, 'utf8');
console.log(`已写出 ${OUT_FILE}（${bytes} 字节）`);
console.log(`模块数=${MODULES.length} 解析=通过`);
