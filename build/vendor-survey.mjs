/**
 * 从已安装的 app.asar 里重新抽出 vendored 的 DSH 令牌样式表。
 *
 *   node build/vendor-survey.mjs <path-to-app.asar>
 *
 * 源头是你自己装的那份 DeepSeek Harness，所以必须在命令行里给出（或放进 `DSH_ASAR`），
 * 没有哪个默认值在别人的机器上是对的。抽出来的文件落在 `vendor/dsh-survey/`，由
 * `build/validate-coverage.mjs` 读取，这样覆盖门禁不需要一个能读压缩包内部的 shell 也能
 * 跑。
 *
 * ASAR 的结构（pickled 头）：`headerSize` 在偏移 12 处，是小端 uint32；JSON 目录从偏移
 * 16 开始；正文从 `16 + ceil(headerSize / 4) * 4` 开始。没有数值 `size`/`offset` 的条目
 * 是链接不是文件，要跳过。
 */

import { open, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = resolve(REPO, 'vendor/dsh-survey');

// 已安装的 Harness 把包放在哪，各机器不同。把路径作为第一个参数传进来，或设 DSH_ASAR。
const DEFAULT_ASAR = process.env.DSH_ASAR ?? '';

/** 原样抄出来的文件，以及每个为什么值得留。 */
const TARGETS = [
  {
    name: 'design-platform.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/design-platform.css'),
    why: '唯一的颜色权威：明暗两套的全部 --dsw-* 颜色令牌。',
  },
  {
    name: 'base.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/base.css'),
    why: '圆角刻度和字体族，形状映射必须与它一致。',
  },
  {
    name: 'focus.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/focus.css'),
    why: '证明 --dsw-focus-ring-width 本来就是 2px，也就是本来就符合 M3。',
  },
  {
    name: 'gradient-shadow-text.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/gradient-shadow-text.css'),
    why: '声明了 --dsw-shadow-lv* 和 --dsw-elevation-*，别的样式表都没定义它们。',
  },
];

/**
 * 抽出来的这几份样式表所遵循的协议。
 *
 * 它们来自 DeepSeek Harness 的包，那些包声明 `"license": "MIT"`，并在自己的 `LICENSE`
 * 里逐字带着这段文字。只抄文件不抄声明，就成了缺少 MIT 所要求声明的再分发，所以每次运行
 * 都在旁边重写一份，而不是留给某个一次性的手工步骤。
 */
const UPSTREAM_LICENCE = `MIT License

Copyright (c) 2026 DeepSeek

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

async function readAsar(asarPath) {
  const handle = await open(asarPath, 'r');
  const size = (await handle.stat()).size;

  const head = Buffer.alloc(16);
  await handle.read(head, 0, 16, 0);
  const headerSize = head.readUInt32LE(12);

  const header = Buffer.alloc(headerSize);
  await handle.read(header, 0, headerSize, 16);
  const directory = JSON.parse(header.toString('utf8').replace(/\0+$/u, ''));

  const dataOffset = 16 + Math.ceil(headerSize / 4) * 4;

  /** 把目录树摊平成 `{ path, offset, size }` 的文件记录。 */
  const files = [];
  const walk = (node, prefix) => {
    for (const [name, entry] of Object.entries(node.files ?? {})) {
      const path = prefix === '' ? name : prefix + '/' + name;
      if (entry.files !== undefined) {
        walk(entry, path);
        continue;
      }
      const offset = Number(entry.offset);
      if (typeof entry.size !== 'number' || Number.isNaN(offset)) continue;
      files.push({ path, offset, size: entry.size });
    }
  };
  walk(directory, '');

  return {
    size,
    files,
    async read(record) {
      const buffer = Buffer.alloc(record.size);
      await handle.read(buffer, 0, record.size, dataOffset + Number(record.offset));
      return buffer;
    },
    close: () => handle.close(),
  };
}

const asarPath = resolve(process.argv[2] ?? DEFAULT_ASAR);
if (asarPath === '') {
  throw new Error('请传入已安装的 app.asar 路径，或把 DSH_ASAR 设成它');
}
const asar = await readAsar(asarPath);

await mkdir(OUT_DIR, { recursive: true });

const written = [];
for (const target of TARGETS) {
  const record = asar.files.find((file) => target.match(file.path));
  if (record === undefined) {
    throw new Error(`app.asar 里找不到 ${target.name}`);
  }
  const bytes = await asar.read(record);
  await writeFile(join(OUT_DIR, target.name), bytes);
  written.push({ name: target.name, bytes: bytes.length });
}

await asar.close();

const rows = TARGETS.map((target, index) => {
  const { name, bytes } = written[index];
  return `| \`${name}\` | ${bytes} | ${target.why} |`;
}).join('\n');

const readme = `# 从 DSH 抽出来的令牌样式表

从已安装的 DeepSeek Harness \`app.asar\` 里原样取出。要重新生成就跑：

\`\`\`
node build/vendor-survey.mjs <path-to-app.asar>
\`\`\`

| 文件 | 字节 | 为什么要留 |
| --- | --- | --- |
${rows}

\`build/validate-coverage.mjs\` 四份都读。\`design-platform.css\` 给出产品保证会读的颜色
令牌集合（所以一个都不能缺）；四份的并集给出真实存在的名字集合（所以一个都不能编）。

## 协议

这几份样式表抄自 DeepSeek Harness，它的包是 MIT（\`Copyright (c) 2026 DeepSeek\`）。
它要求的声明就在旁边的 [LICENSE](LICENSE) 里，每次运行这个脚本都会重写一遍。

## DSH 换了新的前端构建时

1. \`node build/vendor-survey.mjs <path-to-app.asar>\`
2. \`node build/validate-coverage.mjs\`——有令牌被改名、新增或删除就会以非零退出。
3. 按它报的东西更新 \`src/parts/token-map.js\`。
4. \`node build/verify.mjs\`，然后重装插件。

编译后的前端包（\`dist/assets/index-*.css\`，约 92 KB）是刻意不抄的：那是构建产物，而它
读到的每个令牌都在上面四份里声明过。
`;

await writeFile(join(OUT_DIR, 'README.md'), readme, 'utf8');
await writeFile(join(OUT_DIR, 'LICENSE'), UPSTREAM_LICENCE, 'utf8');

console.log(`来源 ${asarPath}`);
for (const { name, bytes } of written) console.log(`  ${name}：${bytes} 字节`);
console.log(`已写出 ${join(OUT_DIR, 'README.md')}`);
console.log(`已写出 ${join(OUT_DIR, 'LICENSE')}`);
