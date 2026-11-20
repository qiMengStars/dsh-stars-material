/**
 * One-off survey helper: list CSS rules that still paint a border.
 *
 * Read-only against the installed app.asar; it exists so the theme author can
 * confirm that a border seen in a screenshot comes from a rule the theme does
 * not clear, instead of guessing.
 */

import { readFileSync } from 'node:fs';

// Point this at the installed Harness bundle on your own machine:
//   $env:DSH_ASAR = '<install>/resources/app.asar'
const ASAR = process.env.DSH_ASAR;
if (!ASAR) {
  throw new Error('set DSH_ASAR to the installed app.asar before running this helper');
}
const buffer = readFileSync(ASAR);

const headerSize = buffer.readUInt32LE(12);
const tree = JSON.parse(buffer.subarray(16, 16 + headerSize).toString('utf8'));
const dataOffset = 16 + Math.ceil(headerSize / 4) * 4;

/** Flatten the asar tree into readable [path, entry] pairs. */
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
process.stdout.write(`css files: ${cssFiles.length}\n`);

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
process.stdout.write(`\nmatches: ${shown}\n`);
