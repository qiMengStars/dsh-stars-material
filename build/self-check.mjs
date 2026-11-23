/**
 * Client 端打包产物（`plugin/client.js`）的离线行为自检。
 *
 * 在最小替身环境（模拟模块加载器、DOM、`theme` / `locale` / `slots` 服务与 `fetch`）中执行
 * `plugin/client.js`，验证：
 *   - 覆盖全部宿主颜色变量，每项具备合法的浅色与深色取值；
 *   - 常规边框变量设为 `transparent`，高程与阴影变量设为 `none`，交互状态采用 `color-mix()`；
 *   - 浅色与深色表面容器阶梯按亮度单调递减/递增；
 *   - `--dsh-m3-*` 桥接变量以 `light-dark()` 输出，两个主题均正确注册且语言词典键集对齐；
 *   - 预设、跟随系统、失败回退、重试恢复、禁用、自定义颜色、旧版 Host 识别与旧配置键迁移
 *     场景的行为与生命周期清理均符合预期。
 *
 *   node build/self-check.mjs
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const BUNDLE = resolve(REPO, 'plugin/client.js');
const SURVEY = resolve(REPO, 'vendor/dsh-survey');

const failures = [];
let assertions = 0;
function check(condition, message) {
  assertions += 1;
  if (!condition) failures.push(message);
}

const SHIPPED_CSS = [
  'design-platform.css',
  'base.css',
  'focus.css',
  'gradient-shadow-text.css',
];

/** 颜色权威样式表，与 `build/validate-coverage.mjs` 保持一致。 */
const COLOUR_SHEET = 'design-platform.css';

// ---------------------------------------------------------------------------
// 最小 DOM 替身
// ---------------------------------------------------------------------------

function createDom() {
  const head = { children: [], appendChild(node) { this.children.push(node); } };
  const tags = [];

  const document = {
    head,
    body: { dataset: {} },
    querySelector: () => null,
    createElement(tagName) {
      const node = {
        tagName: tagName.toUpperCase(),
        dataset: {},
        textContent: '',
        remove() {
          const index = tags.indexOf(node);
          if (index >= 0) tags.splice(index, 1);
        },
      };
      tags.push(node);
      return node;
    },
  };

  return { document, tags };
}

// ---------------------------------------------------------------------------
// 注入服务的替身
// ---------------------------------------------------------------------------

function createThemeStub() {
  const calls = { overrides: [], registered: [], disposed: 0 };
  return {
    calls,
    getTheme: () => ({ active: { colorScheme: 'light' } }),
    overrideTokens(source, tokens) {
      calls.overrides.push({ source, tokens });
      return () => { calls.disposed += 1; };
    },
    register(definition) {
      calls.registered.push(definition);
      return () => { calls.disposed += 1; };
    },
  };
}

function createLocaleStub() {
  const dicts = [];
  return {
    __dicts: dicts,
    register(namespace, entries) {
      dicts.push(entries);
      return () => {};
    },
    bind() {
      return (key) => key;
    },
  };
}

function createSlotsStub() {
  const registrations = [];
  return {
    __registrations: registrations,
    inject(key, callback) {
      callback();
      return () => {};
    },
    register(options, component) {
      registrations.push({ options, component });
      return () => {};
    },
  };
}

// ---------------------------------------------------------------------------
// 加载一次 `plugin/client.js`，各场景分别调用 `apply(ctx)` 以隔离状态
// ---------------------------------------------------------------------------

const source = await readFile(BUNDLE, 'utf8');
const dom = createDom();

// 接管定时重试队列，以便在单测中同步推进退避重试而不等待真实时间。
const timers = [];
let nextTimerId = 1;
const queueTimer = (callback) => {
  const id = nextTimerId++;
  timers.push({ id, callback });
  return id;
};
const dropTimer = (id) => {
  const entry = timers.find((timer) => timer.id === id);
  if (entry !== undefined) entry.callback = null;
};

let factory;
const sandbox = {
  console: { log() {}, warn() {}, error() {} },
  setTimeout: queueTimer,
  clearTimeout: dropTimer,
  AbortController,
  URL,
};
sandbox.globalThis = sandbox;
sandbox.window = {
  localStorage: null, // 由每个场景单独赋值
  addEventListener() {},
  removeEventListener() {},
  setTimeout: queueTimer,
  clearTimeout: dropTimer,
  fetch: null, // 由每个场景单独赋值
};
sandbox.window.__ModuleLoader__ = {
  load(options) {
    factory = options.factory;
  },
};
sandbox.document = dom.document;

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'plugin/client.js' });

check(typeof factory === 'function', '包未调用 __ModuleLoader__.load');
if (typeof factory !== 'function') {
  report();
  process.exit(1);
}

const plugin = factory((id) => {
  if (id !== 'react') throw new Error(`unexpected require("${id}")`);
  return {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [initial, () => {}],
    useEffect: () => {},
  };
});

check(Array.isArray(plugin.inject), '插件未声明 inject');
check(plugin.inject.includes('theme'), '插件未声明 theme 服务');
check(typeof plugin.apply === 'function', '插件未提供 apply()');

/** 运行单个离线测试场景，返回记录的调用与状态控制句柄。 */
async function scenario({ storage, fetch }) {
  const store = new Map(Object.entries(storage ?? {}));
  sandbox.window.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  sandbox.window.fetch = fetch ?? (() => Promise.reject(new Error('no fetch')));

  let attempts = 0;
  const hostFetch = sandbox.window.fetch;
  sandbox.window.fetch = (...args) => {
    attempts += 1;
    return hostFetch(...args);
  };

  dom.tags.length = 0;

  const theme = createThemeStub();
  const locale = createLocaleStub();
  const slots = createSlotsStub();
  const effects = [];

  const ctx = {
    slots,
    get(name) {
      if (name === 'theme') return theme;
      if (name === 'locale') return locale;
      if (name === 'slots') return slots;
      return undefined;
    },
    effect(callback, label) {
      const dispose = callback();
      effects.push({ label, dispose });
      return dispose;
    },
    on() {
      return () => {};
    },
    provide() {
      return () => {};
    },
    console: sandbox.console,
  };

  plugin.apply(ctx);
  // 等待微任务与退避定时器全部收敛后再做断言。
  await new Promise((tick) => setImmediate(tick));

  const settle = async () => {
    for (let round = 0; round < 8; round += 1) {
      await new Promise((tick) => setImmediate(tick));
      const pending = timers.splice(0, timers.length);
      if (pending.length === 0) return;
      for (const timer of pending) {
        if (typeof timer.callback === 'function') timer.callback();
      }
    }
  };
  await settle();

  return {
    theme,
    locale,
    slots,
    effects,
    store,
    settle,
    attempts: () => attempts,
    disposeAll() {
      for (const effect of effects) {
        if (typeof effect.dispose === 'function') effect.dispose();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 预期的令牌集合
// ---------------------------------------------------------------------------

/** `design-platform.css` 中声明的宿主颜色变量（排除 `--dsw-static-*` 静态色阶）。 */
const declared = new Set();
{
  const css = await readFile(resolve(SURVEY, COLOUR_SHEET), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
}
const expected = [...declared]
  .filter((name) => !name.startsWith('--dsw-static-'))
  .filter((name) => name.startsWith('--dsw-alias-') || name.startsWith('--dsw-specific-'))
  .sort();

/** 全部参考样式表中声明的变量名并集（含仅通过回退值引用的变量）。 */
const everywhere = new Set(['--dsw-alias-border-selected']);
for (const name of SHIPPED_CSS) {
  const css = await readFile(resolve(SURVEY, name), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) everywhere.add(match[1]);
}

// ---------------------------------------------------------------------------
// 场景 1：预设模式（同步，无 Host 往返）
// ---------------------------------------------------------------------------

const preset = await scenario({
  storage: { 'dsh.stars-material.source': 'preset', 'dsh.stars-material.preset': 'baseline' },
});

check(preset.theme.calls.overrides.length === 2, `期望两套覆盖层，实际 ${preset.theme.calls.overrides.length} 套`);

const override = preset.theme.calls.overrides[0];
check(override?.source === 'dsh-stars-material', `覆盖层的 source 为 "${override?.source}"`);
const bridge = preset.theme.calls.overrides[1];
check(bridge?.source === 'dsh-stars-material/bridge', `桥接层的 source 为 "${bridge?.source}"`);

const tokens = override?.tokens ?? {};
const productNames = Object.keys(tokens).sort();

const missing = expected.filter((name) => !productNames.includes(name));
const invented = productNames.filter((name) => !everywhere.has(name));
check(missing.length === 0, `覆盖层缺少令牌：${missing.join(', ')}`);
check(invented.length === 0, `覆盖层含样式表未声明的令牌：${invented.join(', ')}`);

const colorLiteral = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const colorMix = /^(?:color-mix\(in srgb, #(?:[0-9a-f]{6}) \d+%, (?:(?:#(?:[0-9a-f]{6}))|transparent)\)|light-dark\(#(?:[0-9a-f]{6}), #(?:[0-9a-f]{6})\))$/;
const noPaint = new Set(['transparent', 'none']);

let derived = 0;
let literal = 0;
let cleared = 0;
const sameInBothSchemes = [];
const differInBothSchemes = [];

for (const [name, modes] of Object.entries(tokens)) {
  if (modes === null || typeof modes !== 'object') {
    failures.push(`${name}：值不是对象`);
    continue;
  }
  if (typeof modes.light !== 'string' || typeof modes.dark !== 'string') {
    failures.push(`${name}：缺 light/dark 字符串对`);
    continue;
  }
  for (const [scheme, value] of [['light', modes.light], ['dark', modes.dark]]) {
    if (noPaint.has(value)) {
      cleared += 1;
      continue;
    }
    if (colorMix.test(value)) {
      derived += 1;
      continue;
    }
    if (colorLiteral.test(value)) {
      literal += 1;
      continue;
    }
    failures.push(`${name} (${scheme})：值格式不符合预期 "${value}"`);
  }
  if (modes.light === modes.dark) sameInBothSchemes.push(name);
  else differInBothSchemes.push(name);
}

check(derived > 0, '未出现 color-mix() 派生值');
check(cleared > 0, '未出现解析为 transparent/none 的令牌');
check(
  literal + derived + cleared === productNames.length * 2,
  `处理了 ${literal + derived + cleared} 个值，对应 ${productNames.length} 个令牌；每个令牌应当两个`,
);

// 常规边框与轮廓变量（含 `border-l3`）统一设为 transparent；原本借用 `border-l3` 绘制的开关轨道由 stylesheet.js 重绘。
for (const name of [
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-border-l2-darkmode-thin',
  '--dsw-alias-settings-card-stroke',
  '--dsw-alias-border-selected',
]) {
  check(tokens[name]?.light === 'transparent', `${name} 必须是 transparent`);
}

// 高程由色调表达，不由阴影表达。
for (const name of [
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv3',
  '--dsw-elevation-stroke',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
]) {
  check(tokens[name]?.light === 'none', `${name} 必须解析成 none`);
}

// 悬停状态以叠在表面色上的状态层表示，不使用阴影。
for (const name of [
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-button-primary-hover',
]) {
  const value = tokens[name]?.light ?? '';
  check(
    /^color-mix\(in srgb, #(?:[0-9a-f]{6}) (?:\d+)%, /u.test(value),
    `${name} 应为状态层的 color-mix，实际为 "${value}"`,
  );
}
check(
  (tokens['--dsw-alias-interactive-bg-hover']?.light ?? '').includes('transparent'),
  '--dsw-alias-interactive-bg-hover 应混入 transparent，以适配任意表面色',
);

// 固定字面量与清空变量不随深浅色变化，表面底色必须区分深浅色。
for (const name of ['--dsw-alias-bg-mask-photo', '--dsw-alias-border-inverted']) {
  check(tokens[name]?.light === tokens[name]?.dark, `${name} 不能随深浅色变化`);
}
check(!sameInBothSchemes.includes('--dsw-alias-bg-base'), '--dsw-alias-bg-base 在两套配色中取值相同');
check(differInBothSchemes.length > 90, `只有 ${differInBothSchemes.length} 个令牌在深浅色之间有差异`);

// 采集到的表面阶梯按亮度单调：浅色方案中最低一级最亮。
{
  const ramp = [
    '--dsw-alias-bg-base',
    '--dsw-alias-bg-layer-1',
    '--dsw-alias-bg-layer-2',
    '--dsw-alias-bg-layer-3',
    '--dsw-alias-bg-overlay',
  ];
  const luminance = (hex) => {
    const value = Number.parseInt(hex.slice(1, 7), 16);
    return ((value >> 16) & 0xff) + ((value >> 8) & 0xff) + (value & 0xff);
  };
  const lightValues = ramp.map((name) => tokens[name]?.light ?? '#000000');
  const descending = lightValues.every(
    (value, index) => index === 0 || luminance(lightValues[index - 1]) >= luminance(value),
  );
  check(descending, `浅色表面阶梯不是逐级变深：${lightValues.join(' ')}`);

  const darkValues = ramp.map((name) => tokens[name]?.dark ?? '#000000');
  const ascending = darkValues.every(
    (value, index) => index === 0 || luminance(darkValues[index - 1]) <= luminance(value),
  );
  check(ascending, `深色表面阶梯不是逐级变浅：${darkValues.join(' ')}`);
}

// 桥接属性通过 light-dark() 同时定义两套配色。
const bridgeNames = Object.keys(bridge?.tokens ?? {});
check(bridgeNames.length >= 15, `只发布了 ${bridgeNames.length} 个桥接属性`);
for (const name of bridgeNames) {
  check(name.startsWith('--dsh-m3-'), `桥接属性 "${name}" 未使用 --dsh-m3- 前缀`);
  check(
    /^light-dark\(#(?:[0-9a-f]{6}), #(?:[0-9a-f]{6})\)$/u.test(bridge.tokens[name]?.light ?? ''),
    `桥接属性 "${name}" 不是 light-dark() 对`,
  );
}

// 已注册的主题。
const ids = preset.theme.calls.registered.map((entry) => `${entry.id}:${entry.colorScheme}`).sort();
check(
  ids.join(',') === 'stars-material-dark:dark,stars-material-light:light',
  `注册的主题是 [${ids.join(', ')}]`,
);
for (const entry of preset.theme.calls.registered) {
  const own = Object.keys(entry.tokens);
  const bad = own.filter((name) => !name.startsWith('--dsw-'));
  check(bad.length === 0, `主题 "${entry.id}" 含非产品令牌：${bad.join(', ')}`);
  const mismatch = own.filter((name) => entry.tokens[name] !== tokens[name]?.[entry.colorScheme]);
  check(mismatch.length === 0, `主题 "${entry.id}" 与覆盖层取值不一致`);
}

// 语言词典。
check(preset.locale.__dicts.length === 1, `期望一套词典，实际 ${preset.locale.__dicts.length} 套`);
const en = preset.locale.__dicts[0]?.en;
const zh = preset.locale.__dicts[0]?.zh;
check(en !== undefined && zh !== undefined, '缺少语言词典');
if (en && zh) {
  check(
    Object.keys(en).sort().join(',') === Object.keys(zh).sort().join(','),
    'en 和 zh 词典的键不一致',
  );
  check(en['page.sourceSystem'] !== undefined, '词典缺少 page.sourceSystem');
  check(!Object.keys(en).some((key) => key.startsWith('variant.')), '词典仍含已移除的 harmony 变体');
}

// 设置页以自身的 id 注册到 `settings.section` 插槽。
check(preset.slots.__registrations.length === 1, `期望一个设置分区，实际 ${preset.slots.__registrations.length} 个`);
check(
  preset.slots.__registrations[0]?.options?.id === 'stars-material',
  '设置分区的 id 不是 "stars-material"',
);
check(
  preset.slots.__registrations[0]?.options?.order === 26,
  '设置分区的 order 不是 26',
);

// 样式表仅注入一个标签，包含形状刻度、缓动曲线与相关规则。
check(dom.tags.length === 1, `期望恰好一个 <style>，实际 ${dom.tags.length} 个`);
const sheet = dom.tags[0]?.textContent ?? '';
check(sheet.includes('--dsw-radius-panel'), '注入的样式表缺少形状刻度');
check(sheet.includes('--dsw-m3-ease-emphasized-decelerate'), '样式表缺少缓动曲线');
check(sheet.includes('[role="switch"]'), '样式表缺少开关重绘规则');
check(sheet.includes('prefers-reduced-motion'), '样式表缺少 reduced-motion 保护');
check(!/\._[a-z0-9]+_[a-z0-9]+_\d+/u.test(sheet), '样式表含 CSS module 的硬编码哈希类名');

preset.disposeAll();
check(preset.theme.calls.disposed >= 4, `只释放了 ${preset.theme.calls.disposed} 层`);
check(dom.tags.length === 0, '<style> 元素未随插件一同移除');

// ---------------------------------------------------------------------------
// 场景 2：系统模式，Host 正常响应
// ---------------------------------------------------------------------------

const ANSWER = {
  ok: true,
  seed: '#00639b',
  light: 'a'.repeat(270),
  dark: 'b'.repeat(270),
  appsUseLightTheme: true,
};

const system = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(ANSWER) }),
});

check(system.theme.calls.overrides.length === 2, '系统模式未安装两套覆盖层');
check(
  system.theme.calls.registered.length === 2,
  `系统模式注册了 ${system.theme.calls.registered.length} 个主题`,
);
// 桩数据用重复字符模拟 270 位配色串，展开后应输出合法的 #rrggbb。
const systemTokens = system.theme.calls.overrides[0]?.tokens ?? {};
check(
  systemTokens['--dsw-alias-bg-base']?.light === '#aaaaaa',
  `系统模式未采用 Host 返回的配色："${systemTokens['--dsw-alias-bg-base']?.light}"`,
);
const state = system.slots.__registrations[0]?.options?.inject?.()?.state;
check(state?.systemSeed === '#00639b', `设置页未显示系统种子色："${state?.systemSeed}"`);
system.disposeAll();
check(dom.tags.length === 0, '系统模式的样式表未随插件一同移除');

// ---------------------------------------------------------------------------
// 场景 3：系统模式，Host 不可用
// ---------------------------------------------------------------------------

const fallback = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: () => Promise.reject(new Error('ECONNREFUSED')),
});

check(fallback.theme.calls.overrides.length === 2, '回退场景未安装两套覆盖层');
const fallbackState = fallback.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  fallbackState?.systemSeed === null,
  '设置页应标注系统取色不可用',
);
check(
  fallback.theme.calls.overrides[0]?.tokens?.['--dsw-alias-bg-base']?.light === '#fdf7ff',
  '回退配色不是 Material 基准配色',
);
check(
  fallback.attempts() === 4,
  `Host 无响应时应重试四次，实际 ${fallback.attempts()} 次`,
);
fallback.disposeAll();
check(dom.tags.length === 0, '回退场景的样式表未随插件一同移除');

// 首次请求失败后，后续重试应替换覆盖层，不得使会话停留在基准配色。
const recovered = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: (() => {
    let calls = 0;
    return () => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error('ECONNREFUSED'))
        : Promise.resolve({ ok: true, json: () => Promise.resolve(ANSWER) });
    };
  })(),
});
check(recovered.attempts() >= 2, `Host 仅收到 ${recovered.attempts()} 次请求`);
// 每次安装产生两套覆盖层：先是宿主变量，后是桥接变量。
check(
  recovered.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light === '#aaaaaa',
  '重试成功后未替换回退配色',
);
const recoveredState = recovered.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  recoveredState?.systemSeed === '#00639b',
  `恢复后未报告种子色："${recoveredState?.systemSeed}"`,
);
recovered.disposeAll();

// ---------------------------------------------------------------------------
// 场景 4：禁用
// ---------------------------------------------------------------------------

const off = await scenario({
  storage: { 'dsh.stars-material.enabled': '0', 'dsh.stars-material.source': 'preset' },
});

check(off.theme.calls.overrides.length === 0, '禁用状态下仍安装了覆盖层');
check(off.theme.calls.registered.length === 0, '禁用状态下仍注册了主题');
check(dom.tags.length === 1, '禁用状态下设置页样式表应保留');
const offSheet = dom.tags[0]?.textContent ?? '';
check(!offSheet.includes('--dsw-radius-panel'), '禁用状态的样式表含仅限启用时的规则');
check(offSheet.includes('-page'), '禁用状态下设置页样式表缺失');
off.disposeAll();
check(dom.tags.length === 0, '禁用状态的样式表未随插件一同移除');

// ---------------------------------------------------------------------------
// 场景 5：自定义颜色模式（正常推导、修改色值、非法输入、请求失败与旧版 Host 检测）
// ---------------------------------------------------------------------------

let askedSeed = null;
const CUSTOM_ANSWER = {
  ok: true,
  light: 'c'.repeat(270),
  dark: 'd'.repeat(270),
};
const custom = await scenario({
  storage: {
    'dsh.stars-material.source': 'custom',
    'dsh.stars-material.customSeed': '#ff0000',
  },
  fetch: (url) => {
    askedSeed = String(url);
    const seed = new URL(askedSeed, 'http://localhost').searchParams.get('seed');
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ ...CUSTOM_ANSWER, seed }) });
  },
});

check(askedSeed?.includes('seed=%23ff0000'), `自定义模式请求的 URL 不正确："${askedSeed}"`);
check(custom.attempts() === 1, `自定义种子色应只请求 1 次，实际 ${custom.attempts()} 次`);
check(
  custom.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light === '#cccccc',
  '自定义模式未安装 Host 返回的配色',
);
const customState = custom.slots.__registrations[0]?.options?.inject?.()?.state;
check(customState?.customSeed === '#ff0000', `设置页未保留自定义种子色："${customState?.customSeed}"`);
check(customState?.customError === false, '自定义配色成功时不应报告错误');

// 通过设置页回调更新种子色，验证小写规范化、持久化及主题层更新。
const onChange = custom.slots.__registrations[0]?.options?.inject?.()?.onChange;
onChange({ enabled: true, source: 'custom', preset: 'baseline', customSeed: '#00FF00' });
await new Promise((tick) => setImmediate(tick));
check(custom.store.get('dsh.stars-material.customSeed') === '#00ff00', '自定义种子色未持久化保存');
check(
  custom.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light === '#cccccc',
  '更换自定义种子色后未更新已安装的主题层',
);
// 非法色值应在持久化前被夹紧回默认种子色，不向存储写入无效值。
onChange({ enabled: true, source: 'custom', preset: 'baseline', customSeed: 'not-a-colour' });
await new Promise((tick) => setImmediate(tick));
check(custom.store.get('dsh.stars-material.customSeed') === '#6750a4', '非法种子色不应原样写入存储');
custom.disposeAll();
check(dom.tags.length === 0, '自定义模式的样式表未随插件一同移除');

const customFail = await scenario({
  storage: { 'dsh.stars-material.source': 'custom', 'dsh.stars-material.customSeed': '#123456' },
  fetch: () => Promise.reject(new Error('ECONNREFUSED')),
});
const failedState = customFail.slots.__registrations[0]?.options?.inject?.()?.state;
check(customFail.attempts() === 1, `自定义配色失败后不应退避重试，实际请求了 ${customFail.attempts()} 次`);
check(failedState?.customError === true, '自定义配色失败后应向用户展示错误提示');
check(customFail.theme.calls.overrides.length === 2, '自定义配色失败后应保留先前已安装的主题层');
customFail.disposeAll();

// 旧版 Host 会忽略 ?seed= 并返回系统强调色，需识别并报错，避免静默误导用户。
const staleHost = await scenario({
  storage: { 'dsh.stars-material.source': 'custom', 'dsh.stars-material.customSeed': '#abcdef' },
  fetch: () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      ok: true,
      seed: '#00639b',
      light: 'a'.repeat(270),
      dark: 'b'.repeat(270),
    }),
  }),
});
const staleState = staleHost.slots.__registrations[0]?.options?.inject?.()?.state;
check(staleState?.customStale === true, 'Host 返回与请求不一致的种子色时应标记为版本过旧');
check(staleState?.customError === true, '检测到旧版 Host 时应显示错误提示');
check(
  staleHost.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light !== '#aaaaaa',
  '检测到旧版 Host 时不得应用其返回的配色',
);
staleHost.disposeAll();

// ---------------------------------------------------------------------------
// 场景 6：兼容更名前的旧配置键
// ---------------------------------------------------------------------------

// 插件原名 dsh-material-3，对应键为 dsh.material-3.*。改名不得静默重置偏好，
// 因此对旧键仅做一次读取。
const legacy = await scenario({
  storage: { 'dsh.material-3.enabled': '0', 'dsh.material-3.source': 'preset' },
});
check(
  legacy.theme.calls.overrides.length === 0,
  '旧键中的 "enabled: 0" 被忽略，改名重置了偏好',
);
const legacyState = legacy.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  legacyState?.enabled === false,
  `旧偏好未迁移：enabled 为 "${legacyState?.enabled}"`,
);
const legacyPreset = await scenario({
  storage: { 'dsh.material-3.source': 'preset', 'dsh.material-3.preset': 'teal' },
});
check(
  legacyPreset.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base'] !== undefined,
  '旧键的预设模式未安装配色',
);
legacy.disposeAll();
legacyPreset.disposeAll();

// 新键存在时优先于旧键。
const bothKeys = await scenario({
  storage: { 'dsh.stars-material.enabled': '1', 'dsh.material-3.enabled': '0' },
});
check(
  bothKeys.theme.calls.overrides.length === 2,
  '新键未覆盖旧键',
);
bothKeys.disposeAll();

// ---------------------------------------------------------------------------
// 报告
// ---------------------------------------------------------------------------

report();

function report() {
  if (failures.length > 0) {
    process.stderr.write(`self-check FAILED（${failures.length}/${assertions} 条断言失败）\n`);
    for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`tokens        ${productNames.length} 个（其中 ${differInBothSchemes.length} 个区分深浅色）\n`);
  process.stdout.write(`colours       ${literal} 个字面量，${derived} 个派生，${cleared} 个清零\n`);
  process.stdout.write(`bridge        ${bridgeNames.length} 个 --dsh-m3-* 属性\n`);
  process.stdout.write(`themes        ${ids.join(', ')}\n`);
  process.stdout.write(`locales       en + zh, ${Object.keys(en ?? {}).length} 个键对齐\n`);
  process.stdout.write(`scenarios     preset, system, fallback, recovered, disabled, custom, stale, legacy (${assertions} 条断言)\n`);
  process.stdout.write('self-check OK\n');
}
