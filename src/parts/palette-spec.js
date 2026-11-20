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

/** 这些角色来自固定色调板，而不是种子色。 */
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

/** DynamicScheme 直接暴露的 36 个角色。 */
export const SCHEME_ROLE_ORDER = ROLE_ORDER;

/**
 * 本插件只带一种调和方式。
 *
 * Material 3 有九种方案变体，全都提供过之后设置页变成了取色器，配色也没法用一句
 * 话说清。色调斑点（tonal spot）是 M3 的默认方案，也是文档里最先介绍的一种，因此
 * 只保留它。变体 id 仍留在数据结构里，因为存档的偏好和生成的表还按它取键。
 */
export const VARIANT_ID = 'tonalSpot';

/** 实现 {@link VARIANT_ID} 的 material-color-utilities 类名。 */
export const VARIANT_CLASS = 'SchemeTonalSpot';

/**
 * 手动模式下提供的 8 个 Material 3 预设。
 *
 * 种子色取自 M3 为自己基线配色公布的色值，所以选一个预设得到的就是文档里那张
 * `#6750A4` 角色表，而不是它的近似值。自动模式完全不用这份列表——它在运行时从
 * 操作系统强调色推导配色。
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

/** 读不到系统颜色时使用的预设。 */
export const DEFAULT_PRESET = 'baseline';

/**
 * 样式表需要、但 DSH 没提供的颜色。
 *
 * 运行时把每一项解析出的角色写成 `:root` 上的 `--dsh-m3-*` 自定义属性，样式表只
 * 引用这些属性。列表放在这里，是为了让生成器、Host 引擎与 Client 对"哪些角色要过
 * 桥"保持一致。
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
  // 选中行的填充和实心色调按钮都需要第二层容器色；没有这两项，样式表只能借用
  // `primary`，而那不是容器该用的角色。
  { variable: '--dsh-m3-secondary-container', role: 'secondaryContainer' },
  { variable: '--dsh-m3-on-secondary-container', role: 'onSecondaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];
