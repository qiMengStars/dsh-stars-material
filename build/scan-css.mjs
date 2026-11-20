/**
 * 一次性的排查工具：列出仍然画着边框的 CSS 规则。
 *
 * 只读取已安装的 app.asar，作用是让主题作者能确认截图里看到的那条边框确实来自某条本
 * 主题没清掉的规则，而不是靠猜。
 */

import { readFileSync } from 'node:fs';

// 指向你自己机器上已安装的 Harness 包：
//   $env:DSH_ASAR = '<install>/resources/app.asar'
const ASAR = process.env.DSH_ASAR;
if (!ASAR) {
  throw new Error('运行前请把 DSH_ASAR 设成已安装的 app.asar 路径');
}
const buffer = readFileSync(ASAR);

const headerSize = buffer.readUInt32LE(12);
const tree = JSON.parse(buffer.subarray(16, 16 + headerSize).toString('utf8'));
const dataOffset = 16 + Math.ceil(headerSize / 4) * 4;

/** 把 asar 的目录树摊平成一组好读的 [路径, 条目] 对。 */
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
process.stdout.write(`css 文件数：${cssFiles.length}\n`);

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
process.stdout.write(`\n命中：${shown}\n`);
