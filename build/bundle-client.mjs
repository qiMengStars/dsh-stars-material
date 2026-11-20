/**
 * 打包发出去的 Client 半边。
 *
 * Harness 通过 `window.__ModuleLoader__.load({ id, factory })` 加载插件的浏览器产物，
 * factory 拿到的 `require` 是 CommonJS 形状，但只解析宿主暴露的运行时模块（`react`），
 * 不解析相对路径；打包文件也没有 ESM 流水线可走。所以 `plugin/client.js` 必须是一个
 * 自包含的单一脚本。
 *
 * 这个脚本把 `src/` 下的普通 ESM 源码拼成那一个文件。转换刻意做得很笨、很好核对：
 *
 *   - 丢掉 `import ... from '...';`（顺序改由下面的 MODULES 手工指定，且各模块之间
 *     名字不重复）；
 *   - 去掉声明行开头的 `export `；
 *   - 其余原样抄过去。
 *
 * `src/client/main.js` 是最后一个模块：它定义 `applyClient(ctx)`，下面的包装把它交给
 * 加载器。
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

/** 顺序有讲究：后面的模块会读前面声明过的名字。 */
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
    // 本仓库只写单行 import。这个判断是为了：真出现跨行 import 时立刻报错，而不是让
    // `import` 悄悄漏进产物里，那会在加载时报语法错误。
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

// 宁可构建失败，也别发出一个浏览器解析不了的脚本。
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
