/* 由 build/bundle-client.mjs 自动生成，请勿手动修改。 */
window.__ModuleLoader__.load({
  id: "dsh-stars-material",
  factory: (require) => {
    'use strict';

    const React = require('react');
    const h = React.createElement;

/* ---- src/generated/palettes.js ---- */
/**
 * 由 build/generate-palettes.mjs 自动生成，请勿手动修改。
 *
 * 单套配色编码为 270 位小写十六进制字符串（45 个角色 × 6 位，不含 "#"），
 * 顺序与 ROLES 一致，运行时按索引切片读取。
 *
 * `PRESET_TABLE` 按 `src/parts/palette-spec.js` 中的预设 ID 索引，包含浅色与深色两套配色，
 * 共 8 套预设 × 2 套方案 = 16 组（每组 45 个角色，算法：tonalSpot / SchemeTonalSpot）。
 */

const ROLES = ["primary","onPrimary","primaryContainer","onPrimaryContainer","secondary","onSecondary","secondaryContainer","onSecondaryContainer","tertiary","onTertiary","tertiaryContainer","onTertiaryContainer","error","onError","errorContainer","onErrorContainer","background","onBackground","surface","onSurface","surfaceVariant","onSurfaceVariant","outline","outlineVariant","shadow","scrim","inverseSurface","inverseOnSurface","inversePrimary","surfaceDim","surfaceBright","surfaceContainerLowest","surfaceContainerLow","surfaceContainer","surfaceContainerHigh","surfaceContainerHighest","surfaceTint","success","onSuccess","successContainer","onSuccessContainer","warning","onWarning","warningContainer","onWarningContainer"];

const PRESET_TABLE = {"baseline":{"light":"65558fffffffe9ddff4d3d75625b71ffffffe8def84a44587e5260ffffffffd9e3633b48ba1a1affffffffdad693000afdf7ff1d1b20fdf7ff1d1b20e7e0eb49454e7a757fcac4cf000000000000322f35f5eff7cfbdfeded8e0fdf7fffffffff8f2faf2ecf4ece6eee6e0e965558f296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"cfbdfe36275d4d3d75e9ddffcbc2db332d414a4458e8def8efb8c84a2532633b48ffd9e3ffb4ab69000593000affdad6141218e6e0e9141218e6e0e949454ecac4cf948f9949454e000000000000e6e0e9322f3565558f1412183b383e0f0d131d1b20211f242b292f36343acfbdfe91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"blue":{"light":"2f628cffffffcee5ff0e4a7351606fffffffd5e4f73a485768587affffffeedbff504061ba1a1affffffffdad693000af7f9ff181c20f7f9ff181c20dee3eb42474e72777fc2c7cf0000000000002d3135eff1f69bcbfbd8dae0f7f9fffffffff1f3f9eceef3e6e8eee0e2e82f628c296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"9bcbfb0033530e4a73cee5ffb9c8da2332403a4857d5e4f7d3bfe6382a49504061eedbffffb4ab69000593000affdad6101418e0e2e8101418e0e2e842474ec2c7cf8c919842474e000000000000e0e2e82d31352f628c10141836393e0b0f12181c201c2024272a2f3235399bcbfb91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"green":{"light":"3b6939ffffffbcf0b423502452634fffffffd5e8cf3b4b3838656affffffbcebf01f4d52ba1a1affffffffdad693000af7fbf1191d17f7fbf1191d17dee5d842494072796fc2c9bd0000000000002d322ceff2e9a1d39ad8dbd2f7fbf1fffffff1f5ececefe6e6e9e0e0e4db3b6939296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"a1d39a0a390f235024bcf0b4baccb32534233b4b38d5e8cfa0cfd400363b1f4d52bcebf0ffb4ab69000593000affdad610140fe0e4db10140fe0e4db424940c2c9bd8c9388424940000000000000e0e4db2d322c3b693910140f363a340b0f0a191d171d211b272b25323630a1d39a91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"teal":{"light":"006a6affffff9cf1f0004f4f4a6363ffffffcce8e7324b4b4b607cffffffd3e4ff334863ba1a1affffffffdad693000af4fbfa161d1df4fbfa161d1ddae5e43f49486f7979bec9c80000000000002b3231ecf2f180d5d4d5dbdaf4fbfaffffffeff5f4e9efeee3e9e9dde4e3006a6a296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"80d5d4003737004f4f9cf1f0b0cccb1b3534324b4bcce8e7b3c8e81c314b334863d3e4ffffb4ab69000593000affdad60e1514dde4e30e1514dde4e33f4948bec9c88893923f4948000000000000dde4e32b3231006a6a0e1514343a3a090f0f161d1d1a2121252b2b2f363680d5d491d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"orange":{"light":"87521cffffffffdcc16b3b04735943ffffffffdcc15a422d5b6238ffffffdfe7b2434a22ba1a1affffffffdad693000afff8f5221a14fff8f5221a14f3dfd151443a837469d6c3b6000000000000372f28feeee3ffb779e6d7cdfff8f5fffffffff1e8fbebe1f5e5dbefe0d587521c296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb7794c27006b3b04ffdcc1e3c0a5412c195a422dffdcc1c3cb972d330e434a22dfe7b2ffb4ab69000593000affdad619120cefe0d519120cefe0d551443ad6c3b69e8e8251443a000000000000efe0d5372f2887521c19120c413730130d08221a14261e183128223c332cffb77991d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"pink":{"light":"8c4a60ffffffffd9e270334974565fffffffffd9e25a3f477c5635ffffffffdcc2623f20ba1a1affffffffdad693000afff8f822191cfff8f822191cf2dde2514347837377d5c2c6000000000000372e30fdedefffb0c8e6d6d9fff8f8fffffffff0f2faeaedf5e4e7efdfe18c4a60296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb0c8541d32703349ffd9e2e2bdc64229315a3f47ffd9e2efbd9448290c623f20ffdcc2ffb4ab69000593000affdad6191113efdfe1191113efdfe1514347d5c2c69e8c90514347000000000000efdfe1372e308c4a60191113413739140c0e22191c261d2031282a3c3235ffb0c891d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"red":{"light":"904a42ffffffffdad573342c775652ffffffffdad55d3f3b705c2efffffffcdfa6574419ba1a1affffffffdad693000afff8f7231918fff8f7231918f5ddda534341857370d8c2be000000000000392e2cffedeaffb4aae8d6d3fff8f7fffffffff0eefceae7f7e4e1f1dedc904a42296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"ffb4aa561e1873342cffdad5e7bdb74429265d3f3bffdad5dfc38c3e2e04574419fcdfa6ffb4ab69000593000affdad61a1110f1dedc1a1110f1dedc534341d8c2bea08c89534341000000000000f1dedc392e2c904a421a1110423735140c0b231918271d1c3228263d3231ffb4aa91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"},"blueGrey":{"light":"475d91ffffffd9e2ff2e4578575e71ffffffdce2f9404659725572fffffffdd7fa593d5aba1a1affffffffdad693000afaf8ff1a1b20faf8ff1a1b20e1e2ec44464f757780c5c6d00000000000002f3036f1f0f7b0c6ffdad9e0faf8fffffffff4f3faeeedf4e8e7efe2e2e9475d91296b2affffffacf4a2002203825500ffffffffddb2291800","dark":"b0c6ff152e602e4578d9e2ffc0c6dc293042404659dce2f9e0bbde412742593d5afdd7faffb4ab69000593000affdad6121318e2e2e9121318e2e2e944464fc5c6d08f909944464f000000000000e2e2e92f3036475d9112131838393f0c0e131a1b201e1f25282a2f33353ab0c6ff91d8880039080b5314acf4a2ffb94e452b00624000ffddb2"}};

/* ---- src/parts/palette-spec.js ---- */
/**
 * 配色规格定义：Material 3 角色顺序、配色算法标识、内置预设与 CSS 桥接变量列表。
 * 供构建期生成器、Host 端引擎与 Client 端共用。
 */

/**
 * 直接从 `DynamicScheme` 实例属性读取的 36 个 Material 3 角色（按编码顺序排列）。
 * `surfaceTint` 不在 `DynamicScheme` 实例上，由 `palette-engine.js` 单独从
 * `MaterialDynamicColors.surfaceTint` 读取。
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

/** Material 3 未内置的成功/警告语义色角色（8 项），由固定色调板生成，不随种子色变化。 */
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

/** {@link ROLE_ORDER} 的别名，表示直接来自 DynamicScheme 的 36 个角色。 */
const SCHEME_ROLE_ORDER = ROLE_ORDER;

/** 本插件固定采用 Material 3 默认的 Tonal Spot 配色算法，该标识用于构建产物说明与日志输出。 */
const VARIANT_ID = 'tonalSpot';

/** 对应的 Material Color Utilities 方案类名。 */
const VARIANT_CLASS = 'SchemeTonalSpot';

/** 内置的 8 套预设种子色（其中 baseline 为 Material 3 默认基线色），构建期据此预计算浅色与深色配色。 */
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

/** 默认预设 ID（用于冷启动占位及无法获取系统强调色时的回退）。 */
const DEFAULT_PRESET = 'baseline';

/** 需暴露给补充样式表（src/client/stylesheet.js）的 Material 3 角色；Client 会将其写入为 --dsh-m3-* 自定义属性。 */
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
  // 选中项与填充式色调按钮需要二级容器色，避免误用主色（primary）。
  { variable: '--dsh-m3-secondary-container', role: 'secondaryContainer' },
  { variable: '--dsh-m3-on-secondary-container', role: 'onSecondaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];

/* ---- src/parts/token-map.js ---- */
/**
 * 宿主 CSS 变量（--dsw-*）到 Material 3 配色的映射表。
 * 所有变量名均来自 vendor/dsh-survey/ 中的宿主样式表，由 build/validate-coverage.mjs 校验完整性。
 *
 * 设计约定：
 *   1. 用表面容器明暗阶梯区分层级：常规边框变量置为 transparent，阴影与高程变量置为 none。
 *   2. 用基于前景色与透明/底色的 color-mix() 叠色表达悬停（8%）与按压（12%）交互状态。
 */

/** 直接映射为单个 Material 3 角色的宿主变量。 */
const ROLE_TOKENS = {
  '--dsw-alias-brand-primary': 'primary',
  '--dsw-alias-brand-primary-invert': 'inversePrimary',
  '--dsw-alias-label-primary': 'onSurface',
  '--dsw-alias-label-primary-dimmed': 'onSurface',
  '--dsw-alias-label-secondary': 'onSurfaceVariant',
  // 三级文本广泛用于时间戳、占位符和提示，映射为 onSurfaceVariant 以保证小字号下的对比度（outline 在容器背景上对比度不足）。
  '--dsw-alias-label-tertiary': 'onSurfaceVariant',
  '--dsw-alias-label-caption': 'onSurfaceVariant',
  '--dsw-alias-label-dimmed': 'outlineVariant',
  '--dsw-alias-menu-icon': 'onSurfaceVariant',

  // 表面明暗阶梯：浅色模式逐级变深、深色模式逐级变浅，靠背景色差区分嵌套层级。
  '--dsw-alias-bg-base': 'surface',
  '--dsw-alias-bg-layer-1': 'surfaceContainerLow',
  '--dsw-alias-bg-layer-2': 'surfaceContainer',
  '--dsw-alias-bg-layer-3': 'surfaceContainerHigh',
  // 浮于面板之上的填充控件底色（下拉胶囊、步进器、分段选中项），取最高档容器色以与面板背景（bg-layer-2 / bg-layer-3）区分。
  '--dsw-alias-bg-module-platform': 'surfaceContainerHighest',
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
  // 抬升按钮（如侧栏中的「新会话」）使用 secondaryContainer，避免与侧栏底色融为一体。
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

  // 卡片默认比页面底高一档容器色，悬停时再升一档。
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

  // 图表系列与轨迹强调色，随当前主题色同步变化。
  '--dsw-alias-chart-messages': 'primary',
  '--dsw-alias-chart-system': 'outline',
  '--dsw-alias-chart-tools': 'tertiary',
  '--dsw-alias-trajectory-accent': 'primary',

  // JSON 查看器语法高亮：按元素类别分配不同角色色。
  '--dsw-alias-json-tree-icon': 'onSurfaceVariant',
  '--dsw-alias-json-tree-keyword': 'primary',
  '--dsw-alias-json-tree-number': 'primary',
  '--dsw-alias-json-tree-property': 'tertiary',
  '--dsw-alias-json-tree-punctuation': 'onSurface',
  '--dsw-alias-json-tree-string': 'error',

  '--dsw-specific-guide-hero': 'surfaceContainerHigh',
  '--dsw-specific-sidebar-right-flash': 'primary',

  // 浮层与弹出菜单统一使用实色容器背景，在无边框模式下保持与下层界面的清晰分隔。
  '--dsw-menu-surface-fill': 'surfaceContainerHigh',
  '--dsw-specific-menu': 'surfaceContainerHigh',
  '--dsw-specific-selector': 'surfaceContainerHigh',
  '--dsw-specific-login-input': 'surfaceContainerHigh',
  // 主输入框比浮层高一档，避免与菜单或弹窗背景混同。
  '--dsw-specific-input-major': 'surfaceContainerHighest',
  '--dsw-specific-tip': 'surfaceContainerHighest',
  '--dsw-specific-sidebar-fill': 'surfaceContainerLow',
  '--dsw-specific-bubble': 'secondaryContainer',
  '--dsw-specific-bubble-highlight': 'onSecondaryContainer',
  '--dsw-specific-sidebar-nav-item-active': 'secondaryContainer',
  '--dsw-specific-sidebar-nav-item-active-accent': 'onSecondaryContainer',
};

/** 置为 transparent 的边框与描边变量。依赖其中变量绘制轨道或分隔线的组件，由 src/client/stylesheet.js 单独重绘。 */
const CLEARED_TOKENS = [
  '--dsw-alias-border-l1',
  '--dsw-alias-border-l2',
  '--dsw-alias-border-l2-darkmode-thin',
  // 清空后，原本借用该变量作背景色的开关轨道与分隔线由 stylesheet.js 重绘；设置面板内则按作用域重新绑定。
  '--dsw-alias-border-l3',
  '--dsw-alias-border-l4',
  '--dsw-alias-settings-card-stroke',
  '--dsw-alias-button-ghost-active-border',
  '--dsw-alias-border-selected',
  '--dsw-alias-border-inverted',
  '--dsw-alias-border-inverted2',
  // 高程阴影组合使用的描边色变量。
  '--dsw-elevation-stroke-color',
];

/** 交互状态层变量：按固定权重（如悬停 8%、按压 12%）将角色色与 transparent 或 into 角色做 color-mix()；未设 weight 时直接使用角色色。 */
const STATE_LAYER_TOKENS = {
  '--dsw-alias-interactive-bg-hover': { role: 'onSurface', weight: 8, into: null },
  '--dsw-alias-interactive-bg-hover-solid': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-interactive-bg-active': { role: 'onSurface', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-accent': { role: 'primary', weight: 12, into: null },
  '--dsw-alias-interactive-bg-hover-danger': { role: 'error', weight: 12, into: null },
  '--dsw-alias-turn-trigger-bg-hover': { role: 'onSurface', weight: 8, into: 'surface' },
  '--dsw-alias-button-primary-fill': { role: 'primary' },
  '--dsw-alias-button-primary-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
  '--dsw-alias-button-primary-dimmed': { role: 'onPrimary', weight: 12, into: 'primary' },
  '--dsw-alias-button-info-hover': { role: 'onPrimary', weight: 8, into: 'primary' },
};

/** 带固定透明度的角色色，用于遮罩、选区高亮、骨架屏与毛玻璃侧栏。 */
const ALPHA_TOKENS = {
  '--dsw-alias-bg-mask-1': { role: 'scrim', alpha: 0.32 },
  '--dsw-alias-bg-mask-2': { role: 'scrim', alpha: 0.12 },
  '--dsw-alias-bg-mask-3': { role: 'scrim', alpha: 0.48 },
  '--dsw-alias-bg-skeleton': { role: 'onSurface', alpha: 0.06 },
  '--dsw-alias-bg-document-selection': { role: 'primary', alpha: 0.3 },
  '--dsw-alias-card-tile-fill': { role: 'onSurface', alpha: 0.04 },
  '--dsw-alias-json-tree-hover': { role: 'onSurface', alpha: 0.08 },
  '--dsw-specific-file-upload-track': { role: 'onSurface', alpha: 0.08 },
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

/** 由两个角色按固定权重通过 color-mix() 混合得到的变量。 */
const MIX_TOKENS = {
  '--dsw-alias-label-deep-diving': { role: 'primary', into: 'onSurface', weight: 70 },
  '--dsw-alias-label-deep-diving-shimmer': { role: 'primary', into: 'onSurface', weight: 30 },
  '--dsw-alias-tooltip-key-bg': { role: 'onSurface', into: 'inverseSurface', weight: 18 },
  '--dsw-alias-label-shimmer': { role: 'onSurface', into: 'surface', weight: 30 },
};

/** 固定字面量颜色：用于图片预览遮罩、拖拽蒙层与媒体工具栏按钮，不随主题配色变化。 */
const LITERAL_TOKENS = {
  '--dsw-alias-bg-mask-photo': '#000000e0',
  '--dsw-alias-bg-mask-drop': '#ffffffb3',
  '--dsw-alias-button-tool-bar-fill': '#54555780',
  '--dsw-alias-button-tool-bar-fill-invisible': '#1f1f1f5c',
  '--dsw-alias-button-tool-bar-hover': '#54555799',
};

/** 代码差异高亮变量：基于成功/错误语义色，行号槽位向 surface 混合以降低视觉权重。 */
const DIFF_TOKENS = {
  '--dsw-alias-file-diff-added-bg': { role: 'successContainer' },
  '--dsw-alias-file-diff-added-gutter': { role: 'successContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-added-marker': { role: 'success' },
  '--dsw-alias-file-diff-deleted-bg': { role: 'errorContainer' },
  '--dsw-alias-file-diff-deleted-gutter': { role: 'errorContainer', toward: 'surface', weight: 50 },
  '--dsw-alias-file-diff-deleted-marker': { role: 'error' },
};

/** 内置插画区域的颜色变量映射。 */
const ILLUSTRATION_TOKENS = {
  '--dsw-alias-illustration-background': 'surfaceContainerLow',
  '--dsw-alias-illustration-surface': 'surfaceContainerHighest',
  '--dsw-alias-illustration-backing': 'outlineVariant',
  '--dsw-alias-illustration-detail': 'outline',
  '--dsw-alias-illustration-inset': 'surfaceContainerHigh',
  '--dsw-alias-illustration-shadow': 'surfaceContainerHigh',
};

/** 置为 none 的阴影与高程变量（共 7 项）。部分组件会局部覆写 --dsw-elevation-stroke-color，因此直接清空组合阴影本身。 */
const ELEVATION_TOKENS = [
  '--dsw-shadow-lv1',
  '--dsw-shadow-lv2',
  '--dsw-shadow-lv3',
  '--dsw-elevation-stroke',
  '--dsw-elevation-panel',
  '--dsw-elevation-prominent',
  '--dsw-elevation-soft',
];

/** Material 3 圆角刻度，映射到宿主圆角变量。 */
const SHAPE_TOKENS = {
  '--dsw-radius-xs': '4px',
  '--dsw-radius-sm': '8px',
  '--dsw-radius-md': '12px',
  '--dsw-radius-lg': '16px',
  '--dsw-radius-xl': '20px',
  '--dsw-radius-panel': '28px',
};

/** Material 3 缓动曲线与过渡时长，由 stylesheet.js 注入到 :root。 */
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
 * 主题启用时注入的补充 CSS 规则。
 *
 * 变量覆盖层无法修改样式声明本身，也无法为依赖已透明化边框变量的组件重新着色，本表补充以下四类规则：
 *   1. 将圆角刻度（SHAPE_TOKENS）与动效变量（MOTION_TOKENS）注入 `:root`。
 *   2. 重绘原本依赖边框变量作背景或分隔线的组件，以及选中列表项与设置面板内的局部轮廓。
 *   3. 为聚焦输入框补充焦点环，并清除状态徽标的外边框。
 *   4. 统一交互控件的颜色过渡动效，并响应 `prefers-reduced-motion`。
 *
 * 选择器仅使用标签名、ARIA 属性与 `data-*` 属性，不依赖 CSS Modules 哈希类名，避免随宿主更新失效。
 */


const declarations = (tokens) =>
  Object.entries(tokens)
    .map(([name, value]) => '  ' + name + ': ' + value + ';')
    .join('\n');

/** 主题启用时注入的补充样式规则；引用的 --dsh-m3-* 变量由主题覆盖层写入并随配色同步更新。 */
const THEME_RULES = `
:root {
 ${declarations(SHAPE_TOKENS)}
 ${declarations(MOTION_TOKENS)}
}

/* ---------------------------------------------------------------------------
 * 1. 重绘原本依赖边框变量的组件
 * ------------------------------------------------------------------------- */

/* 常规边框变量已透明，改用 outline-variant 绘制分隔线。 */
hr {
  border: 0;
  height: 1px;
  background: var(--dsh-m3-outline-variant);
}

/* 菜单与列表分组分隔线。 */
[role="separator"] {
  border: 0;
  background: var(--dsh-m3-outline-variant);
}

/* 进度条轨道改用最高档容器色，突出主色前景。 */
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

/* 开关轨道原使用 border-l3，现已透明，按开关状态重绘。 */
[role="switch"][aria-checked="false"] {
  background: var(--dsh-m3-outline-variant);
}

[role="switch"][aria-checked="true"] {
  background: var(--dsh-m3-primary);
}

/* 表格行分隔改用内阴影绘制。 */
tr[data-turn-start="true"]:not(:first-child) > td {
  box-shadow: inset 0 1px 0 var(--dsh-m3-outline-variant);
}

/* 对话右侧轮次导航刻度：伪元素依赖 border-l4 上色，在按钮上重绑变量可恢复常规刻度，同时不覆盖活动、预览与聚焦状态对伪元素背景色的优先级。 */
nav button[data-index] {
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
}

/* ---------------------------------------------------------------------------
 * 2. 选中状态与设置面板局部轮廓
 * ------------------------------------------------------------------------- */

/* 宿主默认将选中会话行与悬停行共用同一背景变量，改用 secondary-container 区分选中态。 */
[role="treeitem"][aria-selected="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* 设置面板内局部重绑边框变量，维持卡片、按钮与输入框的边界清晰；面板外保持无边框风格。[data-shortcut-modal="settings"] 仅匹配设置窗口。 */
[data-shortcut-modal="settings"] {
  --dsw-alias-border-l3: var(--dsh-m3-outline-variant);
  --dsw-alias-border-l4: var(--dsh-m3-outline-variant);
  --dsw-alias-settings-card-stroke: var(--dsh-m3-outline-variant);
}

/* 设置页「外观」分段按钮：使用 1px outline 与 secondary-container 明确边界及选中态（仅外观行使用 aria-pressed）。 */
[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed] {
  border: 1px solid var(--dsh-m3-outline);
}

[data-shortcut-modal="settings"] [data-slot="settings.general.item"] button[aria-pressed="true"] {
  background-color: var(--dsh-m3-secondary-container);
}

/* ---------------------------------------------------------------------------
 * 3. 聚焦环与状态徽标
 * ------------------------------------------------------------------------- */

/* 为隐藏默认 outline、依赖边框提示聚焦的输入控件补充焦点环。 */
input:focus,
textarea:focus,
select:focus,
[contenteditable]:focus {
  outline: 2px solid var(--dsh-m3-primary);
  outline-offset: 1px;
  outline-style: solid;
}

/* 清除错误、警告、成功等状态徽标的外边框；保留 box-shadow 以免影响代码差异行的内嵌竖条。 */
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
 * 4. 交互过渡与减弱动效
 * ------------------------------------------------------------------------- */

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
 * 主题插件的 Client 端入口。
 *
 * `applyClient(ctx)` 负责：
 *   1. 从 `localStorage` 读取偏好配置（兼容更名前的旧键）。
 *   2. 解析当前配色：内置预设读取预计算表 `PRESET_TABLE`，跟随系统或自定义颜色向 Host 端请求。
 *   3. 展开宿主变量与 `--dsh-m3-*` 桥接变量，并通过 `theme.overrideTokens()` / `theme.register()` 安装主题层。
 *   4. 在 `<head>` 中维护单个 `<style>` 标签，按启用状态写入补充样式规则（`THEME_RULES`）。
 *   5. 注册「设置 → Material 3」配置页，并监听 `storage` 事件实现多窗口同步。
 *
 * 本模块经 `build/bundle-client.mjs` 打包为自包含脚本，运行时仅 `require('react')`，不直接依赖宿主 UI 包。
 */

const NS = 'dsh-stars-material';
const SOURCE = 'dsh-stars-material';

const LIGHT_THEME_ID = 'stars-material-light';
const DARK_THEME_ID = 'stars-material-dark';

const STORAGE_PREFIX = 'dsh.stars-material.';
const STORAGE_ENABLED = STORAGE_PREFIX + 'enabled';
const STORAGE_SOURCE = STORAGE_PREFIX + 'source';
const STORAGE_PRESET = STORAGE_PREFIX + 'preset';
const STORAGE_CUSTOM_SEED = STORAGE_PREFIX + 'customSeed';

/** 插件更名前使用的 localStorage 前缀；仅做只读回退，首次保存时写入新前缀以保留历史配置。 */
const LEGACY_PREFIX = 'dsh.material-3.';

/** 配色来源枚举：system 跟随系统强调色，preset 使用内置预设，custom 使用自定义种子色。 */
const SOURCE_SYSTEM = 'system';
const SOURCE_PRESET = 'preset';
const SOURCE_CUSTOM = 'custom';

/** 自定义颜色模式下的初始种子色。 */
const DEFAULT_CUSTOM_SEED = '#6750a4';

const HEX_SEED = /^#[0-9a-f]{6}$/iu;

const SETTINGS_SECTION_ID = 'stars-material';
const SETTINGS_SECTION_ORDER = 26;

const STYLE_TAG_ID = NS + '/stars-material.css';

/** Host 端配色接口路径。 */
const HOST_PALETTE_ROUTE = '/stars-material/palette';

/** 单次 Host 配色请求超时时间（毫秒）。 */
const HOST_TIMEOUT_MS = 1500;

/** 跟随系统模式请求失败后的重试间隔表（毫秒）。 */
const HOST_RETRY_MS = [0, 2000, 6000, 15000];

const ROLE_INDEX = new Map(ROLES.map((role, index) => [role, index]));
const PRESET_INDEX = new Map(PRESETS.map((preset) => [preset.id, preset]));

/** 从 270 位压缩配色串中读取指定角色的 #rrggbb 值。 */
function unpackRole(packed, role) {
  const index = ROLE_INDEX.get(role);
  if (index === undefined) {
    throw new Error('dsh-stars-material: 未知角色 "' + role + '"');
  }
  const start = index * 6;
  return '#' + packed.slice(start, start + 6);
}

/** 从压缩配色串中读取指定角色并附加透明度通道，返回 #rrggbbaa。 */
function unpackRoleAlpha(packed, role, alpha) {
  const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return unpackRole(packed, role) + byte.toString(16).padStart(2, '0');
}

function clampPreset(preset) {
  return PRESET_INDEX.has(preset) ? preset : DEFAULT_PRESET;
}

function clampSource(source) {
  if (source === SOURCE_SYSTEM) return SOURCE_SYSTEM;
  if (source === SOURCE_CUSTOM) return SOURCE_CUSTOM;
  return SOURCE_PRESET;
}

/** 校验并规范化 #rrggbb 色值；格式无效时回退为默认自定义种子色。 */
function clampHexSeed(seed) {
  return typeof seed === 'string' && HEX_SEED.test(seed) ? seed.toLowerCase() : DEFAULT_CUSTOM_SEED;
}

function presetPalette(preset) {
  return PRESET_TABLE[clampPreset(preset)];
}

/** 生成交由浏览器计算的 color-mix() 表达式。 */
function mixExpression(first, into, weight) {
  return 'color-mix(in srgb, ' + first + ' ' + weight + '%, ' + into + ')';
}

/** 将 `{ light, dark }` 压缩配色展开为完整的宿主变量映射表（纯函数，不区分配色来源）。 */
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

  // 需清空的边框变量统一设为 transparent。
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

  // 阴影与高程变量统一置为 none，改由表面背景明暗表达层级。
  for (const name of ELEVATION_TOKENS) put(name, 'none', 'none');

  return tokens;
}

/** 生成供补充样式表使用的 --dsh-m3-* 变量，通过 light-dark() 同时承载浅色与深色取值。 */
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

/** 提取供 theme.register() 使用的单模式宿主变量（仅保留 --dsw-* 前缀）。 */
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

/** 读取配置项，当前键不存在时回退读取更名前的旧键。 */
function readPreference(key, legacy, fallback) {
  const current = readStorage(key, null);
  if (current !== null) return current;
  return readStorage(legacy, fallback);
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage 不可用时，更改仅在当前会话内存中生效。
  }
}

function readPreferences() {
  return {
    enabled: readPreference(STORAGE_ENABLED, LEGACY_PREFIX + 'enabled', '1') !== '0',
    source: clampSource(
      readPreference(STORAGE_SOURCE, LEGACY_PREFIX + 'source', SOURCE_SYSTEM),
    ),
    preset: clampPreset(readPreference(STORAGE_PRESET, LEGACY_PREFIX + 'preset', DEFAULT_PRESET)),
    customSeed: clampHexSeed(readStorage(STORAGE_CUSTOM_SEED, DEFAULT_CUSTOM_SEED)),
  };
}

// ---------------------------------------------------------------------------
// 配色解析
// ---------------------------------------------------------------------------

/**
 * 向 Host 端 `/stars-material/palette` 请求配色。
 * 传入 `seed` 时按指定种子色推导；未传时读取操作系统强调色。
 */
async function fetchPalette(seed) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), HOST_TIMEOUT_MS);
  const url = seed === undefined ? HOST_PALETTE_ROUTE : HOST_PALETTE_ROUTE + '?seed=' + encodeURIComponent(seed);
  try {
    const response = await window.fetch(url, { signal: controller.signal });
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
  /* Material 3 选项片采用 8px 圆角矩形。 */
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
.${NS}-custom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.${NS}-color {
  box-sizing: border-box;
  width: 44px;
  height: 34px;
  padding: 2px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
}
.${NS}-hex {
  box-sizing: border-box;
  width: 104px;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  text-transform: lowercase;
}
.${NS}-apply {
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-label-primary-foreground);
}
.${NS}-apply[disabled] { opacity: 0.5; cursor: default; }
.${NS}-apply[disabled]:hover { background: var(--dsw-alias-brand-primary); }
.${NS}-custom-error {
  color: var(--dsh-m3-error, var(--dsw-alias-label-primary));
  font-size: 12px;
  line-height: 18px;
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
 * 在 `<head>` 中维护单个 `<style>` 元素（按 `data-plugin-css` 复用，避免重复插入）。
 * 设置页样式始终保留，主题补充规则（`THEME_RULES`）仅在主题启用时写入。
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
  const [hexDraft, setHexDraft] = React.useState(state.customSeed ?? DEFAULT_CUSTOM_SEED);

  React.useEffect(() => {
    setDraft(state);
    setHexDraft(state.customSeed ?? DEFAULT_CUSTOM_SEED);
  }, [state.enabled, state.source, state.preset, state.customSeed, state.revision]);

  const commit = (patch) => {
    const next = {
      enabled: draft.enabled,
      source: draft.source,
      preset: draft.preset,
      customSeed: draft.customSeed,
      ...patch,
    };
    setDraft(next);
    props.onChange(next);
  };

  // 取色器与输入框仅更新本地草稿，点击「应用」后才向 Host 请求配色，避免拖动时频繁请求。
  const candidate = hexDraft.startsWith('#') ? hexDraft : '#' + hexDraft;
  const draftSeed = HEX_SEED.test(candidate) ? candidate.toLowerCase() : null;
  const pickerValue = draftSeed ?? draft.customSeed;
  const pending = draftSeed !== null && draftSeed !== draft.customSeed;

  const applyCustomSeed = () => {
    if (draftSeed === null) return;
    setHexDraft(draftSeed);
    commit({ customSeed: draftSeed });
  };

  const manual = draft.source === SOURCE_PRESET;
  const custom = draft.source === SOURCE_CUSTOM;

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
        custom
          ? t('page.sourceCustomDescription')
          : manual
            ? t('page.sourcePresetDescription')
            : describeSystem(state, t),
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
        h(Chip, {
          selected: custom,
          swatch: draft.customSeed,
          label: t('page.sourceCustom'),
          title: draft.customSeed,
          onSelect: () => commit({ source: SOURCE_CUSTOM }),
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
      custom
        ? h(
            'div',
            { className: NS + '-custom' },
            h(
              'input',
              {
                type: 'color',
                className: NS + '-color',
                value: pickerValue,
                'aria-label': t('page.customPickerLabel'),
                title: t('page.customPickerLabel'),
                onChange: (event) => setHexDraft(event.target.value),
              },
            ),
            h('input', {
              type: 'text',
              className: NS + '-hex',
              value: hexDraft,
              maxLength: 7,
              spellCheck: false,
              'aria-label': t('page.customHexLabel'),
              title: t('page.customHexLabel'),
              onChange: (event) => setHexDraft(event.target.value),
            }),
            h(
              'button',
              {
                type: 'button',
                className: NS + '-chip ' + NS + '-apply',
                disabled: !pending,
                onClick: applyCustomSeed,
              },
              t('page.customApply'),
            ),
            h(
              'span',
              { className: NS + '-row-desc' },
              pending ? t('page.customPending') + ' ' + draftSeed : draft.customSeed,
            ),
          )
        : null,
      custom && state.customError
        ? h(
            'p',
            { className: NS + '-custom-error' },
            t(state.customStale ? 'page.customStaleHost' : 'page.customUnavailable'),
          )
        : null,
    ),

    h('p', { className: NS + '-note' }, t('page.note')),
  );
}

/** 生成「跟随系统」说明文案：已获取系统强调色时附带色值，否则显示不可用提示。 */
function describeSystem(state, t) {
  if (state.systemSeed === null || state.systemSeed === undefined) return t('page.systemUnavailable');
  return t('page.systemDescription') + ' ' + state.systemSeed;
}

// ---------------------------------------------------------------------------
// 主题层
// ---------------------------------------------------------------------------

/** 安装当前配色对应的变量覆盖层与明暗主题注册项；切换配色前必须先调用返回的 dispose() 释放旧注册项。 */
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

  // 桥接变量使用独立的覆盖源，随主题层一起卸载与更新。
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
        // 重复注册或热重载残留不影响主配色（界面由 overrideTokens 生效），记录日志即可。
        console.error('dsh-stars-material: 注册主题 ' + id + ' 失败', error);
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
          console.error('dsh-stars-material: 清理主题层失败', error);
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
    console.error('dsh-stars-material: 未获取到 "theme" 服务');
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
    customSeed: preference.customSeed,
    customError: false,
    customStale: false,
    systemSeed: null,
    revision: 0,
  };

  // 预设模式直接使用目标预设；跟随系统或自定义模式先以默认预设占位，待 Host 响应后替换。
  let resolved = preference.source === SOURCE_PRESET
    ? presetPalette(preference.preset)
    : presetPalette(DEFAULT_PRESET);

  let styles = installStyles();
  ctx.effect(() => {
    return () => styles.dispose();
  }, NS + ' stylesheet');
  styles.apply(preference.enabled);

  // 当前生效的主题层句柄，切换配色时整体替换。
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
    published.customSeed = preference.customSeed;
    published.revision += 1;
  };

  const install = () => {
    layers.dispose();
    layers = createThemeLayers(theme, preference.enabled && resolved !== null, resolved);
    styles.apply(preference.enabled);
    publish();
  };

  // 跟随系统模式的重试定时器句柄，切换配色来源时取消。
  let retryTimer = null;

  // 递增请求序号：异步响应返回前校验序号，防止较早发出的请求覆盖较新的配色选择。
  let resolutionId = 0;

  const cancelRetry = () => {
    if (retryTimer !== null) {
      window.clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  /** 向 Host 请求系统强调色配色；启动初期 Host 路由可能尚未就绪，失败时按 HOST_RETRY_MS 退避重试，全部失败后回退为默认预设。 */
  const resolveSystem = async (attempt, id) => {
    retryTimer = null;
    try {
      const answer = await fetchPalette(undefined);
      if (id !== resolutionId) return;
      resolved = answer.palette;
      published.systemSeed = answer.seed;
      install();
      return;
    } catch (error) {
      if (id !== resolutionId) return;
      const next = attempt + 1;
      if (next < HOST_RETRY_MS.length) {
        retryTimer = window.setTimeout(() => {
          if (id === resolutionId) void resolveSystem(next, id);
        }, HOST_RETRY_MS[next]);
        return;
      }
      console.warn('dsh-stars-material: 无法获取系统强调色，已回退为默认预设', error);
      resolved = presetPalette(DEFAULT_PRESET);
      published.systemSeed = null;
      install();
    }
  };

  /** 向 Host 请求自定义种子色配色；不自动重试，失败时保留当前配色并提示错误。 */
  const resolveCustom = async (id) => {
    try {
      const answer = await fetchPalette(preference.customSeed);
      if (id !== resolutionId) return;
      // 若运行中的 Host 仍是旧版本（忽略 ?seed= 并返回系统强调色），响应色值会与请求不一致，需提示用户重启应用。
      const answered = typeof answer.seed === 'string' ? answer.seed.toLowerCase() : null;
      if (answered !== preference.customSeed) {
        console.warn('dsh-stars-material: Host 返回种子色 ' + answered + '，与请求的 ' + preference.customSeed + ' 不一致');
        published.customError = true;
        published.customStale = true;
        install();
        return;
      }
      resolved = answer.palette;
      published.customError = false;
      published.customStale = false;
      install();
    } catch (error) {
      if (id !== resolutionId) return;
      console.warn('dsh-stars-material: 生成自定义配色失败', error);
      published.customError = true;
      published.customStale = false;
      // 保留上一次有效配色（冷启动时为默认预设），并刷新界面以显示错误提示。
      install();
    }
  };

  /** 根据当前配色来源解析并安装主题层。 */
  const resolve = async () => {
    const id = ++resolutionId;
    cancelRetry();
    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      published.customError = false;
      published.customStale = false;
      install();
      return;
    }
    if (preference.source === SOURCE_CUSTOM) {
      await resolveCustom(id);
      return;
    }
    await resolveSystem(0, id);
  };

  const retune = (next) => {
    preference.enabled = next.enabled;
    preference.source = clampSource(next.source);
    preference.preset = clampPreset(next.preset);
    preference.customSeed = clampHexSeed(next.customSeed);

    writeStorage(STORAGE_ENABLED, preference.enabled ? '1' : '0');
    writeStorage(STORAGE_SOURCE, preference.source);
    writeStorage(STORAGE_PRESET, preference.preset);
    writeStorage(STORAGE_CUSTOM_SEED, preference.customSeed);

    if (preference.source === SOURCE_PRESET) {
      resolved = presetPalette(preference.preset);
      install();
      return;
    }

    // 跟随系统与自定义模式均需请求 Host；响应返回前保留当前主题层，避免界面闪烁。
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
      preference.customSeed = stored.customSeed;
      void resolve();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, NS + ' storage');

  ctx.effect(() => () => cancelRetry(), NS + ' palette retry');

  // 初始化时按已保存的配色来源执行一次解析与安装。
  void resolve();
}
const DICTS = {
  en: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 theme',
    'page.description':
      'Uses layered background tones instead of borders and shadows, with subtle translucent overlays for hover and press feedback, generating matched light and dark palettes together.',
    'page.enabledTitle': 'Enable Material 3 theme',
    'page.enabledDescription':
      'Applies Material 3 colors to backgrounds, text, controls, and interactive states. Turn off to restore your previous theme.',
    'page.on': 'On',
    'page.off': 'Off',
    'page.enable': 'Enable Material 3 theme',
    'page.disable': 'Disable Material 3 theme',
    'page.sourceTitle': 'Color source',
    'page.sourceSystem': 'Follow system',
    'page.sourcePreset': 'Built-in presets',
    'page.sourceCustom': 'Custom color',
    'page.systemDescription': 'Derived from Windows accent color',
    'page.systemUnavailable': 'No usable system accent color was found; using the default preset palette.',
    'page.sourcePresetDescription': 'Choose from 8 built-in Material 3 palettes.',
    'page.sourceCustomDescription': 'Pick any base color to generate matched light and dark palettes.',
    'page.customPickerLabel': 'Pick a custom color',
    'page.customHexLabel': 'Hex color in #rrggbb format',
    'page.customApply': 'Apply',
    'page.customPending': 'Click Apply to use',
    'page.customUnavailable': 'Failed to generate the custom palette. The current palette remains active.',
    'page.customStaleHost':
      'The running host service is outdated and ignored the custom color. Restart DeepSeek Harness and try again.',
    'page.note':
      'Changes apply immediately and are saved locally across reloads without restarting the app.',
    'preset.baseline': 'Baseline',
    'preset.blue': 'Blue',
    'preset.green': 'Green',
    'preset.teal': 'Teal',
    'preset.orange': 'Orange',
    'preset.pink': 'Pink',
    'preset.red': 'Red',
    'preset.blueGrey': 'Blue gray',
  },
  zh: {
    'nav.title': 'Material 3',
    'page.title': 'Material 3 主题',
    'page.description':
      '以不同深浅的背景色区分界面层次，减少边框与投影，并以半透明叠色呈现悬停与点击反馈，同时生成配套的浅色与深色配色。',
    'page.enabledTitle': '启用 Material 3 主题',
    'page.enabledDescription':
      '应用 Material 3 配色到界面背景、文字、控件与交互状态；关闭后恢复原有主题。',
    'page.on': '已开启',
    'page.off': '已关闭',
    'page.enable': '开启 Material 3 主题',
    'page.disable': '关闭 Material 3 主题',
    'page.sourceTitle': '配色来源',
    'page.sourceSystem': '跟随系统',
    'page.sourcePreset': '内置预设',
    'page.sourceCustom': '自定义颜色',
    'page.systemDescription': '基于 Windows 系统强调色生成',
    'page.systemUnavailable': '未能读取有效的系统强调色，当前使用默认预设配色。',
    'page.sourcePresetDescription': '从 8 套内置 Material 3 预设配色中选择。',
    'page.sourceCustomDescription': '选择任意主色，自动生成配套的浅色与深色配色。',
    'page.customPickerLabel': '选择自定义主色',
    'page.customHexLabel': '输入十六进制色值（#rrggbb）',
    'page.customApply': '应用',
    'page.customPending': '待应用',
    'page.customUnavailable': '自定义配色生成失败，已保留当前配色。',
    'page.customStaleHost': '当前后台服务版本过旧，未能应用自定义颜色。请重启 DeepSeek Harness 后重试。',
    'page.note': '更改会立即生效并保存在本地，刷新页面后自动恢复，无需重启应用。',
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
