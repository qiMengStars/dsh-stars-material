/**
 * Run every check that can be run without a browser, in one go.
 *
 *   node build/verify.mjs
 *
 * Each step prints its own report; the first failure sets a non-zero exit code
 * and stops the run, because later checks assume the earlier ones passed.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const STEPS = [
  ['generate palettes', 'build/generate-palettes.mjs'],
  ['bundle host', 'build/bundle-host.mjs'],
  ['bundle client', 'build/bundle-client.mjs'],
  ['token coverage', 'build/validate-coverage.mjs'],
  ['manifest', 'build/validate-manifest.mjs'],
  ['behaviour', 'build/self-check.mjs'],
  ['host route', 'build/host-check.mjs'],
];

for (const [label, script] of STEPS) {
  process.stdout.write(`\n== ${label} ==\n`);
  const result = spawnSync(process.execPath, [resolve(REPO, script)], {
    cwd: REPO,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.stderr.write(`\nFAILED at "${label}" (${script})\n`);
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('\nall checks passed\n');
