/**
 * 主题包的 Client 半边。
 *
 * 按运行顺序，它做了这些事：
 *
 *   1. 读出存档的偏好（是否启用 / 取色来源 / 预设）。
 *   2. 为当前取色来源解析配色。手动模式直接切构建期那张预设表；自动模式向 Host
 *      半边要操作系统强调色以及由它推导的配色，于是浏览器里不用跑任何色彩库。
 *   3. 从这份配色推导出一张扁平的 `Record<token, { light, dark }>`——纯函数，不碰
 *      DOM、不看时钟、不用随机数。
 *   4. 装上几层：
 *        a. `theme.overrideTokens(source, tokens)`——逐令牌换色。层是按令牌叠在当
 *           前主题之上的，所以它既盖得住内置配色，也不用和第三方主题争偏好。
 *        b. `theme.register()` 注册 `stars-material-light` / `stars-material-dark`——
 *           让主题出现在 `getTheme().themes` 里，能像别的主题一样被 `setTheme` 选中。
 *        c. `:root` 上的 `--dsh-m3-*` 桥接属性，样式表就能按角色取色而不必再抄一遍
 *           配色。
 *   5. 注入一个 `<style>`，装令牌注册表表达不了的东西：形状刻度、缓动曲线、原本
 *      由边框色提供的颜料，以及 Material 3 不画的描边。
 *   6. 提供一个设置页。
 *
 * Client 包不能 `require` Harness 的客户端包，所以运行时只 import React，下面每个
 * 控件都是普通元素，靠宿主已经发布的 `--dsw-alias-*` 令牌上样式。
 */

const NS = 'dsh-stars-material';
const SOURCE = 'dsh-stars-material';

const LIGHT_THEME_ID = 'stars-material-light';
const DARK_THEME_ID = 'stars-material-dark';

const STORAGE_PREFIX = 'dsh.stars-material.';
const STORAGE_ENABLED = STORAGE_PREFIX + 'enabled';
const STORAGE_SOURCE = STORAGE_PREFIX + 'source';
const STORAGE_PRESET = STORAGE_PREFIX + 'preset';

/**
 * 插件改名成 `dsh-stars-material` 之前写下的键。
 *
 * 这些键只读、不再写：已经存过偏好的 profile 跨过改名仍然保留，第一次改动才把值
 * 抄到新键上。没有这段，一次改名就会悄悄清掉所有人的设置。
 */
const LEGACY_PREFIX = 'dsh.material-3.';

/** `system` 跟随系统强调色；`preset` 固定用某一个 Material 3 种子色。 */
const SOURCE_SYSTEM = 'system';
const SOURCE_PRESET = 'preset';

const SETTINGS_SECTION_ID = 'stars-material';
const SETTINGS_SECTION_ORDER = 26;

const STYLE_TAG_ID = NS + '/stars-material.css';

/** Host 路由：返回系统强调色和由它推导的配色。 */
const HOST_PALETTE_ROUTE = '/stars-material/palette';

/** 一次 Host 往返到这时还没答复，就不值得再等了。 */
const HOST_TIMEOUT_MS = 1500;

/** 追问强调色的重试时刻表，单位毫秒。 */
const HOST_RETRY_MS = [0, 2000, 6000, 15000];

const ROLE_INDEX = new Map(ROLES.map((role, index) => [role, index]));
const PRESET_INDEX = new Map(PRESETS.map((preset) => [preset.id, preset]));

/** 从压缩的配色串里取一个角色的 `#rrggbb`。 */
function unpackRole(packed, role) {
  const index = ROLE_INDEX.get(role);
  if (index === undefined) {
    throw new Error('Material 3 主题：没有叫 "' + role + '" 的角色');
  }
  const start = index * 6;
  return '#' + packed.slice(start, start + 6);
}

/** 从压缩的配色串里取一个角色的 `#rrggbbaa`。 */
function unpackRoleAlpha(packed, role, alpha) {
  const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return unpackRole(packed, role) + byte.toString(16).padStart(2, '0');
}

function clampPreset(preset) {
  return PRESET_INDEX.has(preset) ? preset : DEFAULT_PRESET;
}

function clampSource(source) {
  return source === SOURCE_SYSTEM ? SOURCE_SYSTEM : SOURCE_PRESET;
}

/** 某个预设 id 在构建期算好的配色。 */
function presetPalette(preset) {
  return PRESET_TABLE[clampPreset(preset)];
}

/**
 * 表里每个值要么是字面量，要么是对两个字面量的 `color-mix()`，所以派生色由浏览器
 * 自己算，发出去的脚本仍然不需要色彩库。
 */
function mixExpression(first, into, weight) {
  return 'color-mix(in srgb, ' + first + ' ' + weight + '%, ' + into + ')';
}

/**
 * 为一份配色建出完整的令牌表。
 *
 * 纯数据：同样的输入永远得到同样的表，所以每次偏好变化都可以重调
 * `overrideTokens`。
 *
 * `palette` 是 `{ light, dark }`，各是一条压缩过的角色串。预设表和 Host 的答复都
 * 是这个形状，所以这里不关心配色是从哪来的。
 */
function buildTokenMap(palette) {
  const light = palette.light;
  const dark = palette.dark;

  const tokens = {};

  const put = (name, lightValue, darkValue) => {
    tokens[name] = { light: lightValue, dark: darkValue };
  };

  const putRole = (name, role) => put(name, unpackRole(light, role), unpackRole(dark, role));

  for (const [name, role] of Object.entries(ROLE_TOKENS)) putRole(name, role);
  for (const [name, role] of Object.entries(ILLUSTRATION_TOKENS)) putRole(name, role);

  for (const [name, value] of Object.entries(LITERAL_TOKENS)) put(name, value, value);

  // 去掉的描边和去掉的阴影都是"这里不许画出任何东西"。
  for (const name of CLEARED_TOKENS) put(name, 'transparent', 'transparent');

  for (const [name, spec] of Object.entries(STATE_LAYER_TOKENS)) {
    if (spec.weight === undefined) {
      putRole(name, spec.role);
      continue;
    }
    const composite = (scheme) => {
      const base = unpackRole(scheme, spec.role);
      return spec.into === null || spec.into === undefined
        ? mixExpression(base, 'transparent', spec.weight)
        : mixExpression(base, unpackRole(scheme, spec.into), spec.weight);
    };
    put(name, composite(light), composite(dark));
  }

  for (const [name, spec] of Object.entries(ALPHA_TOKENS)) {
    if (spec.literal !== undefined) {
      putRole(name, spec.literal);
      continue;
    }
    put(
      name,
      unpackRoleAlpha(light, spec.role, spec.alpha),
      unpackRoleAlpha(dark, spec.role, spec.alpha),
    );
  }

  for (const [name, spec] of Object.entries(MIX_TOKENS)) {
    put(
      name,
      mixExpression(unpackRole(light, spec.role), unpackRole(light, spec.into), spec.weight),
      mixExpression(unpackRole(dark, spec.role), unpackRole(dark, spec.into), spec.weight),
    );
  }

  for (const [name, spec] of Object.entries(DIFF_TOKENS)) {
    if (spec.toward === undefined) {
      putRole(name, spec.role);
      continue;
    }
    put(
      name,
      mixExpression(unpackRole(light, spec.role), unpackRole(light, spec.toward), spec.weight),
      mixExpression(unpackRole(dark, spec.role), unpackRole(dark, spec.toward), spec.weight),
    );
  }

  // 高程组合值会画一道 0.5dp 描边加两层极淡光晕。Material 3 只靠色调表达高程，
  // 所以这七个全部解析成空。
  for (const name of ELEVATION_TOKENS) put(name, 'none', 'none');

  return tokens;
}

/**
 * 给样式表用的桥。
 *
 * 样式表调不到 `unpackRole`，所以每个要过桥的角色都把解析好的值发布成自定义属性。
 * 明暗两套都靠 `light-dark()` 塞进去——这是 CSS 里唯一能把双方案的值装进单个属性
 * 的写法。
 */
function buildBridgeTokens(palette) {
  const out = {};
  for (const { variable, role } of BRIDGE_ROLES) {
    out[variable] =
      'light-dark(' +
      unpackRole(palette.light, role) +
      ', ' +
      unpackRole(palette.dark, role) +
      ')';
  }
  return out;
}

/** `theme.register()` 能带的那部分：只含产品令牌、只含当前方案。 */
function productTokens(tokens, colorScheme) {
  const out = {};
  for (const [name, modes] of Object.entries(tokens)) {
    if (name.startsWith('--dsw-')) out[name] = modes[colorScheme];
  }
  return out;
}

// ---------------------------------------------------------------------------
// 偏好存取
// ---------------------------------------------------------------------------

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

/**
 * 读一项偏好，读不到就退回改名前的键。
 *
 * @param {string} key 现在的键
 * @param {string} legacy 旧前缀下的同一个键
 * @param {string} fallback 两个键都没设时用的值
 */
function readPreference(key, legacy, fallback) {
  const current = readStorage(key, null);
  if (current !== null) return current;
  return readStorage(legacy, fallback);
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 存储被关掉的 profile 只在内存里保留这次选择。
  }
}

function readPreferences() {
  return {
    enabled: readPreference(STORAGE_ENABLED, LEGACY_PREFIX + 'enabled', '1') !== '0',
    source: clampSource(
      readPreference(STORAGE_SOURCE, LEGACY_PREFIX + 'source', SOURCE_SYSTEM),
    ),
    preset: clampPreset(readPreference(STORAGE_PRESET, LEGACY_PREFIX + 'preset', DEFAULT_PRESET)),
  };
}

// ---------------------------------------------------------------------------
// 配色解析
// ---------------------------------------------------------------------------

/**
 * 向 Host 半边要操作系统强调色。
 *
 * 这件事归 Host：读注册表要起子进程，还要一个色彩库，两样都不该进浏览器包。失败是
 * 正常的（没设强调色、不是 Windows、子进程被拦），代价只是配色退回预设。
 */
async function fetchSystemPalette() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), HOST_TIMEOUT_MS);
  try {
    const response = await window.fetch(HOST_PALETTE_ROUTE, { signal: controller.signal });
    if (!response.ok) throw new Error('status ' + response.status);
    const payload = await response.json();
    if (payload.ok !== true || typeof payload.light !== 'string' || typeof payload.dark !== 'string') {
      throw new Error(payload.reason ?? 'unsupported answer');
    }
    return { palette: { light: payload.light, dark: payload.dark }, seed: payload.seed };
  } finally {
    window.clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 样式表
// ---------------------------------------------------------------------------

const SETTINGS_STYLE = `
.${NS}-page { display: flex; flex-direction: column; }
.${NS}-title {
  color: var(--dsw-alias-label-primary);
  font-size: 20px;
  line-height: 28px;
  font-weight: 500;
  margin: 0 0 4px;
}
.${NS}-lede {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  margin: 0 0 8px;
}
.${NS}-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
}
.${NS}-row + .${NS}-row { padding-top: 0; }
.${NS}-row-head { display: flex; align-items: center; gap: 8px; }
.${NS}-row-title { color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 22px; }
.${NS}-row-desc { color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }
.${NS}-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.${NS}-chip {
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  display: inline-flex;
  border: 0;
  /* Material 3 的 chip 是 8dp 圆角矩形，不是胶囊。 */
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}
.${NS}-chip:hover { background: var(--dsw-alias-interactive-bg-hover-solid); }
.${NS}-chip[aria-checked="true"] {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
}
.${NS}-chip[aria-checked="true"] .${NS}-chip-label { font-weight: 500; }
.${NS}-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex: none;
}
.${NS}-toggle { display: inline-flex; align-items: center; gap: 10px; }
.${NS}-switch {
  box-sizing: border-box;
  width: 40px;
  height: 24px;
  border-radius: 999px;
  border: 0;
  background: var(--dsw-alias-bg-layer-3);
  padding: 3px;
  cursor: pointer;
  display: inline-flex;
  transition: background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}
.${NS}-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.${NS}-knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dsw-alias-label-primary-foreground);
  transition: transform var(--dsw-m3-duration-short) var(--dsw-m3-ease-emphasized);
}
.${NS}-switch[aria-checked="true"] .${NS}-knob { transform: translateX(16px); }
.${NS}-note {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-1);
  padding: 10px 12px;
  margin: 0;
}
`;

/**
 * 插入（或刷新）本包的样式表。
 *
 * 加载器给每个包发了 `styles` builtin 就是干这个的。它缺失时（老版本宿主）按文档
 * 退回 `<head>` 里的一个 `<style>` 元素——不碰 `document.body`，也不插第二个标签。
 *
 * 设置页的规则一直在；主题规则（形状刻度、缓动曲线、去描边、桥接变量的使用方）只在
 * 主题开启时写进去，所以关掉它是真的恢复原样。
 */
function installStyles() {
  const selector = 'style[data-plugin-css=' + JSON.stringify(STYLE_TAG_ID) + ']';
  let tag = document.querySelector(selector);
  if (tag === null) {
    tag = document.createElement('style');
    tag.dataset.plugin = NS;
    tag.dataset.pluginCss = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }

  const node = tag;
  const dispose = () => node.remove();

  return {
    apply(enabled) {
      node.textContent = enabled ? SETTINGS_STYLE + THEME_RULES : SETTINGS_STYLE;
    },
    dispose,
  };
}

// ---------------------------------------------------------------------------
// 设置页
// ---------------------------------------------------------------------------

function Chip(props) {
  return h(
    'button',
    {
      type: 'button',
      className: NS + '-chip',
      role: 'radio',
      'aria-checked': props.selected ? 'true' : 'false',
      title: props.title,
      onClick: props.onSelect,
    },
    props.swatch === undefined ? null : h('span', { className: NS + '-swatch', style: { background: props.swatch } }),
    h('span', { className: NS + '-chip-label' }, props.label),
  );
}

function Material3SettingsPage(props) {
  const t = props.t;
  const state = props.state;
  const [draft, setDraft] = React.useState(state);

  React.useEffect(() => {
    setDraft(state);
  }, [state.enabled, state.source, state.preset, state.revision]);

  const commit = (patch) => {
    const next = { enabled: draft.enabled, source: draft.source, preset: draft.preset, ...patch };
    setDraft(next);
    props.onChange(next);
  };

  const manual = draft.source === SOURCE_PRESET;

  return h(
    'div',
    { className: NS + '-page', 'data-dsh-stars-material-settings': '' },
    h('h2', { className: NS + '-title' }, t('page.title')),
    h('p', { className: NS + '-lede' }, t('page.description')),

    h(
      'div',
      { className: NS + '-row' },
      h('span', { className: NS + '-row-title' }, t('page.enabledTitle')),
      h('span', { className: NS + '-row-desc' }, t('page.enabledDescription')),
      h(
        'div',
        { className: NS + '-toggle' },
        h(
          'button',
          {
            type: 'button',
            className: NS + '-switch',
            role: 'switch',
            'aria-checked': draft.enabled ? 'true' : 'false',
            'aria-label': t('page.enabledTitle'),
            title: draft.enabled ? t('page.disable') : t('page.enable'),
            onClick: () => commit({ enabled: !draft.enabled }),
          },
          h('span', { className: NS + '-knob' }),
        ),
        h('span', { className: NS + '-row-desc' }, draft.enabled ? t('page.on') : t('page.off')),
      ),
    ),

    h(
      'div',
      { className: NS + '-row' },
      h('span', { className: NS + '-row-title' }, t('page.sourceTitle')),
      h(
        'span',
        { className: NS + '-row-desc' },
        manual ? t('page.sourcePresetDescription') : describeSystem(state, t),
      ),
      h(
        'div',
        { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.sourceTitle') },
        h(Chip, {
          selected: draft.source === SOURCE_SYSTEM,
          swatch: state.systemSeed,
          label: t('page.sourceSystem'),
          title: state.systemSeed,
          onSelect: () => commit({ source: SOURCE_SYSTEM }),
        }),
        h(Chip, {
          selected: manual,
          label: t('page.sourcePreset'),
          onSelect: () => commit({ source: SOURCE_PRESET }),
        }),
      ),
      manual
        ? h(
            'div',
            { className: NS + '-chips', role: 'radiogroup', 'aria-label': t('page.sourcePreset') },
            PRESETS.map((preset) =>
              h(Chip, {
                key: preset.id,
                selected: preset.id === draft.preset,
                swatch: preset.hex,
                label: t('preset.' + preset.id),
                title: preset.hex,
                onSelect: () => commit({ preset: preset.id }),
              }),
            ),
          )
        : null,
    ),

    h('p', { className: NS + '-note' }, t('page.note')),
  );
}

/**
 * 取色来源标题下面那行说明。
 *
 * 自动模式有三种值得分开说的情况：读到了系统颜色；读到了但配色推不出来；系统颜色压
 * 根拿不到。说清是哪一种，能省掉"我的主题怎么是紫的"这类疑问。
 */
function describeSystem(state, t) {
  if (state.systemSeed === null || state.systemSeed === undefined) return t('page.systemUnavailable');
  return t('page.systemDescription') + ' ' + state.systemSeed;
}

// ---------------------------------------------------------------------------
// 主题层
// ---------------------------------------------------------------------------

/**
 * 为一份已经解析好的配色装上全部主题层。
 *
 * 返回的清理函数只移除这次调用加的东西。`register()` 不接受重复 id，所以换配色时
 * 必须先清理再注册——这也是为什么碰注册表的只有这一处。
 */
function createThemeLayers(theme, enabled, palette) {
  if (!enabled) {
    return { dispose() {} };
  }

  const tokens = buildTokenMap(palette);
  const bridge = buildBridgeTokens(palette);
  const disposers = [];

  if (typeof theme.overrideTokens === 'function') {
    disposers.push(theme.overrideTokens(SOURCE, tokens));
  }

  // 桥接属性走同一套覆盖机制，所以它们和令牌层一样被移除、被重新叠加。
  if (typeof theme.overrideTokens === 'function') {
    const pairs = {};
    for (const [name, value] of Object.entries(bridge)) {
      pairs[name] = { light: value, dark: value };
    }
    disposers.push(theme.overrideTokens(SOURCE + '/bridge', pairs));
  }

  if (typeof theme.register === 'function') {
    const schemes = [
      [LIGHT_THEME_ID, 'light'],
      [DARK_THEME_ID, 'dark'],
    ];
    for (const [id, colorScheme] of schemes) {
      try {
        disposers.push(
          theme.register({ id, colorScheme, tokens: productTokens(tokens, colorScheme) }),
        );
      } catch (error) {
        // 上一次运行残留的注册不是致命的：真正给界面上色的是覆盖层。
        console.error('Material 3 主题：注册 ' + id + ' 失败', error);
      }
    }
  }

  return {
    dispose() {
      while (disposers.length > 0) {
        const dispose = disposers.pop();
        try {
          dispose();
        } catch (error) {
          console.error('Material 3 主题：清理主题层失败', error);
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 插件入口
// ---------------------------------------------------------------------------

function applyClient(ctx) {
  const theme = ctx.get('theme');
  if (theme === undefined) {
    console.error('Material 3 主题：拿不到 "theme" 服务');
    return;
  }

  const locale = ctx.get('locale');
  const slots = ctx.get('slots');

  let translate = (key) => key;
  if (locale !== undefined && typeof locale.register === 'function') {
    ctx.effect(() => locale.register(NS, DICTS), NS + ' locale');
    translate = locale.bind(NS);
  } else if (locale !== undefined && typeof locale.bind === 'function') {
    translate = locale.bind(NS);
  }
  const t = translate;

  const preference = readPreferences();
  const published = {
    enabled: preference.enabled,
    source: preference.source,
    preset: preference.preset,
    systemSeed: null,
    revision: 0,
  };

  /** 此刻正在用的配色。预设模式一开始就知道；自动模式先拿基准配色，让首帧就已经
   *  上了主题，等 Host 答复再换掉。 */
  let resolved = preference.source === SOURCE_PRESET
    ? presetPalette(preference.preset)
    : presetPalette(DEFAULT_PRESET);

  let styles = installStyles();
  ctx.effect(() => {
    return () => styles.dispose();
  }, NS + ' stylesheet');
  styles.apply(preference.enabled);

  /** 此刻生效的主题层；每次换配色都整套替换。 */
  let layers = { dispose() {} };

  ctx.effect(() => {
    return () => {
      layers.dispose();
      layers = { dispose() {} };
    };
  }, NS + ' theme layers');

  const publish = () => {
    published.enabled = preference.enabled;
    published.source = preference.source;
    published.preset = preference.preset;
    published.revision += 1;
  };

  /** 按当前偏好重新装一遍所有层。 */
  const install = () => {
    layers.dispose();
    layers = createThemeLayers(theme, preference.enabled && resolved !== null, resolved);
    styles.apply(preference.enabled);
    publish();
  };

  /** 正在等待的那次重试的句柄，好让换配色时能取消它。 */
  let retryTimer = null;

  const cancelRetry = () => {
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  /**
   * 向 Host 要强调色配色，失败就重试几次。
   *
   * Host 路由是在 Host 半边加载时才注册的，而页面可能比它先就绪——首次启动慢，或者
   * 刷新后新的 Client 撞上上一代 Host。一次失败不该让整个会话都固定在基准配色上，
   * 所以在认可回退之前，会按一个短的退避节奏再问几次。
   */
  const resolveSystem = async (attempt) => {
    retryTimer = null;
    try {
      const answer = await fetchSystemPalette();
      resolved = answer.palette;
      published.systemSeed = answer.seed;
      install();
      return;
    } catch (error) {
      const next = attempt + 1;
      if (next < HOST_RETRY_MS.length) {
        retryTimer = window.setTimeout(() => {
          void resolveSystem(next);
        }, HOST_RETRY_MS[next]);
        return;
      }
      // 回退之后主题照样能用：Material 基准配色本身也是正确的 M3 配色，只是不是
      // 用户自己的颜色。
      console.warn('Material 3 主题：取不到系统强调色，改用基准配色', error);
      resolved = presetPalette(DEFAULT_PRESET);
      published.systemSeed = null;
      install();
    }
  };

  /** 按 `preference.source` 解析配色，然后装上。 */
  const resolve = async () => {
    cancelRetry();
    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      install();
      return;
    }
    await resolveSystem(0);
  };

  const retune = (next) => {
    preference.enabled = next.enabled;
    preference.source = clampSource(next.source);
    preference.preset = clampPreset(next.preset);

    writeStorage(STORAGE_ENABLED, preference.enabled ? '1' : '0');
    writeStorage(STORAGE_SOURCE, preference.source);
    writeStorage(STORAGE_PRESET, preference.preset);

    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      install();
      return;
    }

    // 自动模式要走一次 Host 往返；在它答复之前保持现有主题层，界面就不会闪出一帧
    // 没上色的样子。
    published.source = preference.source;
    published.preset = preference.preset;
    published.enabled = preference.enabled;
    void resolve();
  };

  if (slots !== undefined && typeof slots.inject === 'function') {
    slots.inject('settings.section', () =>
      ctx.slots.register(
        {
          name: 'settings.section',
          id: SETTINGS_SECTION_ID,
          order: SETTINGS_SECTION_ORDER,
          label: () => t('nav.title'),
          locale: NS,
          inject: () => ({
            t,
            state: published,
            onChange: retune,
          }),
        },
        Material3SettingsPage,
      ),
    );
  }

  ctx.effect(() => {
    const onStorage = (event) => {
      if (event.key !== null && !event.key.startsWith(STORAGE_PREFIX)) return;
      const stored = readPreferences();
      preference.enabled = stored.enabled;
      preference.source = stored.source;
      preference.preset = stored.preset;
      void resolve();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, NS + ' storage');

  ctx.effect(() => () => cancelRetry(), NS + ' palette retry');

  // 自动模式是默认值，所以加载时就先解析一次。
  void resolve();
}
const DICTS = {
  en: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 theme',
    'page.description':
      'Material You colour roles, surface tones instead of borders, and state layers instead of shadows. Light and dark are generated together, so the two palettes always agree.',
    'page.enabledTitle': 'Use Material 3 colours',
    'page.enabledDescription':
      'Recolours surfaces, labels, borders and state colours with Material 3 roles. Turn it off to return to the theme you had before.',
    'page.on': 'On',
    'page.off': 'Off',
    'page.enable': 'Enable Material 3',
    'page.disable': 'Disable Material 3',
    'page.sourceTitle': 'Colour source',
    'page.sourceSystem': 'Follow system',
    'page.sourcePreset': 'Pick a colour',
    'page.systemDescription': 'Derived from your Windows accent colour.',
    'page.systemUnavailable': 'No accent colour is set on this system, so the Material baseline palette is used.',
    'page.sourcePresetDescription': 'One of the eight Material 3 seed colours.',
    'page.note':
      'Changes apply immediately and are remembered in this browser, so they survive a reload without restarting the harness.',
    'preset.baseline': 'Baseline',
    'preset.blue': 'Blue',
    'preset.green': 'Green',
    'preset.teal': 'Teal',
    'preset.orange': 'Orange',
    'preset.pink': 'Pink',
    'preset.red': 'Red',
    'preset.blueGrey': 'Blue grey',
  },
  zh: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 主题',
    'page.description':
      '采用 Material You 颜色角色：用色块而不是边框表达层级，用状态层而不是阴影表达交互。明暗两套同时生成，因此始终彼此协调。',
    'page.enabledTitle': '启用 Material 3 配色',
    'page.enabledDescription':
      '用 Material 3 角色重新着色表面、文字、分隔与状态色。关闭后回到你原先使用的主题。',
    'page.on': '已启用',
    'page.off': '已关闭',
    'page.enable': '启用 Material 3',
    'page.disable': '关闭 Material 3',
    'page.sourceTitle': '取色来源',
    'page.sourceSystem': '跟随系统',
    'page.sourcePreset': '自选颜色',
    'page.systemDescription': '由 Windows 强调色推导。',
    'page.systemUnavailable': '此系统未设置强调色，因此使用 Material 基准配色。',
    'page.sourcePresetDescription': '从 8 个 Material 3 官方种子色中选择。',
    'page.note': '修改立即生效，并记忆在本浏览器中，刷新页面即可恢复，无需重启应用。',
    'preset.baseline': '基准紫',
    'preset.blue': '蓝色',
    'preset.green': '绿色',
    'preset.teal': '青色',
    'preset.orange': '橙色',
    'preset.pink': '粉色',
    'preset.red': '红色',
    'preset.blueGrey': '蓝灰',
  },
};
