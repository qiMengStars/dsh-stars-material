/**
 * 从本地 DeepSeek Harness 的 `app.asar` 中抽取宿主参考样式表到 `vendor/dsh-survey/`。
 *
 *   node build/vendor-survey.mjs <path-to-app.asar>
 *
 * 可通过命令行参数或环境变量 `DSH_ASAR` 指定 `app.asar` 路径。抽取结果供
 * `build/validate-coverage.mjs` 读取校验，避免离线测试依赖宿主安装包。
 *
 * ASAR 二进制格式：偏移 12 为小端 uint32 `headerSize`；JSON 目录从偏移 16 开始；
 * 文件数据区从 `16 + ceil(headerSize / 4) * 4` 开始（无数值 `size`/`offset` 的条目为链接，跳过）。
 */

import { open, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = resolve(REPO, 'vendor/dsh-survey');

/** 默认读取环境变量 `DSH_ASAR` 指定的 `app.asar` 路径。 */
const DEFAULT_ASAR = process.env.DSH_ASAR ?? '';

/** 需抽取的宿主样式表及其用途说明。 */
const TARGETS = [
  {
    name: 'design-platform.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/design-platform.css'),
    why: '定义浅色与深色两套完整的 `--dsw-*` 颜色变量，是变量覆盖检查的基准集合。',
  },
  {
    name: 'base.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/base.css'),
    why: '定义圆角刻度与默认字体栈，形状映射与本表保持一致。',
  },
  {
    name: 'focus.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/focus.css'),
    why: '定义 `--dsw-focus-ring-width: 2px`，用于对齐焦点环规格。',
  },
  {
    name: 'gradient-shadow-text.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/gradient-shadow-text.css'),
    why: '定义 `--dsw-shadow-lv*` 与 `--dsw-elevation-*` 阴影及高程变量。',
  },
];

/**
 * 抽取样式表的上游 MIT 声明。
 * 每次运行脚本都会在输出目录重写 `LICENSE`，确保再分发时附带完整声明。
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

  /** 将 ASAR 目录树展平为 `{ path, offset, size }` 记录。 */
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
  throw new Error('请传入 app.asar 路径，或设置环境变量 DSH_ASAR');
}
const asar = await readAsar(asarPath);

await mkdir(OUT_DIR, { recursive: true });

const written = [];
for (const target of TARGETS) {
  const record = asar.files.find((file) => target.match(file.path));
  if (record === undefined) {
    throw new Error(`app.asar 中未找到 ${target.name}`);
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

const readme = `# 从 DeepSeek Harness 提取的参考样式表

以下文件从已安装的 DeepSeek Harness \`app.asar\` 中原样提取，用于离线校验 CSS 变量覆盖率。重新提取时运行：

\`\`\`
node build/vendor-survey.mjs <path-to-app.asar>
\`\`\`

| 文件 | 字节 | 说明 |
| --- | --- | --- |
${rows}

\`build/validate-coverage.mjs\` 会读取全部四份样式表：\`design-platform.css\` 定义必须全覆盖的颜色变量集合，四份样式表的并集则用于校验 \`src/parts/token-map.js\` 中不存在无效变量名。

## 许可协议

这些样式表来自 DeepSeek Harness（MIT 协议，\`Copyright (c) 2026 DeepSeek\`），协议原文保存在同目录的 [LICENSE](LICENSE) 中。每次运行提取脚本都会同步重写该文件。

## 宿主样式变更后的同步流程

1. \`node build/vendor-survey.mjs <path-to-app.asar>\`
2. \`node build/validate-coverage.mjs\`（若宿主新增或重命名了变量，校验会以非零码退出）
3. 根据校验结果更新 \`src/parts/token-map.js\`
4. \`node build/verify.mjs\`，然后重新安装插件

编译后的前端聚合样式（\`dist/assets/index-*.css\`，约 92 KB）仅引用上述四份源码样式表中声明的变量，因此无需提取。
`;

await writeFile(join(OUT_DIR, 'README.md'), readme, 'utf8');
await writeFile(join(OUT_DIR, 'LICENSE'), UPSTREAM_LICENCE, 'utf8');

console.log(`输入文件：${asarPath}`);
for (const { name, bytes } of written) console.log(`  ${name}：${bytes} 字节`);
console.log(`已写出 ${join(OUT_DIR, 'README.md')}`);
console.log(`已写出 ${join(OUT_DIR, 'LICENSE')}`);
