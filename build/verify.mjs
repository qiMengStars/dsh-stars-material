/**
 * 顺序执行所有不依赖浏览器的检查。
 *
 *   node build/verify.mjs
 *
 * 各步骤分别输出报告。任一步骤失败时以非零状态退出并中止后续步骤；
 * 后续步骤以前序步骤通过为前提。
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const STEPS = [
  ['生成调色板', 'build/generate-palettes.mjs'],
  ['打包 Host 端', 'build/bundle-host.mjs'],
  ['打包 Client 端', 'build/bundle-client.mjs'],
  ['令牌覆盖', 'build/validate-coverage.mjs'],
  ['插件清单', 'build/validate-manifest.mjs'],
  ['行为自检', 'build/self-check.mjs'],
  ['Host 路由', 'build/host-check.mjs'],
];

for (const [label, script] of STEPS) {
  process.stdout.write(`\n== ${label} ==\n`);
  const result = spawnSync(process.execPath, [resolve(REPO, script)], {
    cwd: REPO,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.stderr.write(`\n"${label}" 失败（${script}）\n`);
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('\n全部检查通过\n');
