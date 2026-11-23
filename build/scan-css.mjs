/**
 * 排查工具：在本地 `app.asar` 中检索匹配指定声明模式与选择器的 CSS 规则。
 *
 *   node build/scan-css.mjs <body-pattern> [selector-pattern] [limit]
 */

import { readFileSync } from 'node:fs';

// 需通过环境变量指定本地 DeepSeek Harness 的 app.asar 路径，例如：
//   $env:DSH_ASAR = '<install>/resources/app.asar'
const ASAR = process.env.DSH_ASAR;
if (!ASAR) {
  throw new Error('请先设置环境变量 DSH_ASAR 为本地 app.asar 路径');
}
const buffer = readFileSync(ASAR);

const headerSize = buffer.readUInt32LE(12);
const tree = JSON.parse(buffer.subarray(16, 16 + headerSize).toString('utf8'));
const dataOffset = 16 + Math.ceil(headerSize / 4) * 4;

/** 将 ASAR 目录树展开为 [路径, 条目] 列表。 */
function walk(node, prefix, out) {
  for (const [name, entry] of Object.entries(node.files ?? {})) {
    const path = `${prefix}/${name}`;
    if (entry.files) walk(entry, path, out);
    if (typeof entry.size === 'number' && !Number.isNaN(Number(entry.offset))) {
      out.push([path, entry]);
    }
  }
  return out;
}

const entries = walk(tree, '', []);
const cssFiles = entries.filter(([path]) => path.endsWith('.css'));
process.stdout.write(`CSS 文件数：${cssFiles.length}\n`);

const pattern = new RegExp(process.argv[2] ?? 'border', 'u');
const selectorFilter = new RegExp(process.argv[3] ?? '.', 'u');

let shown = 0;
for (const [path, entry] of cssFiles) {
  const start = dataOffset + Number(entry.offset);
  const css = buffer.subarray(start, start + entry.size).toString('utf8');
  const ruleRe = /([^{}]+)\{([^{}]*)\}/gu;
  let match;
  while ((match = ruleRe.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2];
    if (!pattern.test(body)) continue;
    if (!selectorFilter.test(selector)) continue;
    process.stdout.write(`\n${path.split('/').pop()}\n  ${selector.slice(-140)}\n  ${body.trim().slice(0, 220)}\n`);
    if (++shown >= Number(process.argv[4] ?? 20)) process.exit(0);
  }
}
process.stdout.write(`\n匹配规则数：${shown}\n`);
