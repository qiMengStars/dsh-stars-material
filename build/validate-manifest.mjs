/**
 * 校验 `plugin/` 目录的插件清单、本地化文件、图标、许可证与客户端打包产物。
 *
 *   node build/validate-manifest.mjs
 *
 * 检查内容：
 *   - `package.json` 必需字段、导出口、发布文件列表及注入限制（不依赖宿主内部包）；
 *   - `cordis.patch.yml` 插入项与包名一致；
 *   - `locale/en.json` 与 `locale/zh.json` 键集一致、非空，且英文 `meta.title` / `nav.title` 符合句首大写（`meta.title` 末尾无句号）；
 *   - `icon.svg` 为合法且安全的矢量图标（含 `viewBox`、不超过 256 KiB）；
 *   - `plugin/client.js` 为非 ESM 自包含脚本，仅 `require` 允许模块，且硬编码颜色仅限于白名单；
 *   - MIT 许可证文件完整存在。
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
  check(await exists(resolve(PKG_DIR, target)), `package.json："${target}" 已被列出，但包中不存在对应文件`);
}

for (const required of ['index.js', 'client.js', 'cordis.patch.yml', 'icon.svg', 'locale/en.json', 'locale/zh.json']) {
  check(await exists(resolve(PKG_DIR, required)), `包内缺少 ${required}`);
}

// ---------------------------------------------------------------------------
// 许可证
// ---------------------------------------------------------------------------

// 插件安装环境只包含 plugin/ 子目录，因此 plugin/ 与根目录均需随包附带 MIT 原文。
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
    check(false, `缺少许可证文件：${path}`);
    continue;
  }
  const text = await readFile(full, 'utf8');
  const heading = text.split('\n').find((line) => line.trim() !== '') ?? '';
  check(heading.includes(expected), `${path}：首行 "${heading}" 未标明 ${expected} 协议`);
  check(/Permission is hereby granted/u.test(text), `${path}：缺少 ${expected} 授权原文（Permission is hereby granted）`);
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
      `cordis.patch.yml：name "${name}" 与包名不匹配`,
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

// 句首大写：仅首词可大写，其余英文词保持小写。
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

  // 浏览器环境不走 ESM 加载流程，产物中不得残留顶层 import/export。
  check(!/^\s*import\s[\s\S]*?from\s+["']/mu.test(client), 'client.js：出现了 ESM import 语句');
  check(!/^\s*export\s+(?:const|let|var|function|class|default)\b/mu.test(client), 'client.js：出现了 ESM export 语句');

  // 硬编码颜色仅允许来自预设种子色（设置页色点与默认值）和 LITERAL_TOKENS（遮罩与媒体工具栏）。
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
    `client.js：出现了预设种子色与 LITERAL_TOKENS 白名单之外的硬编码颜色：${unexpectedHex.join(', ')}`,
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
  console.log('client        未 require 任何 Harness 内部客户端包');
  console.log('manifest OK');
}
