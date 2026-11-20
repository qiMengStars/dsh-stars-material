/**
 * Re-extract the vendored DSH token sheets from the installed app.asar.
 *
 *   node build/vendor-survey.mjs <path-to-app.asar>
 *
 * The source is your installed DeepSeek Harness build, so it has to be named on
 * the command line (or in `DSH_ASAR`); there is no default that would work on
 * another machine. The extracted files land in `vendor/dsh-survey/` and are read
 * by `build/validate-coverage.mjs`, so the coverage gate keeps working without a
 * shell that can read inside the archive.
 *
 * ASAR layout (pickled header): `headerSize` is a little-endian uint32 at byte
 * 12, the JSON directory starts at byte 16, and the payload starts at
 * `16 + ceil(headerSize / 4) * 4`. Entries without a numeric `size`/`offset`
 * are links, not files, and must be skipped.
 */

import { open, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = resolve(REPO, 'vendor/dsh-survey');

// Where the installed Harness keeps its bundle. Pass it as the first argument or
// set DSH_ASAR; there is no sensible default because the install path differs per
// machine.
const DEFAULT_ASAR = process.env.DSH_ASAR ?? '';

/** Files copied out verbatim, with the reason each one is worth keeping. */
const TARGETS = [
  {
    name: 'design-platform.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/design-platform.css'),
    why: 'Sole colour authority: every --dsw-* colour token, light and dark.',
  },
  {
    name: 'base.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/base.css'),
    why: 'Radius scale and font families the shape mapping must agree with.',
  },
  {
    name: 'focus.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/focus.css'),
    why: 'Proves --dsw-focus-ring-width is already 2px, i.e. already M3.',
  },
  {
    name: 'gradient-shadow-text.css',
    match: (path) => path.endsWith('dsh-client-ui-theme/src/styles/gradient-shadow-text.css'),
    why: 'Declares --dsw-shadow-lv* and --dsw-elevation-*, which no other sheet defines.',
  },
];

/**
 * The licence the extracted sheets travel under.
 *
 * The sheets come from DeepSeek Harness packages, which declare `"license":
 * "MIT"` and carry this text verbatim in their own `LICENSE` file. Copying
 * files without it would be a redistribution without the notice MIT requires,
 * so it is written next to them on every run rather than left to a one-off
 * manual step.
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

  /** Flatten the directory tree into `{ path, offset, size }` file records. */
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
  throw new Error('pass the installed app.asar path, or set DSH_ASAR to it');
}
const asar = await readAsar(asarPath);

await mkdir(OUT_DIR, { recursive: true });

const written = [];
for (const target of TARGETS) {
  const record = asar.files.find((file) => target.match(file.path));
  if (record === undefined) {
    throw new Error(`app.asar does not contain ${target.name} (looked for ${target.name})`);
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

const readme = `# Vendored DSH token sheets

Extracted verbatim from the installed DeepSeek Harness \`app.asar\`. Regenerate
with:

\`\`\`
node build/vendor-survey.mjs <path-to-app.asar>
\`\`\`

| File | Bytes | Why it is here |
| --- | --- | --- |
${rows}

\`build/validate-coverage.mjs\` reads all four. \`design-platform.css\` supplies
the set of colour tokens the product is guaranteed to read (so nothing may be
missing); the union of all four supplies the set of names that exist at all (so
nothing may be invented).

## Licence

These sheets are copied from DeepSeek Harness, whose packages are MIT licensed
(\`Copyright (c) 2026 DeepSeek\`). The notice they require travels with them in
[LICENSE](LICENSE), which this script rewrites on every run.

## When DSH ships a new frontend build

1. \`node build/vendor-survey.mjs <path-to-app.asar>\`
2. \`node build/validate-coverage.mjs\` — exits non-zero if a token was renamed,
   added or removed.
3. Update \`src/parts/token-map.js\` for whatever the check reports.
4. \`node build/verify.mjs\`, then reinstall the bundle.

The compiled frontend bundle (\`dist/assets/index-*.css\`, ~92 KB) is deliberately
not vendored: it is a build artifact, and every token it consumes is declared in
one of the four sheets above.
`;

await writeFile(join(OUT_DIR, 'README.md'), readme, 'utf8');
await writeFile(join(OUT_DIR, 'LICENSE'), UPSTREAM_LICENCE, 'utf8');

console.log(`source ${asarPath}`);
for (const { name, bytes } of written) console.log(`  ${name}: ${bytes} bytes`);
console.log(`wrote ${join(OUT_DIR, 'README.md')}`);
console.log(`wrote ${join(OUT_DIR, 'LICENSE')}`);
