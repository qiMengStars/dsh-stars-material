/**
 * 已发布 Client 包的离线自检。
 *
 * 用一个最小的桩来跑 `plugin/client.js`：加载器、它要读的三个服务（`theme`、
 * `locale`、`slots`）以及它发出的 DOM 调用都做了替身，然后断言它装上的每一层：
 *
 *   - 已发布样式表真正读到的产品令牌，全都覆盖到了；
 *   - 每个值都是两个非空字符串组成的 `{ light, dark }`；
 *   - 颜色是 `#rrggbb` / `#rrggbbaa` / 基于字面量的 `color-mix()`；
 *   - Material 3 不画的边框令牌是 `transparent`，而画开关轨道和环形仪表的那一
 *     个仍然可见；
 *   - 所有高程与阴影组合值都解析成 `none`；
 *   - 每个状态层令牌都是叠在配色上的 8%–12% `color-mix()`；
 *   - 抓出来的表面阶梯从最低到最高严格递减；
 *   - `--dsh-m3-*` 桥接属性同时带两套配色；
 *   - 两个主题 id 按对应的深浅色方案注册；
 *   - 预设模式、系统模式、系统模式的回退以及禁用状态各自只装该装的层，并且都
 *     能清理干净。
 *
 *   node build/self-check.mjs
 *
 * 这是逻辑检查，不是观感检查：它证明数据和接线，不证明在运行中的应用里看起来
 * 如何。
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

/** 颜色权威，定义与 `build/validate-coverage.mjs` 完全一致。 */
const COLOUR_SHEET = 'design-platform.css';

// ---------------------------------------------------------------------------
// DOM 桩：只桩这个包真正会发出的调用。
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
// 服务的桩
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
// 跑法：包只加载一次，之后每次都用一份新的上下文调 `apply`，这样各个场景之间
// 不会互相串味。
// ---------------------------------------------------------------------------

const source = await readFile(BUNDLE, 'utf8');
const dom = createDom();

/**
 * 定时器队列。
 *
 * Client 半边会按退避时间表重试强调色查询，所以回答「Host 不可用」的场景现在会
 * 排下待办，而不是在一个微任务里就跑完。手动驱动这些定时器既让自检保持快，又
 * 能把重试顺序看清楚。
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
  localStorage: null, // 每个场景各换一份
  addEventListener() {},
  removeEventListener() {},
  setTimeout: queueTimer,
  clearTimeout: dropTimer,
  fetch: null, // 每个场景各换一份
};
sandbox.window.__ModuleLoader__ = {
  load(options) {
    factory = options.factory;
  },
};
sandbox.document = dom.document;

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'plugin/client.js' });

check(typeof factory === 'function', '这个包没有调用 __ModuleLoader__.load');
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

check(Array.isArray(plugin.inject), '插件没有声明 inject');
check(plugin.inject.includes('theme'), '插件没有声明 theme 服务');
check(typeof plugin.apply === 'function', '插件没有暴露 apply()');

/**
 * 跑一个场景。
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

  /** Client 向 Host 要强调色配色的次数。 */
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
  // 系统模式要跨一个 await 才出结果，预设模式不用；但两种情况下多等一个微任务
  // 都无害，断言能稳就靠这一步。
  await new Promise((tick) => setImmediate(tick));

  /**
   * 把重试退避一次跑到头。
   *
   * 少了这一步，断言看到的是半路状态：还是上一份配色留下的层，而不是最终稳住的
   * 那一份，后者才是用户真正看到的样子。
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
 * 颜色权威里定义的名字，去掉 `--dsw-static-*` 那几组原始色阶。
 *
 * 颜色契约只由 `design-platform.css` 定义，所以只有它的颜色令牌必须出现在覆盖
 * 层里。字体、圆角和缓动变量在别的样式表里，仍归产品管：这个主题对它们没有意
 * 见，覆盖它们只会让这个包的边界更难看清。
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

/** 所有内置样式表里出现过的名字，再加上经回退读到的那几个。 */
const everywhere = new Set(['--dsw-alias-border-selected']);
for (const name of SHIPPED_CSS) {
  const css = await readFile(resolve(SURVEY, name), 'utf8');
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) everywhere.add(match[1]);
}

// ---------------------------------------------------------------------------
// 场景 1：预设模式（同步，不走 Host 往返）
// ---------------------------------------------------------------------------

const preset = await scenario({
  storage: { 'dsh.stars-material.source': 'preset', 'dsh.stars-material.preset': 'baseline' },
});

check(preset.theme.calls.overrides.length === 2, `期望两套覆盖层，实际 ${preset.theme.calls.overrides.length} 套`);

const override = preset.theme.calls.overrides[0];
check(override?.source === 'dsh-stars-material', `覆盖层的 source 是 "${override?.source}"`);
const bridge = preset.theme.calls.overrides[1];
check(bridge?.source === 'dsh-stars-material/bridge', `桥接层的 source 是 "${bridge?.source}"`);

const tokens = override?.tokens ?? {};
const productNames = Object.keys(tokens).sort();

const missing = expected.filter((name) => !productNames.includes(name));
const invented = productNames.filter((name) => !everywhere.has(name));
check(missing.length === 0, `覆盖层缺了这些令牌：${missing.join(', ')}`);
check(invented.length === 0, `覆盖层多出样式表里没有的令牌：${invented.join(', ')}`);

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
    failures.push(`${name} (${scheme})：值格式不对 "${value}"`);
  }
  if (modes.light === modes.dark) sameInBothSchemes.push(name);
  else differInBothSchemes.push(name);
}

check(derived > 0, '没有任何 color-mix() 派生值');
check(cleared > 0, '没有任何令牌被清成 transparent/none');
check(
  literal + derived + cleared === productNames.length * 2,
  `处理了 ${literal + derived + cleared} 个值，对应 ${productNames.length} 个令牌；每个令牌应当两个`,
);

// Material 3 不画的描边。每个边框令牌都变透明，`l3` 也在内：原来拿它当填充色
// 的那四条规则，在样式表里改从桥接变量重绘；两处 SVG 仪表轨道保留自己的前景
// 弧线和标签。
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

// 高程靠色调表达，不靠阴影。
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

// 悬停是叠在表面色上的状态层，永远不是阴影。
for (const name of [
  '--dsw-alias-interactive-bg-hover',
  '--dsw-alias-interactive-bg-active',
  '--dsw-alias-button-primary-hover',
]) {
  const value = tokens[name]?.light ?? '';
  check(
    /^color-mix\(in srgb, #(?:[0-9a-f]{6}) (?:\d+)%, /u.test(value),
    `${name} 必须是状态层的 color-mix，实际是 "${value}"`,
  );
}
check(
  (tokens['--dsw-alias-interactive-bg-hover']?.light ?? '').includes('transparent'),
  '--dsw-alias-interactive-bg-hover 必须混进 transparent，才能在任何表面色上都成立',
);

// 这几样图不能随配色变，而表面色必须变。
for (const name of ['--dsw-alias-bg-mask-photo', '--dsw-alias-border-inverted']) {
  check(tokens[name]?.light === tokens[name]?.dark, `${name} 不能随深浅色变化`);
}
check(!sameInBothSchemes.includes('--dsw-alias-bg-base'), '--dsw-alias-bg-base 在两套配色里完全相同');
check(differInBothSchemes.length > 90, `只有 ${differInBothSchemes.length} 个令牌在深浅色之间有差异`);

// 抓出来的表面阶梯必须递减：最低那级就是最亮的浅色表面。
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

// 桥接属性用 light-dark() 把两套配色都带上。
const bridgeNames = Object.keys(bridge?.tokens ?? {});
check(bridgeNames.length >= 15, `只发布了 ${bridgeNames.length} 个桥接属性`);
for (const name of bridgeNames) {
  check(name.startsWith('--dsh-m3-'), `桥接属性 "${name}" 没有用 --dsh-m3- 前缀`);
  check(
    /^light-dark\(#(?:[0-9a-f]{6}), #(?:[0-9a-f]{6})\)$/u.test(bridge.tokens[name]?.light ?? ''),
    `桥接属性 "${name}" 不是 light-dark() 对`,
  );
}

// 注册的主题。
const ids = preset.theme.calls.registered.map((entry) => `${entry.id}:${entry.colorScheme}`).sort();
check(
  ids.join(',') === 'stars-material-dark:dark,stars-material-light:light',
  `注册的主题是 [${ids.join(', ')}]`,
);
for (const entry of preset.theme.calls.registered) {
  const own = Object.keys(entry.tokens);
  const bad = own.filter((name) => !name.startsWith('--dsw-'));
  check(bad.length === 0, `主题 "${entry.id}" 带了非产品令牌：${bad.join(', ')}`);
  const mismatch = own.filter((name) => entry.tokens[name] !== tokens[name]?.[entry.colorScheme]);
  check(mismatch.length === 0, `主题 "${entry.id}" 与覆盖层对不上`);
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
  check(!Object.keys(en).some((key) => key.startsWith('variant.')), '删掉的 harmony 变体还在翻译表里');
}

// 设置页以它自己的 id 挂到 `settings.section` 上。
check(preset.slots.__registrations.length === 1, `期望一个设置分区，实际 ${preset.slots.__registrations.length} 个`);
check(
  preset.slots.__registrations[0]?.options?.id === 'stars-material',
  '设置分区的 id 不是 "stars-material"',
);
check(
  preset.slots.__registrations[0]?.options?.order === 26,
  '设置分区的 order 不是 26',
);

// 样式表：只一个标签，带着形状刻度、缓动曲线和那几条规则。
check(dom.tags.length === 1, `期望恰好一个 <style>，实际 ${dom.tags.length} 个`);
const sheet = dom.tags[0]?.textContent ?? '';
check(sheet.includes('--dsw-radius-panel'), '注入的样式表里没有形状刻度');
check(sheet.includes('--dsw-m3-ease-emphasized-decelerate'), '样式表里没有缓动曲线');
check(sheet.includes('[role="switch"]'), '样式表里没有开关重绘规则');
check(sheet.includes('prefers-reduced-motion'), '样式表里没有 reduced-motion 保护');
check(!/\._[a-z0-9]+_[a-z0-9]+_\d+/u.test(sheet), '样式表里硬编码了 CSS module 的哈希类名');

preset.disposeAll();
check(preset.theme.calls.disposed >= 4, `只释放了 ${preset.theme.calls.disposed} 层`);
check(dom.tags.length === 0, '<style> 元素没有随插件一起移除');

// ---------------------------------------------------------------------------
// 场景 2：系统模式，Host 正常答复
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

check(system.theme.calls.overrides.length === 2, '系统模式没有装上两套覆盖层');
check(
  system.theme.calls.registered.length === 2,
  `系统模式注册了 ${system.theme.calls.registered.length} 个主题`,
);
// 'a' 不是颜色；每个角色照样必须输出成格式正确的字面量。
const systemTokens = system.theme.calls.overrides[0]?.tokens ?? {};
check(
  systemTokens['--dsw-alias-bg-base']?.light === '#aaaaaa',
  `系统模式没有用 Host 给的配色："${systemTokens['--dsw-alias-bg-base']?.light}"`,
);
const state = system.slots.__registrations[0]?.options?.inject?.()?.state;
check(state?.systemSeed === '#00639b', `设置页没有显示系统种子色："${state?.systemSeed}"`);
system.disposeAll();
check(dom.tags.length === 0, '系统模式的样式表没有随插件一起移除');

// ---------------------------------------------------------------------------
// 场景 3：系统模式，Host 不可用
// ---------------------------------------------------------------------------

const fallback = await scenario({
  storage: { 'dsh.stars-material.source': 'system' },
  fetch: () => Promise.reject(new Error('ECONNREFUSED')),
});

check(fallback.theme.calls.overrides.length === 2, '回退没有装上两套覆盖层');
const fallbackState = fallback.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  fallbackState?.systemSeed === null,
  '设置页必须标注系统取色不可用',
);
check(
  fallback.theme.calls.overrides[0]?.tokens?.['--dsw-alias-bg-base']?.light === '#fdf7ff',
  '回退配色不是 Material 基准',
);
check(
  fallback.attempts() === 4,
  `Host 一直不答复时要重试四次，实际 ${fallback.attempts()} 次`,
);
fallback.disposeAll();
check(dom.tags.length === 0, '回退的样式表没有随插件一起移除');

// 第一次失败不能算数：下一次重试要把层换掉，而不是让整场会话都停在基准配色上。
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
check(recovered.attempts() >= 2, `Host 只被问了 ${recovered.attempts()} 次`);
// 最后一次安装贡献两层：先令牌，再桥接对。
check(
  recovered.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base']?.light === '#aaaaaa',
  '重试成功之后没有换掉回退配色',
);
const recoveredState = recovered.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  recoveredState?.systemSeed === '#00639b',
  `恢复之后的种子色没有报出来："${recoveredState?.systemSeed}"`,
);
recovered.disposeAll();

// ---------------------------------------------------------------------------
// 场景 4：禁用
// ---------------------------------------------------------------------------

const off = await scenario({
  storage: { 'dsh.stars-material.enabled': '0', 'dsh.stars-material.source': 'preset' },
});

check(off.theme.calls.overrides.length === 0, '禁用状态下仍然装了一层覆盖');
check(off.theme.calls.registered.length === 0, '禁用状态下仍然注册了主题');
check(dom.tags.length === 1, '禁用时设置页样式表必须还在');
const offSheet = dom.tags[0]?.textContent ?? '';
check(!offSheet.includes('--dsw-radius-panel'), '只该在启用时出现的规则漏进了禁用状态的样式表');
check(offSheet.includes('-page'), '禁用时设置页样式表不见了');
off.disposeAll();
check(dom.tags.length === 0, '禁用状态的样式表没有随插件一起移除');

// ---------------------------------------------------------------------------
// 场景 5：profile 里还留着改名前的键
// ---------------------------------------------------------------------------

// 插件原来叫 dsh-material-3，写的是 dsh.material-3.*。改名不能悄悄把偏好重置，
// 所以旧键只读一次。
const legacy = await scenario({
  storage: { 'dsh.material-3.enabled': '0', 'dsh.material-3.source': 'preset' },
});
check(
  legacy.theme.calls.overrides.length === 0,
  '旧键里的 "enabled: 0" 被忽略了，改名把用户偏好重置了',
);
const legacyState = legacy.slots.__registrations[0]?.options?.inject?.()?.state;
check(
  legacyState?.enabled === false,
  `旧偏好没有带过来：enabled 是 "${legacyState?.enabled}"`,
);
const legacyPreset = await scenario({
  storage: { 'dsh.material-3.source': 'preset', 'dsh.material-3.preset': 'teal' },
});
check(
  legacyPreset.theme.calls.overrides.at(-2)?.tokens?.['--dsw-alias-bg-base'] !== undefined,
  '旧键的预设模式没有装上配色',
);
legacy.disposeAll();
legacyPreset.disposeAll();

// 新键一旦存在，就必须压过旧键。
const bothKeys = await scenario({
  storage: { 'dsh.stars-material.enabled': '1', 'dsh.material-3.enabled': '0' },
});
check(
  bothKeys.theme.calls.overrides.length === 2,
  '新键没有压过旧键',
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
