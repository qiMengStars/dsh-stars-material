/* 由 build/bundle-client.mjs 生成，不要手改。 */
window.__ModuleLoader__.load({
  id: "dsh-stars-material",
  factory: (require) => {
    'use strict';

    const React = require('react');
    const h = React.createElement;

/* ---- src/generated/palettes.js ---- */
/**
 * 由 build/generate-palettes.mjs 生成，不要手改。
 *
 * 每套配色就是一条十六进制字符串：45 个角色 × 6 位，按 ROLES 顺序排，去掉每项开头
 * 的 "#"。取值时按角色切一段，所以发出去的 Client 半边不需要色彩库。要重新生成就跑：
 *
 *   node build/generate-palettes.mjs
 *
 * `PRESET_TABLE` 按预设 id 索引，明暗两套都在里面。预设清单（id、种子色、显示名）
 * 放在 `src/parts/palette-spec.js`，这样设置页和这份产物不会在"有哪些预设"上打架。
 *
 * 内容是 8 个 Material 3 预设 × 2 套方案 = 16 套配色、每套 45 个角色，
 * 全部由单一的 "tonalSpot"（SchemeTonalSpot）调和方式推导。
 */

const ROLES = ["primary","onPrimary","primaryContainer","onPrimaryContainer","secondary","onSecondary","secondaryContainer","onSecondaryContainer","tertiary","onTertiary","tertiaryContainer","onTertiaryContainer","error","onError","errorContainer","onErrorContainer","background","onBackground","surface","onSurface","surfaceVariant","onSurfaceVariant","outline","outlineVariant","shadow","scrim","inverseSurface","inverseOnSurface","inversePrimary","surfaceDim","surfaceBright","surfaceContainerLowest","surfaceContainerLow","surfaceContainer","surfaceContainerHigh","surfaceContainerHighest","surfaceTint","success","onSuccess","successContainer","onSuccessContainer","warning","onWarning","warningContainer","onWarningContainer"];

const PRESET_TABLE = {"baseline":{"light":"65558fffffffe9ddff4d3d75625b71ffffffe8def84a44587e5260ffffffffd9e3633b48ba1a1affffffffdad693000afdf7ff1d1b20fdf7ff1d1b20e7e0eb49454e7a757fcac4cf000000000000322f35f5eff7cfbdfeded8e0fdf7fffffffff8f2faf2ecf4ece6eee6e0e965558f296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"cfbdfe36275d4d3d75e9ddffcbc2db332d414a4458e8def8efb8c84a2532633b48ffd9e3ffb4ab69000593000affdad6141218e6e0e9141218e6e0e949454ecac4cf948f9949454e000000000000e6e0e9322f3565558f1412183b383e0f0d131d1b20211f242b292f36343acfbdfe91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"blue":{"light":"2f628cffffffcee5ff0e4a7351606fffffffd5e4f73a485768587affffffeedbff504061ba1a1affffffffdad693000af7f9ff181c20f7f9ff181c20dee3eb42474e72777fc2c7cf0000000000002d3135eff1f69bcbfbd8dae0f7f9fffffffff1f3f9eceef3e6e8eee0e2e82f628c296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"9bcbfb0033530e4a73cee5ffb9c8da2332403a4857d5e4f7d3bfe6382a49504061eedbffffb4ab69000593000affdad6101418e0e2e8101418e0e2e842474ec2c7cf8c919842474e000000000000e0e2e82d31352f628c10141836393e0b0f12181c201c2024272a2f3235399bcbfb91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"green":{"light":"3b6939ffffffbcf0b423502452634fffffffd5e8cf3b4b3838656affffffbcebf01f4d52ba1a1affffffffdad693000af7fbf1191d17f7fbf1191d17dee5d842494072796fc2c9bd0000000000002d322ceff2e9a1d39ad8dbd2f7fbf1fffffff1f5ececefe6e6e9e0e0e4db3b6939296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"a1d39a0a390f235024bcf0b4baccb32534233b4b38d5e8cfa0cfd400363b1f4d52bcebf0ffb4ab69000593000affdad610140fe0e4db10140fe0e4db424940c2c9bd8c9388424940000000000000e0e4db2d322c3b693910140f363a340b0f0a191d171d211b272b25323630a1d39a91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"teal":{"light":"006a6affffff9cf1f0004f4f4a6363ffffffcce8e7324b4b4b607cffffffd3e4ff334863ba1a1affffffffdad693000af4fbfa161d1df4fbfa161d1ddae5e43f49486f7979bec9c80000000000002b3231ecf2f180d5d4d5dbdaf4fbfaffffffeff5f4e9efeee3e9e9dde4e3006a6a296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"80d5d4003737004f4f9cf1f0b0cccb1b3534324b4bcce8e7b3c8e81c314b334863d3e4ffffb4ab69000593000affdad60e1514dde4e30e1514dde4e33f4948bec9c88893923f4948000000000000dde4e32b3231006a6a0e1514343a3a090f0f161d1d1a2121252b2b2f363680d5d491d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"orange":{"light":"87521cffffffffdcc16b3b04735943ffffffffdcc15a422d5b6238ffffffdfe7b2434a22ba1a1affffffffdad693000afff8f5221a14fff8f5221a14f3dfd151443a837469d6c3b6000000000000372f28feeee3ffb779e6d7cdfff8f5fffffffff1e8fbebe1f5e5dbefe0d587521c296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb7794c27006b3b04ffdcc1e3c0a5412c195a422dffdcc1c3cb972d330e434a22dfe7b2ffb4ab69000593000affdad619120cefe0d519120cefe0d551443ad6c3b69e8e8251443a000000000000efe0d5372f2887521c19120c413730130d08221a14261e183128223c332cffb77991d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"pink":{"light":"8c4a60ffffffffd9e270334974565fffffffffd9e25a3f477c5635ffffffffdcc2623f20ba1a1affffffffdad693000afff8f822191cfff8f822191cf2dde2514347837377d5c2c6000000000000372e30fdedefffb0c8e6d6d9fff8f8fffffffff0f2faeaedf5e4e7efdfe18c4a60296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb0c8541d32703349ffd9e2e2bdc64229315a3f47ffd9e2efbd9448290c623f20ffdcc2ffb4ab69000593000affdad6191113efdfe1191113efdfe1514347d5c2c69e8c90514347000000000000efdfe1372e308c4a60191113413739140c0e22191c261d2031282a3c3235ffb0c891d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"red":{"light":"904a42ffffffffdad573342c775652ffffffffdad55d3f3b705c2efffffffcdfa6574419ba1a1affffffffdad693000afff8f7231918fff8f7231918f5ddda534341857370d8c2be000000000000392e2cffedeaffb4aae8d6d3fff8f7fffffffff0eefceae7f7e4e1f1dedc904a42296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb4aa561e1873342cffdad5e7bdb74429265d3f3bffdad5dfc38c3e2e04574419fcdfa6ffb4ab69000593000affdad61a1110f1dedc1a1110f1dedc534341d8c2bea08c89534341000000000000f1dedc392e2c904a421a1110423735140c0b231918271d1c3228263d3231ffb4aa91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"blueGrey":{"light":"475d91ffffffd9e2ff2e4578575e71ffffffdce2f9404659725572fffffffdd7fa593d5aba1a1affffffffdad693000afaf8ff1a1b20faf8ff1a1b20e1e2ec44464f757780c5c6d00000000000002f3036f1f0f7b0c6ffdad9e0faf8fffffffff4f3faeeedf4e8e7efe2e2e9475d91296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"b0c6ff152e602e4578d9e2ffc0c6dc293042404659dce2f9e0bbde412742593d5afdd7faffb4ab69000593000affdad6121318e2e2e9121318e2e2e944464fc5c6d08f909944464f000000000000e2e2e92f3036475d9112131838393f0c0e131a1b201e1f25282a2f33353ab0c6ff91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"}};

/* ---- src/parts/palette-spec.js ---- */
/**
 * 生成器、Host 端引擎与运行时共用的角色顺序。
 *
 * 前 36 项直接从 `DynamicScheme` 实例上读（它们是 MaterialDynamicColors 为每种
 * M3 方案派生的 ARGB getter）。`surfaceTint` 不是 DynamicScheme 的 getter，生成器
 * 改从 `MaterialDynamicColors.surfaceTint` 取。
 *
 * 后 8 项是 Material 3 没有定义、但聊天应用需要的语义色对（成功 / 警告）。它们
 * 取自固定的色调板，所以无论种子色是什么，都保持可辨认的绿色与琥珀色。
 */
const ROLE_ORDER = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
];

/** 这些角色来自固定色调板，而不是种子色。 */
const FIXED_ROLE_ORDER = [
  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',
  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',
];

/** DynamicScheme 直接暴露的 36 个角色。 */
const SCHEME_ROLE_ORDER = ROLE_ORDER;

/**
 * 本插件只带一种调和方式。
 *
 * Material 3 有九种方案变体，全都提供过之后设置页变成了取色器，配色也没法用一句
 * 话说清。色调斑点（tonal spot）是 M3 的默认方案，也是文档里最先介绍的一种，因此
 * 只保留它。变体 id 仍留在数据结构里，因为存档的偏好和生成的表还按它取键。
 */
const VARIANT_ID = 'tonalSpot';

/** 实现 {@link VARIANT_ID} 的 material-color-utilities 类名。 */
const VARIANT_CLASS = 'SchemeTonalSpot';

/**
 * 手动模式下提供的 8 个 Material 3 预设。
 *
 * 种子色取自 M3 为自己基线配色公布的色值，所以选一个预设得到的就是文档里那张
 * `#6750A4` 角色表，而不是它的近似值。自动模式完全不用这份列表——它在运行时从
 * 操作系统强调色推导配色。
 */
const PRESETS = [
  { id: 'baseline', hex: '#6750a4', label: 'Material baseline' },
  { id: 'blue', hex: '#00639b', label: 'Blue' },
  { id: 'green', hex: '#006e1c', label: 'Green' },
  { id: 'teal', hex: '#006a6a', label: 'Teal' },
  { id: 'orange', hex: '#8e4e00', label: 'Orange' },
  { id: 'pink', hex: '#984061', label: 'Pink' },
  { id: 'red', hex: '#b3261e', label: 'Red' },
  { id: 'blueGrey', hex: '#525e7d', label: 'Blue grey' },
];

/** 读不到系统颜色时使用的预设。 */
const DEFAULT_PRESET = 'baseline';

/**
 * 样式表需要、但 DSH 没提供的颜色。
 *
 * 运行时把每一项解析出的角色写成 `:root` 上的 `--dsh-m3-*` 自定义属性，样式表只
 * 引用这些属性。列表放在这里，是为了让生成器、Host 引擎与 Client 对"哪些角色要过
 * 桥"保持一致。
 */
const BRIDGE_ROLES = [
  { variable: '--dsh-m3-surface', role: 'surface' },
  { variable: '--dsh-m3-surface-container-lowest', role: 'surfaceContainerLowest' },
  { variable: '--dsh-m3-surface-container-low', role: 'surfaceContainerLow' },
  { variable: '--dsh-m3-surface-container', role: 'surfaceContainer' },
  { variable: '--dsh-m3-surface-container-high', role: 'surfaceContainerHigh' },
  { variable: '--dsh-m3-surface-container-highest', role: 'surfaceContainerHighest' },
  { variable: '--dsh-m3-on-surface', role: 'onSurface' },
  { variable: '--dsh-m3-on-surface-variant', role: 'onSurfaceVariant' },
  { variable: '--dsh-m3-outline', role: 'outline' },
  { variable: '--dsh-m3-outline-variant', role: 'outlineVariant' },
  { variable: '--dsh-m3-primary', role: 'primary' },
  { variable: '--dsh-m3-on-primary', role: 'onPrimary' },
  { variable: '--dsh-m3-primary-container', role: 'primaryContainer' },
  // 选中行的填充和实心色调按钮都需要第二层容器色；没有这两项，样式表只能借用
  // `primary`，而那不是容器该用的角色。
  { variable: '--dsh-m3-secondary-container', role: 'secondaryContainer' },
  { variable: '--dsh-m3-on-secondary-container', role: 'onSecondaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];

/* ---- src/parts/token-map.js ---- */
/**
 * 本插件接管的 DSH 令牌，按基础样式表的分层方式分组。这里出现的每个名称都由
 * DSH 随包样式表声明过，所以不会覆盖出一个产品从不读取的变量。
 *
 * 映射遵循 Material 3 的两条规则，而不是产品自己的分层模型：
 *
 *   1. 层级用表面容器色调阶梯表达，既不用描边，也不用投影。四个浅色边框令牌因此
 *      变成 `transparent`，高程组合值变成 `none`。
 *   2. 交互用 on-surface 状态层表达，不透明度按规范取（悬停 8%、按压 12%），不用
 *      阴影。
 */

/** 值就是一个 M3 角色的令牌。 */
const ROLE_TOKENS = {
  '--dsw-alias-brand-primary': 'primary',
  '--dsw-alias-brand-primary-invert': 'inversePrimary',
  '--dsw-alias-label-primary': 'onSurface',
  '--dsw-alias-label-primary-dimmed': 'onSurface',
  '--dsw-alias-label-secondary': 'onSurfaceVariant',
  // 三级文字是产品里用得最多的次要墨色（430 条规则：时间戳、占位符、提示）。M3 给
  // 这种墨色配 on-surface-variant；`outline` 留给控件边界，12px 文字压在容器色上
  // 太浅了。
  '--dsw-alias-label-tertiary': 'onSurfaceVariant',
  '--dsw-alias-label-caption': 'onSurfaceVariant',
  '--dsw-alias-label-dimmed': 'outlineVariant',
  '--dsw-alias-menu-icon': 'onSurfaceVariant',

  // 表面阶梯：每一层比页面浅一档（浅色）或深一档（深色），于是嵌套本身就有高程
  // 感，一根描边都不用。
  '--dsw-alias-bg-base': 'surface',
  '--dsw-alias-bg-layer-1': 'surfaceContainerLow',
  '--dsw-alias-bg-layer-2': 'surfaceContainer',
  '--dsw-alias-bg-layer-3': 'surfaceContainerHigh',
  '--dsw-alias-bg-module-platform': 'surfaceContainer',
  '--dsw-alias-bg-multi-select': 'surfaceContainerHigh',
  '--dsw-alias-bg-overlay': 'surfaceContainerHighest',

  '--dsw-alias-button-info-fill': 'primary',
  '--dsw-alias-state-error-primary': 'error',
  '--dsw-alias-state-error-secondary': 'onErrorContainer',
  '--dsw-alias-state-success-primary': 'success',
  '--dsw-alias-state-success-secondary': 'onSuccessContainer',
  '--dsw-alias-state-success-tertiary': 'successContainer',
  '--dsw-alias-state-warn-primary': 'warning',
  '--dsw-alias-state-warn-secondary': 'onWarningContainer',
  '--dsw-alias-state-warn-tertiary': 'warningContainer',
  '--dsw-alias-state-warn-label': 'onWarningContainer',
  '--dsw-alias-state-idle-primary': 'outlineVariant',
  '--dsw-alias-switch-thumb': 'onPrimary',
  '--dsw-alias-link': 'primary',
  '--dsw-alias-markdown-code-block': 'surfaceContainerHigh',
  '--dsw-alias-markdown-code-block-banner': 'surfaceContainerHighest',
  '--dsw-alias-markdown-inline-code': 'surfaceContainerHigh',
  '--dsw-alias-markdown-citation': 'surfaceContainerHigh',
  '--dsw-alias-markdown-tag': 'surfaceContainerHighest',
  '--dsw-alias-markdown-placeholder': 'surfaceContainerHighest',
  '--dsw-alias-turn-trigger-bg': 'surfaceContainerHigh',
  '--dsw-alias-label-primary-foreground': 'onPrimary',
  '--dsw-alias-label-primary-inverted': 'inverseOnSurface',
  '--dsw-alias-toast-bg': 'inverseSurface',
  '--dsw-alias-toast-label': 'inverseOnSurface',
  '--dsw-alias-tooltip-bg': 'inverseSurface',
  '--dsw-alias-bg-document-preview': 'surfaceContainerHigh',
  '--dsw-alias-label-document-preview': 'onSurfaceVariant',
  '--dsw-alias-scrollbar-bg-l1': 'surfaceContainerHighest',
  '--dsw-alias-scrollbar-bg-l2': 'surfaceContainerHighest',
  '--dsw-alias-scrollbar-hover-l1': 'outlineVariant',
  '--dsw-alias-scrollbar-hover-l2': 'outlineVariant',
  '--dsw-alias-code-diff-added': 'successContainer',
  '--dsw-alias-code-diff-deleted': 'errorContainer',
  '--dsw-alias-menu-group-header-fill': 'surfaceContainerHighest',
  '--dsw-alias-button-ghost-active-fill': 'surfaceContainerHigh',
  '--dsw-alias-button-ghost-active-hover': 'surfaceContainerHighest',
  // 抬升按钮就是 M3 的实心色调按钮：用第二层容器色填充，才像是"容器页面上的一个
  // 控件"。它原先和侧栏共用填充，结果"新会话"和背后的表面同色，等于看不见。
  '--dsw-alias-button-elevated-fill': 'secondaryContainer',
  '--dsw-alias-button-floating-fill': 'surfaceContainer',
  '--dsw-alias-button-floating-hover': 'surfaceContainerHigh',
  '--dsw-alias-button-contrast-fill': 'inverseSurface',
  '--dsw-alias-state-business-primary': 'primary',
  '--dsw-alias-state-business-tertiary': 'primaryContainer',
  '--dsw-alias-state-done-primary': 'primary',
  '--dsw-alias-markdown-code-segment-selected': 'surfaceContainerHighest',
  '--dsw-alias-markdown-code-segment-unselected': 'surfaceContainerLow',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': 'primary',
  '--dsw-alias-brand-text': 'onSurface',
  '--dsw-alias-label-primary-bluish': 'primary',
  '--dsw-alias-label-on-color': 'onPrimary',

  // 卡片是表面而不是面板：比页面高一档，悬停时再高一档——M3 就是这样表示可悬停
  // 表面的。
  '--dsw-alias-card-fill': 'surfaceContainerLow',
  '--dsw-alias-card-fill-hover': 'surfaceContainer',
  '--dsw-alias-hovercard-bg': 'inverseSurface',
  '--dsw-alias-hovercard-label-primary': 'inverseOnSurface',
  '--dsw-alias-hovercard-label-secondary': 'inverseOnSurface',
  '--dsw-alias-hovercard-label-tertiary': 'inverseOnSurface',
  '--dsw-alias-hovercard-state-done': 'tertiary',
  '--dsw-alias-hovercard-state-error': 'error',
  '--dsw-alias-toast-action': 'inversePrimary',
  '--dsw-alias-tooltip-label': 'inverseOnSurface',

  // 图表系列与轨迹强调色是数据色：第一条系列用强调角色，于是它和别的东西一样跟着
  // 种子色走。
  '--dsw-alias-chart-messages': 'primary',
  '--dsw-alias-chart-system': 'outline',
  '--dsw-alias-chart-tools': 'tertiary',
  '--dsw-alias-trajectory-accent': 'primary',

  // JSON 查看器是个语法高亮器；键、值和标点各用不同角色，不再固定成蓝紫品红。
  '--dsw-alias-json-tree-icon': 'onSurfaceVariant',
  '--dsw-alias-json-tree-keyword': 'primary',
  '--dsw-alias-json-tree-number': 'primary',
  '--dsw-alias-json-tree-property': 'tertiary',
  '--dsw-alias-json-tree-punctuation': 'onSurface',
  '--dsw-alias-json-tree-string': 'error',

  '--dsw-specific-guide-hero': 'surfaceContainerHigh',
  '--dsw-specific-sidebar-right-flash': 'primary',

  // 没有描边做分隔之后，浮层改成实色：原先"半透明菜单叠在半透明菜单上"才是产品
  // 表达层级的方式，去了描边就撑不住了。
  '--dsw-menu-surface-fill': 'surfaceContainerHigh',
  '--dsw-specific-menu': 'surfaceContainerHigh',
  '--dsw-specific-selector': 'surfaceContainerHigh',
  '--dsw-specific-login-input': 'surfaceContainerHigh',
  // 输入框比菜单再高一档，浮层里的输入框才不会糊进背景。
  '--dsw-specific-input-major': 'surfaceContainerHighest',
  '--dsw-specific-tip': 'surfaceContainerHighest',
  '--dsw-specific-sidebar-fill': 'surfaceContainerLow',
  '--dsw-specific-bubble': 'secondaryContainer',
  '--dsw-specific-bubble-highlight': 'onSecondaryContainer',
  '--dsw-specific-sidebar-nav-item-active': 'secondaryContainer',
  '--dsw-specific-sidebar-nav-item-active-accent': 'onSecondaryContainer',
};

/**
 * 必须消失的令牌。
 *
 * `border-l1`/`l2`/`l4` 是产品的浅色分隔线（4%–16% 不透明度）。它们还被 14 条分隔
 * 线、开关轨道和高程组合值当作颜料使用，所以要紧的那几处改由样式表显式重绘，剩下
 * 的直接在这里变透明。
 */
const CLEARED_TOKENS = [
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l2-darkmode-thin',
  // `border-l3` 是最后一处看得见的轮廓：「新会话」按钮、文件树面板边缘以及另外 68
  // 处边框都读它。还有四条规则拿它当填充（开关轨道、三条发丝分隔线），两个 SVG 环
  // 拿它当描边。清空它是做到零轮廓的唯一办法；那几处填充改由
  // src/client/stylesheet.js 用 `--dsh-m3-outline-variant` 重绘，两个仪表轨道靠自己
  // 的前景弧和文字标签保持可读。
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-settings-card-stroke',
  '--dsw-alias-button-ghost-active-border',
  '--dsw-alias-border-selected',
  '--dsw-alias-border-inverted',
  '--dsw-alias-border-inverted2',
  // 高程组合值用它来画描边，而每个重绑它的组件都指向上面的某个边框令牌。
  '--dsw-elevation-stroke-color',
];

/**
 * 状态层。
 *
 * Material 3 靠把内容色以固定不透明度叠在容器色上来表示交互，所以每一项都是一个角
 * 色混进 `transparent` 或另一个角色的 `color-mix`。权重取 M3 状态层的规范不透明度。
 */
const STATE_LAYER_TOKENS = {
  '--dsw-alias-interactive-bg-hover': { role: 'onSurface', weight: 8, into: null },
  '--dsw-alias-interactive-bg-hover-solid': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-interactive-bg-active': { role: 'onSurface', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-accent': { role: 'primary', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-danger': { role: 'error', weight: 12, into: null },
  '--dsw-alias-turn-trigger-bg-hover': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-button-primary-fill': { role: 'primary' },
  // 实心按钮悬停是把 on-primary 叠到 primary 上，这样不用阴影也能看出悬停。
  '--dsw-alias-button-primary-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
  '--dsw-alias-button-primary-dimmed': { role: 'onPrimary', weight: 12, into: 'primary' },
  '--dsw-alias-button-info-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
};

/**
 * 保留 alpha 通道的令牌。M3 没有半透明表面角色，所以生成器按固定不透明度从对应角
 * 色推导——基础主题依赖它们做遮罩、选区填充和骨架微光。
 */
const ALPHA_TOKENS = {
  '--dsw-alias-bg-mask-1': { role: 'scrim', alpha: 0.32 },
  '--dsw-alias-bg-mask-2': { role: 'scrim', alpha: 0.12 },
  '--dsw-alias-bg-mask-3': { role: 'scrim', alpha: 0.48 },
  '--dsw-alias-bg-skeleton': { role: 'onSurface', alpha: 0.06 },
  '--dsw-alias-bg-document-selection': { role: 'primary', alpha: 0.3 },
  // 卡片瓷片是页面色的一层薄雾：alpha 留着，颜色换成角色。
  '--dsw-alias-card-tile-fill': { role: 'onSurface', alpha: 0.04 },
  '--dsw-alias-json-tree-hover': { role: 'onSurface', alpha: 0.08 },
  '--dsw-specific-file-upload-track': { role: 'onSurface', alpha: 0.08 },
  // 毛玻璃侧栏保留自己表面色的一层半透明薄膜。
  '--dsw-specific-sidebar-glass-fill': { role: 'surfaceContainerLow', alpha: 0.55 },
  '--dsw-specific-sidebar-glass-hover': { role: 'surfaceContainerLow', alpha: 0.3 },
  '--dsw-specific-sidebar-glass-collapsed-fill': { role: 'surfaceContainerLow', alpha: 0.55 },
  '--dsw-specific-sidebar-glass-collapsed-hover': { role: 'surfaceContainerLow', alpha: 0.3 },
  '--dsw-specific-sidebar-tint': { role: 'primary', alpha: 0.06 },
  '--dsw-specific-sidebar-wash-top': { role: 'primary', alpha: 0.08 },
  '--dsw-specific-sidebar-wash-bottom': { role: 'tertiary', alpha: 0.06 },
  '--dsw-specific-sidebar-wash-top-clear': { role: 'primary', alpha: 0 },
  '--dsw-specific-sidebar-wash-bottom-clear': { role: 'tertiary', alpha: 0 },
};

/**
 * 基础值由两个角色混合而成的令牌。它们生成成 `color-mix` 表达式，让浏览器按当下
 * 的令牌值自己算。
 */
const MIX_TOKENS = {
  '--dsw-alias-label-deep-diving': { role: 'primary', into: 'onSurface', weight: 70 },
  '--dsw-alias-label-deep-diving-shimmer': { role: 'primary', into: 'onSurface', weight: 30 },
  '--dsw-alias-tooltip-key-bg': { role: 'onSurface', into: 'inverseSurface', weight: 18 },
  '--dsw-alias-label-shimmer': { role: 'onSurface', into: 'surface', weight: 30 },
};

/** 保持字面量的令牌：它们描述的是插图，不是主题表面。 */
const LITERAL_TOKENS = {
  '--dsw-alias-bg-mask-photo': '#000000e0',
  '--dsw-alias-bg-mask-drop': '#ffffffb3',
  '--dsw-alias-button-tool-bar-fill': '#54555780',
  '--dsw-alias-button-tool-bar-fill-invisible': '#1f1f1f5c',
  '--dsw-alias-button-tool-bar-hover': '#54555799',
};

/**
 * 差分令牌：M3 没有增删色对，所以把成功容器色和错误容器色往表面色方向兑出来。
 */
const DIFF_TOKENS = {
  '--dsw-alias-file-diff-added-bg': { role: 'successContainer' },
  '--dsw-alias-file-diff-added-gutter': { role: 'successContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-added-marker': { role: 'success' },
  '--dsw-alias-file-diff-deleted-bg': { role: 'errorContainer' },
  '--dsw-alias-file-diff-deleted-gutter': { role: 'errorContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-deleted-marker': { role: 'error' },
};

/** 剩下的 M3 角色，对应到 DSH 的插画令牌。 */
const ILLUSTRATION_TOKENS = {
  '--dsw-alias-illustration-background': 'surfaceContainerLow',
  '--dsw-alias-illustration-surface': 'surfaceContainerHighest',
  '--dsw-alias-illustration-backing': 'outlineVariant',
  '--dsw-alias-illustration-detail': 'outline',
  '--dsw-alias-illustration-inset': 'surfaceContainerHigh',
  '--dsw-alias-illustration-shadow': 'surfaceContainerHigh',
};

/**
 * 高程组合值与阴影档位。
 *
 * 这五个名称就是 DSH 里"深度"的全部视觉语言：一道 0.5dp 描边加两层极淡光晕。
 * Material 3 只靠色调表达深度，所以它们全部解析成 `none`。有两类组件会在自己的元
 * 素上重绑 `--dsw-elevation-stroke-color`，所以清的是组合值本身，不只是它的颜色。
 */
const ELEVATION_TOKENS = [
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv2',
  '--dsw-shadow-lv3',
  '--dsw-elevation-stroke',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
];

/** M3 的形状刻度，用 DSH 自带的六档圆角表达。 */
const SHAPE_TOKENS = {
  '--dsw-radius-xs': '4px',
  '--dsw-radius-sm': '8px',
  '--dsw-radius-md': '12px',
  '--dsw-radius-lg': '16px',
  '--dsw-radius-xl': '20px',
  '--dsw-radius-panel': '28px',
};

/** 缓动与时长，作为 CSS 变量交给样式表那半边用。 */
const MOTION_TOKENS = {
  '--dsw-m3-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--dsw-m3-ease-standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  '--dsw-m3-ease-standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  '--dsw-m3-ease-emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
  '--dsw-m3-ease-emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  '--dsw-m3-ease-emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  '--dsw-m3-duration-short': '150ms',
  '--dsw-m3-duration-medium': '300ms',
  '--dsw-m3-duration-long': '500ms',
};

/* ---- src/client/stylesheet.js ---- */
/**
 * 主题的样式表那一半。
 *
 * 覆盖令牌能给任何通过自定义属性取色的东西换色，但它删不掉一条声明，也重画不了
 * 那些"颜料本身来自被本主题透明化的令牌"的规则。这张表正好补这三类缺口：
 *
 *   1. 原本拿边框色当颜料的地方。有几条分隔线、进度条轨道和表格行分隔是用
 *      --dsw-alias-border-l1 / l2 / l3 / l4 上色的。这些令牌现在透明了，所以其中
 *      选择器稳定的那几处改用表面阶梯重绘。
 *   2. 必须消失的声明。Material 3 不在输入框或错误徽标外面画描边，所以这些边框声
 *      明归零。只动 border*，绝不动 outline，那是焦点系统的地盘。
 *   3. 令牌装不下的值。圆角刻度、缓动曲线和交互转场。
 *
 * 其余都交给令牌层。下面没有任何一条规则写到 CSS Module 哈希类名、产品类名或布局
 * 的一角：选择器只有标签名、ARIA 角色和 data 属性，这正是它能在 DSH 升级后继续管
 * 用的原因。
 */


const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/**
 * 只在主题开启时才有意义的规则。
 *
 * 桥接变量（--dsh-m3-*）由主题令牌层写入，所以下面每个值都会自动跟着当前配色走。
 */
const THEME_RULES = `
:root {
${declarations(SHAPE_TOKENS)}
${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. 原来拿边框令牌当颜料的地方
 * ------------------------------------------------------------------------- */

/* Markdown 与通用分隔线：改成 outline-variant 色调的 1dp 细线，而不是 10% 黑
 * 的 0.5dp 发丝线。 */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* 菜单和列表里的分组分隔。 */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* 上传/任务进度条轨道：用容器色调，这样压在上面的主色进度条才是这一行里唯一
 * 饱和的东西。 */
progress {
  border: 0;
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
  overflow: hidden;
}

progress::-webkit-progress-bar {
  background: var(--dsh-m3-surface-container-highest);
  border-radius: 999px;
}

/* 开关轨道原本用 border-l3 上色，而那个令牌在本主题里是透明的，所以改由
 * outline-variant 色调重绘：够看得出是个轨道，又不至于变成一条分割线。 */
[role="switch"][aria-checked="false"] {
  background: var(--dsh-m3-outline-variant);
}

[role="switch"][aria-checked="true"] {
  background: var(--dsh-m3-primary);
}

/* 原先靠 1dp 发丝线分隔的表格行。 */
tr[data-turn-start="true"]:not(:first-child) > td {
  box-shadow: inset 0 1px 0 var(--dsh-m3-outline-variant);
}

/* ---------------------------------------------------------------------------
 * 1b. 选中的行用容器色调
 * ------------------------------------------------------------------------- */

/* 产品给选中的会话行和悬停的行用的是同一个令牌，两个状态因此分不出来，而且悬停看
 * 起来比选中还重（8% 状态层叠在侧栏色上，比这一行的静息填充还深）。Material 3 用
 * 角色区分：悬停是表面上的状态层，选中是容器色调。 */
[role="treeitem"][aria-selected="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* ---------------------------------------------------------------------------
 * 2. Material 3 不画的描边
 * ------------------------------------------------------------------------- */

/* 填充式输入框：由容器色调托着输入区，聚焦靠下面这圈环表示，而不是把边框染成主
 * 色。这会盖掉那些"把 outline 设成 none、改用 border 表示聚焦"的组件规则——它只
 * 加环，从不删环。 */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* 错误、警告、成功徽标靠填充色和文字色传达语义，围在外面的那圈轮廓去掉。
 * box-shadow 不动，差分行的内嵌竖条才能继续工作。 */
[aria-invalid="true"],
[data-state="error"],
[data-state="failed"],
[data-state="done"],
[data-state="warning"],
[data-failed="true"],
[data-tone="error"],
[data-tone="warn"],
[role="alert"] {
  border-color: transparent;
}

/* ---------------------------------------------------------------------------
 * 3. 交互与动效
 * ------------------------------------------------------------------------- */

/* Material 3 用标准曲线做颜色过渡，强调曲线留给位移。 */
button,
[role="button"],
[role="switch"],
[role="radio"],
[role="checkbox"],
[role="tab"],
[role="option"] {
  transition:
    background-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    border-color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    color var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard),
    box-shadow var(--dsw-m3-duration-short) var(--dsw-m3-ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
`;

/* ---- src/client/main.js ---- */
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

    return {
      inject: ['slots', 'locale', 'theme'],
      apply: applyClient,
    };
  },
});
