/**
 * 从已安装的 app.asar 中重新抽取 vendored 的 DSH 令牌样式表。
 *
 *   node build/vendor-survey.mjs <path-to-app.asar>
 *
 * 数据来源为本地安装的 DeepSeek Harness，app.asar 路径须由命令行参数或环境变量
 * `DSH_ASAR` 显式指定，没有适用于所有机器的默认路径。抽取结果写入 `vendor/dsh-survey/`，
 * 由 `build/validate-coverage.mjs` 读取，覆盖校验不依赖能读取压缩包内部的 shell。
 *
 * ASAR 结构（pickled 头）：偏移 12 处为小端 uint32 `headerSize`；JSON 目录自偏移 16
 * 开始；正文自 `16 + ceil(headerSize / 4) * 4` 开始。缺少数值 `size`/`offset` 的条目
 * 是链接，应跳过。
 */

import { open, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = resolve(REPO, 'vendor/dsh-survey');

// 已安装 Harness 的 app.asar 路径，由环境变量 DSH_ASAR 指定。
const DEFAULT_ASAR = process.env.DSH_ASAR ?? '';

/** 原样抽取的文件，以及各自的保留依据。 */
const TARGETS = [
  {
    name: 'design-platform.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/design-platform.css'),
    why: '颜色令牌的权威定义：包含明暗两套的全部 --dsw-* 颜色令牌。',
  },
  {
    name: 'base.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/base.css'),
    why: '定义圆角刻度与字体族，形状映射须与此保持一致。',
  },
  {
    name: 'focus.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/focus.css'),
    why: '定义 --dsw-focus-ring-width 为 2px，与 Material 3 一致。',
  },
  {
    name: 'gradient-shadow-text.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/gradient-shadow-text.css'),
    why: '定义 --dsw-shadow-lv* 与 --dsw-elevation-*，其余样式表未定义这些属性。',
  },
];

/**
 * 抽取的样式表所遵循的许可协议。
 *
 * 这些样式表来自声明 `"license": "MIT"` 的 DeepSeek Harness 包，其 `LICENSE` 中
 * 包含以下声明原文。再分发时须附带该声明，因此每次运行都在输出目录重写一份 LICENSE，
 * 而不交由一次性手工步骤处理。
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

  /** 把 ASAR 目录树展开为 `{ path, offset, size }` 文件记录。 */
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

const readme = `# 从 DSH 抽取的令牌样式表

以下文件从已安装的 DeepSeek Harness \`app.asar\` 中原样抽取。重新生成时执行：

\`\`\`
node build/vendor-survey.mjs <path-to-app.asar>
\`\`\`

| 文件 | 字节 | 保留依据 |
| --- | --- | --- |
${rows}

\`build/validate-coverage.mjs\` 读取全部四份样式表。\`design-platform.css\` 定义产品使用的
颜色令牌集合，其中令牌不得缺失；四份样式表的并集定义实际存在的令牌名称集合，
不得凭空编造名称。

## 许可协议

这些样式表抽取自 DeepSeek Harness 的包，其许可协议为 MIT（\`Copyright (c) 2026 DeepSeek\`）。
协议要求的声明保存在同目录的 [LICENSE](LICENSE) 中，每次运行本脚本都会重写该文件。

## DSH 前端构建变更后

1. \`node build/vendor-survey.mjs <path-to-app.asar>\`
2. \`node build/validate-coverage.mjs\`：令牌被重命名、新增或删除时以非零状态退出。
3. 依据校验结果更新 \`src/parts/token-map.js\`。
4. \`node build/verify.mjs\`，随后重新安装插件。

编译后的前端包（\`dist/assets/index-*.css\`，约 92 KB）不予抽取：该文件为构建产物，
其引用的令牌均在以上四份样式表中声明。
`;

await writeFile(join(OUT_DIR, 'README.md'), readme, 'utf8');
await writeFile(join(OUT_DIR, 'LICENSE'), UPSTREAM_LICENCE, 'utf8');

console.log(`来源 ${asarPath}`);
for (const { name, bytes } of written) console.log(`  ${name}：${bytes} 字节`);
console.log(`已写出 ${join(OUT_DIR, 'README.md')}`);
console.log(`已写出 ${join(OUT_DIR, 'LICENSE')}`);
