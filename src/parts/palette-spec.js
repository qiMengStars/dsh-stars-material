/**
 * 生成器、Host 端引擎与运行时共用的角色顺序定义。
 *
 * 前 36 项直接读取 `DynamicScheme` 实例上的 getter，即 MaterialDynamicColors 为各
 * M3 方案派生的 ARGB getter。`surfaceTint` 不是 `DynamicScheme` 的 getter，生成器
 * 改从 `MaterialDynamicColors.surfaceTint` 取。
 *
 * 后 8 项是 Material 3 未定义、聊天应用需要的语义色对（成功 / 警告）。取值来自固定
 * 色调板，与种子色无关，绿色与琥珀色在各套配色中保持一致。
 */
export const ROLE_ORDER = [
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

/** 取自固定色调板的角色。 */
export const FIXED_ROLE_ORDER = [
  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',
  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',
];

/** `DynamicScheme` 直接暴露的 36 个角色。 */
export const SCHEME_ROLE_ORDER = ROLE_ORDER;

/**
 * 本插件只保留一种调和方式。
 *
 * Material 3 提供九种方案变体。全部暴露会使设置页退化为取色器，配色也难以用单一
 * 描述说明。tonal spot 是 M3 的默认方案，文档首先介绍该方案，插件只保留这一种。
 * 变体 id 保留在数据结构中：存档偏好与生成表按该 id 取键。
 */
export const VARIANT_ID = 'tonalSpot';

/** 实现 {@link VARIANT_ID} 的 material-color-utilities 类名。 */
export const VARIANT_CLASS = 'SchemeTonalSpot';

/**
 * 手动模式提供的 8 个 Material 3 预设。
 *
 * 种子色取自 M3 为基线配色公布的色值，选择某预设得到与该方案文档一致的 `#6750A4`
 * 角色表。自动模式不使用该列表，运行时由操作系统强调色推导配色。
 */
export const PRESETS = [
  { id: 'baseline', hex: '#6750a4', label: 'Material baseline' },
  { id: 'blue', hex: '#00639b', label: 'Blue' },
  { id: 'green', hex: '#006e1c', label: 'Green' },
  { id: 'teal', hex: '#006a6a', label: 'Teal' },
  { id: 'orange', hex: '#8e4e00', label: 'Orange' },
  { id: 'pink', hex: '#984061', label: 'Pink' },
  { id: 'red', hex: '#b3261e', label: 'Red' },
  { id: 'blueGrey', hex: '#525e7d', label: 'Blue grey' },
];

/** 读不到系统颜色时采用的预设。 */
export const DEFAULT_PRESET = 'baseline';

/**
 * 样式表需要、但 DSH 未提供的颜色。
 *
 * 运行时将每一项的解析结果写成 `:root` 上的 `--dsh-m3-*` 自定义属性，样式表仅引用
 * 这些属性。该列表定义于此，使生成器、Host 引擎与 Client 对需要过桥的角色保持一致。
 */
export const BRIDGE_ROLES = [
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
  // 选中行的填充与实心色调按钮都需要第二层容器色。缺少这两项时，样式表只能借用
  // `primary`，该角色并不适用于容器。
  { variable: '--dsh-m3-secondary-container', role: 'secondaryContainer' },
  { variable: '--dsh-m3-on-secondary-container', role: 'onSecondaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];
