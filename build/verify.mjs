/**
 * 一次跑完所有不需要浏览器的检查。
 *
 *   node build/verify.mjs
 *
 * 每步各打一份报告。任何一步失败就立刻以非零码退出并停止后续步骤，
 * 因为后面的检查默认前面的检查已经通过。
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
