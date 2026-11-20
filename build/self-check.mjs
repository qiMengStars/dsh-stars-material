/**
 * 已发布 Client 包的离线自检。
 *
 * 在最小桩环境中加载 `plugin/client.js`：模块加载器、三个注入服务（`theme`、
 * `locale`、`slots`）以及 DOM 调用均由替身实现。自检覆盖以下内容：
 *
 *   - 已发布样式表中被赋值的产品令牌均已覆盖；
 *   - 每个值均由 `light`、`dark` 两个非空字符串组成；
 *   - 颜色取值符合 `#rrggbb`、`#rrggbbaa` 或基于字面量的 `color-mix()` 格式；
 *   - Material 3 不绘制的边框令牌解析为 `transparent`，开关轨道与环形仪表的
 *     令牌保留可见前景；
 *   - 高程与阴影令牌均解析为 `none`；
 *   - 状态层令牌定义为叠在配色上的 8%–12% `color-mix()`；
 *   - 采集到的表面阶梯按亮度严格单调；
 *   - `--dsh-m3-*` 桥接属性由 `light-dark()` 同时定义两套配色；
 *   - 两个主题 id 分别按对应的深浅色方案注册；
 *   - 预设、系统、回退、恢复、禁用与旧键场景各自只安装所属层，且均可清理。
 *
 *   node build/self-check.mjs
 *
 * 本脚本校验数据与接线，不涉及运行中的应用的视觉表现。
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

/** 颜色权威样式表，定义与 `build/validate-coverage.mjs` 一致。 */
const COLOUR_SHEET = 'design-platform.css';

// ---------------------------------------------------------------------------
// 仅替身实现 Client 包实际调用的 DOM 接口。
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
// Client 包仅加载一次；每个场景使用独立上下文调用 `apply`，以隔离状态。
// ---------------------------------------------------------------------------

const source = await readFile(BUNDLE, 'utf8');
const dom = createDom();

/**
 * 定时器队列。
 *
 * Client 侧按退避时间表重试强调色查询，Host 不可用时会注册待执行定时器。
 * 手动驱动定时器可缩短自检耗时，并固定重试顺序。
 */
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

/**
 * 执行一个自检场景。
 *
 * @param {object} options
 * @param {Record<string,string>} options.storage   localStorage 初始内容
 * @param {Function|null} options.fetch             `window.fetch` 的替身
 */
async function scenario({ storage, fetch }) {
  const store = new Map(Object.entries(storage ?? {}));
  sandbox.window.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  };
  sandbox.window.fetch = fetch ?? (() => Promise.reject(new Error('no fetch')));

  /** Client 向 Host 请求强调色配色的次数。 */
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
  // 系统模式跨一个 await 产出结果；额外等待一个微任务使两种模式在断言前状态一致。
  await new Promise((tick) => setImmediate(tick));

  /**
   * 驱动重试定时器直至退避队列清空。
   *
   * 断言在退避结束后读取覆盖层，避免读到上一次配色残留的中间状态。
   */
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

/**
 * 颜色权威中声明的名字，排除 `--dsw-static-*` 原始色阶。
 *
 * 颜色契约仅由 `design-platform.css` 定义，因此只有该表的颜色令牌必须参与覆盖。
 * 字体、圆角与缓动变量由其他样式表定义，不属于本主题的覆盖范围。
 */
const declared = new Set();
{
  const css = await readFile(resolve(SURVEY, COLOUR_SHEET), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
}
const expected = [...declared]
  .filter((name) => !name.startsWith('--dsw-static-'))
  .filter((name) => name.startsWith('--dsw-alias-') || name.startsWith('--dsw-specific-'))
  .sort();

/** 全部内置样式表中声明的名字，并纳入经回退读取的令牌。 */
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

// Material 3 不绘制的描边令牌均解析为 transparent，包括 `l3`。
// 原先以 `l3` 作为填充色的规则改为从桥接变量重绘；SVG 仪表轨道保留前景弧线与标签。
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

// 插画类令牌不随深浅色方案变化，表面色令牌必须变化。
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
// 'a' 不是颜色字面量；各角色仍须输出格式正确的颜色值。
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
// 最后一次安装产生两层覆盖：先是令牌，再是桥接属性。
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
// 场景 5：profile 中保留改名前的键
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
  process.stdout.write(`locales       en + zh，${Object.keys(en ?? {}).length} 个键对齐\n`);
  process.stdout.write(`scenarios     preset, system, fallback, recovered, disabled, legacy（${assertions} 条断言）\n`);
  process.stdout.write('self-check OK\n');
}
