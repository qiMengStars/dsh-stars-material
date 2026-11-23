/**
 * 配色规格定义：Material 3 角色顺序、配色算法标识、内置预设与 CSS 桥接变量列表。
 * 供构建期生成器、Host 端引擎与 Client 端共用。
 */

/**
 * 直接从 `DynamicScheme` 实例属性读取的 36 个 Material 3 角色（按编码顺序排列）。
 * `surfaceTint` 不在 `DynamicScheme` 实例上，由 `palette-engine.js` 单独从
 * `MaterialDynamicColors.surfaceTint` 读取。
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

/** Material 3 未内置的成功/警告语义色角色（8 项），由固定色调板生成，不随种子色变化。 */
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

/** {@link ROLE_ORDER} 的别名，表示直接来自 DynamicScheme 的 36 个角色。 */
export const SCHEME_ROLE_ORDER = ROLE_ORDER;

/** 本插件固定采用 Material 3 默认的 Tonal Spot 配色算法，该标识用于构建产物说明与日志输出。 */
export const VARIANT_ID = 'tonalSpot';

/** 对应的 Material Color Utilities 方案类名。 */
export const VARIANT_CLASS = 'SchemeTonalSpot';

/** 内置的 8 套预设种子色（其中 baseline 为 Material 3 默认基线色），构建期据此预计算浅色与深色配色。 */
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

/** 默认预设 ID（用于冷启动占位及无法获取系统强调色时的回退）。 */
export const DEFAULT_PRESET = 'baseline';

/** 需暴露给补充样式表（src/client/stylesheet.js）的 Material 3 角色；Client 会将其写入为 --dsh-m3-* 自定义属性。 */
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
  // 选中项与填充式色调按钮需要二级容器色，避免误用主色（primary）。
  { variable: '--dsh-m3-secondary-container', role: 'secondaryContainer' },
  { variable: '--dsh-m3-on-secondary-container', role: 'onSecondaryContainer' },
  { variable: '--dsh-m3-error', role: 'error' },
  { variable: '--dsh-m3-on-error', role: 'onError' },
  { variable: '--dsh-m3-success', role: 'success' },
  { variable: '--dsh-m3-warning', role: 'warning' },
];
