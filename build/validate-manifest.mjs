/**
 * `plugin/` 里那个 bundle 的 manifest 与打包检查。
 *
 * 核对的是浏览器看不出来、用户装完之后才会发现的事：
 *
 *   - `package.json` 声明了加载器需要的字段（`name`、`type`、`exports`、
 *     `dsh.bundle.patch`、`dsh.client`），且运行时不依赖任何 Harness 客户端包；
 *   - 每个 `exports`/`files` 条目都指向包内真实存在的文件；
 *   - `cordis.patch.yml` 恰好插入一行，且名字与包名一致；
 *   - 两份 locale 文件都能解析，`meta.title` / `meta.description` 都按句首大写写，
 *     且暴露同一套键；
 *   - 图标是带 `viewBox` 的合法 SVG，且远在体积上限之内；
 *   - Client bundle 只 `require` 白名单里的模块；
 *   - 项目声明或依赖的每一份 licence 文本都在磁盘上。
 *
 *   node build/validate-manifest.mjs
 */

import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PKG_DIR = resolve(REPO, 'plugin');

const ICON_LIMIT = 256 * 1024;
const ALLOWED_REQUIRES = new Set(['react', 'react/jsx-runtime']);
const FORBIDDEN_PREFIXES = ['@deepseek-ai/'];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function readJson(path) {
  const text = await readFile(path, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    failures.push(`${path}: 不是合法的 JSON（${error.message}）`);
    return {};
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

const pkg = await readJson(resolve(PKG_DIR, 'package.json'));

check(typeof pkg.name === 'string' && pkg.name.length > 0, 'package.json：缺少 "name"');
check(/^[a-z0-9][a-z0-9._-]*$/u.test(pkg.name ?? ''), `package.json："name" 不是合法的包 id`);
check(typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/u.test(pkg.version), 'package.json：缺少 semver 格式的 "version"');
check(pkg.type === 'module', 'package.json："type" 必须是 "module"');
check(pkg.private === true, 'package.json：作为打包发出的插件，应当写 "private": true');
check(pkg.dependencies === undefined, 'package.json：插件包不能声明 dependencies');
check(pkg.devDependencies === undefined, 'package.json：插件包不能声明 devDependencies');

const dsh = pkg.dsh ?? {};
check(typeof dsh.bundle?.patch === 'string', 'package.json：缺少 dsh.bundle.patch');
check(dsh.client?.platform === 'web', 'package.json：dsh.client.platform 必须是 "web"');
check(Array.isArray(dsh.client?.inject), 'package.json：dsh.client.inject 必须是数组');
for (const entry of dsh.client?.inject ?? []) {
  check(
    !FORBIDDEN_PREFIXES.some((prefix) => entry.startsWith(prefix)) || entry.startsWith('@deepseek-ai/dsh-client-ui-'),
    `package.json：dsh.client.inject 里的 "${entry}" 不是 UI 包`,
  );
}

const exportsMap = pkg.exports ?? {};
check(exportsMap['.'] !== undefined, 'package.json：必须有 exports["."]');
check(exportsMap['./client'] !== undefined, 'package.json：必须有 exports["./client"]');
check(exportsMap['./icon'] !== undefined, 'package.json：必须有 exports["./icon"]');
check(exportsMap['./locale/*.json'] !== undefined, 'package.json：必须有 exports["./locale/*.json"]');

const targets = new Set();
for (const value of Object.values(exportsMap)) {
  if (typeof value === 'string') targets.add(value.replace(/^\.\//, ''));
}
for (const entry of pkg.files ?? []) targets.add(entry.replace(/^\.\//, ''));

for (const target of targets) {
  if (target.includes('*')) continue;
  check(await exists(resolve(PKG_DIR, target)), `package.json："${target}" 被列出，但包里没有这个文件`);
}

for (const required of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'locale/en.json', 'locale/zh.json']) {
  check(await exists(resolve(PKG_DIR, required)), `包内缺少 ${required}`);
}

// ---------------------------------------------------------------------------
// Licence
// ---------------------------------------------------------------------------

// `package.json` 声明 MIT，而 vendor 目录再分发 MIT 代码，所以两份声明都得有随文件一起
// 走的 licence 文本兜底。插件包自己留一份，因为它是单独安装的，周围没有整个仓库。
check(pkg.license === 'MIT', `package.json：应当是 "license": "MIT"，实际为 ${JSON.stringify(pkg.license)}`);
check(
  (pkg.files ?? []).some((entry) => entry.replace(/^\.\//, '') === 'LICENSE'),
  'package.json："LICENSE" 必须列进 "files"，才能随插件包一起发出去',
);

const LICENCES = [
  ['LICENSE', 'MIT'],
  ['plugin/LICENSE', 'MIT'],
  ['vendor/dsh-survey/LICENSE', 'MIT'],
];
for (const [path, expected] of LICENCES) {
  const full = resolve(REPO, path);
  if (!(await exists(full))) {
    check(false, `缺少 licence 文件：${path}`);
    continue;
  }
  const text = await readFile(full, 'utf8');
  const heading = text.split('\n').find((line) => line.trim() !== '') ?? '';
  check(heading.includes(expected), `${path}：首行 "${heading}" 没有写出 ${expected} 许可`);
  check(/Permission is hereby granted/u.test(text), `${path}：没有 ${expected} 的授权原文（Permission is hereby granted）`);
}

// ---------------------------------------------------------------------------
// cordis.patch.yml
// ---------------------------------------------------------------------------

const patchPath = resolve(PKG_DIR, dsh.bundle?.patch ?? 'cordis.patch.yml');
if (await exists(patchPath)) {
  const patch = await readFile(patchPath, 'utf8');
  const rows = [...patch.matchAll(/^\s*-\s*id:\s*(\S+)\s*\n\s*name:\s*(\S+)\s*$/gmu)];
  check(rows.length === 1, `cordis.patch.yml：应当恰好一行插入记录，实际 ${rows.length} 行`);
  if (rows.length === 1) {
    const [, id, name] = rows[0];
    check(id === pkg.name, `cordis.patch.yml：id "${id}" 与包名不一致`);
    check(
      name === pkg.name || name === `'${pkg.name}'`,
      `cordis.patch.yml：name "${name}" 解析不到这个包`,
    );
  }
} else {
  failures.push('缺少 cordis.patch.yml');
}

// ---------------------------------------------------------------------------
// Locale 文件
// ---------------------------------------------------------------------------

const localeDir = resolve(PKG_DIR, 'locale');
const en = await readJson(resolve(localeDir, 'en.json'));
const zh = await readJson(resolve(localeDir, 'zh.json'));

function flatten(object, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    if (value !== null && typeof value === 'object') Object.assign(out, flatten(value, path));
    else out[path] = value;
  }
  return out;
}

const enFlat = flatten(en);
const zhFlat = flatten(zh);

check(typeof enFlat['meta.title'] === 'string' && enFlat['meta.title'].length > 0, 'en.json：缺少 meta.title');
check(
  typeof enFlat['meta.description'] === 'string' && enFlat['meta.description'].length > 0,
  'en.json：缺少 meta.description',
);
check(typeof zhFlat['meta.title'] === 'string' && zhFlat['meta.title'].length > 0, 'zh.json：缺少 meta.title');
check(
  typeof zhFlat['meta.description'] === 'string' && zhFlat['meta.description'].length > 0,
  'zh.json：缺少 meta.description',
);

// 句首大写：不许每个词都大写，也不许末尾带句号。
for (const [key, value] of Object.entries(enFlat)) {
  if (key === 'meta.title' || key === 'nav.title') {
    const words = value.split(' ').filter((word) => /^[A-Za-z]/.test(word));
    const inner = words.slice(1);
    check(
      inner.every((word) => !/^[A-Z][a-z]/.test(word)),
      `en.json："${key}" 不是句首大写（"${value}"）`,
    );
  }
  if (key === 'meta.title') check(!value.endsWith('.'), 'en.json：meta.title 末尾不能带句号');
}

const enKeys = Object.keys(enFlat).sort();
const zhKeys = Object.keys(zhFlat).sort();
check(enKeys.join(',') === zhKeys.join(','), '两份 locale 文件的键集合不一致');
for (const key of enKeys) {
  check(typeof zhFlat[key] === 'string' && zhFlat[key].length > 0, `zh.json："${key}" 是空的`);
}

// ---------------------------------------------------------------------------
// 图标
// ---------------------------------------------------------------------------

const iconPath = resolve(PKG_DIR, 'icon.svg');
if (await exists(iconPath)) {
  const info = await stat(iconPath);
  check(info.size <= ICON_LIMIT, `icon.svg 有 ${info.size} B，超过 256 KiB 上限`);
  const icon = await readFile(iconPath, 'utf8');
  check(/^<svg\b/u.test(icon.trim()), 'icon.svg：根元素必须是 <svg>');
  check(icon.includes('xmlns="http://www.w3.org/2000/svg"'), 'icon.svg：缺少 SVG namespace');
  check(/viewBox="[^"]+"/u.test(icon), 'icon.svg：缺少 viewBox');
  check(!/<script\b/iu.test(icon), 'icon.svg：不能包含 <script>');
  check(!/<style\b/iu.test(icon), 'icon.svg：不能包含 <style>');
  check(!/href="(?:https?:)?\/\//u.test(icon), 'icon.svg：不能引用远程资源');
}

// ---------------------------------------------------------------------------
// Client bundle
// ---------------------------------------------------------------------------

const clientPath = resolve(PKG_DIR, 'client.js');
if (await exists(clientPath)) {
  const client = await readFile(clientPath, 'utf8');
  check(
    client.includes('window.__ModuleLoader__.load('),
    'client.js：必须通过 window.__ModuleLoader__.load 自注册',
  );
  check(
    client.includes(`id: ${JSON.stringify(pkg.name)}`) || client.includes(`id: '${pkg.name}'`),
    'client.js：注册的 id 必须是包名',
  );
  const requires = [...client.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/gu)].map((match) => match[1]);
  const unexpected = [...new Set(requires)].filter((id) => !ALLOWED_REQUIRES.has(id));
  check(unexpected.length === 0, `client.js require 了白名单之外的模块：${unexpected.join(', ')}`);

  // 这个 bundle 是浏览器脚本：一句 ESM import/export 就会解析失败。
  check(!/^\s*import\s[\s\S]*?from\s+["']/mu.test(client), 'client.js：出现了 ESM import 语句');
  check(!/^\s*export\s+(?:const|let|var|function|class|default)\b/mu.test(client), 'client.js：出现了 ESM export 语句');

  // 硬编码颜色只有在跟不了主题的地方才允许：设置页里画的那 8 个种子色块，以及 token
  // map 里的插画字面量。除此之外都意味着有一份配色被复制进了 bundle，那就不再跟随
  // 当前配色方案了。
  const { PRESETS } = await import(pathToFileURL(resolve(REPO, 'src/parts/palette-spec.js')).href);
  const { LITERAL_TOKENS } = await import(pathToFileURL(resolve(REPO, 'src/parts/token-map.js')).href);
  const allowedHex = new Set([
    ...PRESETS.map((preset) => preset.hex.toLowerCase()),
    ...Object.values(LITERAL_TOKENS).map((value) => value.toLowerCase()),
  ]);
  const hexLiterals = [...new Set((client.match(/#[0-9a-f]{6}(?:[0-9a-f]{2})?/giu) ?? []).map((value) => value.toLowerCase()))];
  const unexpectedHex = hexLiterals.filter((value) => !allowedHex.has(value));
  check(
    unexpectedHex.length === 0,
    `client.js：出现了种子色/插画白名单之外的硬编码颜色：${unexpectedHex.join(', ')}`,
  );
}

if (failures.length > 0) {
  console.error(`manifest 校验失败（${failures.length} 项）`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`package       ${pkg.name} ${pkg.version}`);
  console.log(`files         ${[...targets].length} 个声明目标都能解析`);
  console.log(`locales       en + zh，${enKeys.length} 个键对齐`);
  console.log(`client        ${'没有 require 任何 Harness 客户端包'}`);
  console.log('manifest OK');
}
