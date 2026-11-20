/**
 * Host 端的配色引擎 —— 由 build/bundle-host.mjs 生成。
 *
 * 拼起三样必须彼此一致的东西：角色表、引擎，以及引擎赖以构建的 Material Color
 * Utilities 命名空间。要重新生成就跑：
 *
 *   node build/bundle-host.mjs
 */

import * as mcu from './mcu/index.js';

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


/**
 * 构建脚本与 Host 端共用的配色引擎。
 *
 * 所有入口都由 `createPaletteEngine(mcu)` 生成：它把 Material Color Utilities 的
 * 模块对象作为参数收进来，而不是直接 import。这样同一份实现能被两个完全不同的加载
 * 器使用：
 *
 *   - `build/generate-palettes.mjs` 直接传 vendored 目录。
 *   - `plugin/lib/palette.js` 由本文件加 `src/parts/palette-spec.js` 拼成，随包带上
 *     `plugin/lib/mcu/` 里的那份依赖。
 *
 * 下面唯一的 import 是角色表，它在打包拼接时会被去掉（见 `build/bundle-client.mjs`
 * 与 `build/bundle-host.mjs`）。
 *
 * 每套配色都压成一个十六进制字符串：45 个角色 × 6 位，按 `ROLE_ORDER` 排列，去掉
 * 前面的 `#`。切字符串比每套配色带一个对象便宜，生成出来的文件也还看得懂。
 */

/** 角色名到它在压缩串里的槽位。 */
const ROLE_INDEX = new Map(
  [...ROLE_ORDER, 'surfaceTint', ...FIXED_ROLE_ORDER].map((role, index) => [role, index]),
);

/** 固定的色相让成功/警告色不随种子色漂移。 */
const FIXED_PALETTES = {
  success: { hue: 145, chroma: 48 },
  warning: { hue: 75, chroma: 60 },
};

/** 明度取值沿用 M3 主角色的搭配。 */
const FIXED_TONES = {
  light: { base: 40, onBase: 100, container: 90, onContainer: 10 },
  dark: { base: 80, onBase: 20, container: 30, onContainer: 90 },
};

/**
 * 在一个 Material Color Utilities 模块对象上建引擎。
 *
 * @param mcu vendored 的 `@material/material-color-utilities` 命名空间。
 * @returns 两半都需要的配色操作。
 */
function createPaletteEngine(mcu) {
  const {
    Hct,
    MaterialDynamicColors,
    TonalPalette,
    argbFromHex,
    hexFromArgb,
    SchemeTonalSpot,
  } = mcu;

  const fixedPalettes = {
    success: new TonalPalette(FIXED_PALETTES.success.hue, FIXED_PALETTES.success.chroma),
    warning: new TonalPalette(FIXED_PALETTES.warning.hue, FIXED_PALETTES.warning.chroma),
  };

  function fixedRoleValues(isDark) {
    const tones = FIXED_TONES[isDark ? 'dark' : 'light'];
    const tone = (name, value) => hexFromArgb(fixedPalettes[name].tone(value));
    return [
      tone('success', tones.base),
      tone('success', tones.onBase),
      tone('success', tones.container),
      tone('success', tones.onContainer),
      tone('warning', tones.base),
      tone('warning', tones.onBase),
      tone('warning', tones.container),
      tone('warning', tones.onContainer),
    ];
  }

  function schemeRoleValues(scheme) {
    const values = [];
    for (const role of ROLE_ORDER) {
      const argb = scheme[role];
      if (typeof argb !== 'number') {
        throw new Error('配色引擎：方案里缺少角色 "' + role + '"');
      }
      values.push(hexFromArgb(argb));
    }
    values.push(hexFromArgb(MaterialDynamicColors.surfaceTint.getArgb(scheme)));
    return values;
  }

  /** 一套方案的全部角色，已压缩。 */
  function packScheme(scheme, isDark) {
    const values = [...schemeRoleValues(scheme), ...fixedRoleValues(isDark)];
    for (const value of values) {
      if (!/^#[0-9a-f]{6}$/u.test(value)) {
        throw new Error('配色引擎：角色取值不对劲 "' + value + '"');
      }
    }
    return values.map((hex) => hex.slice(1)).join('');
  }

  /**
   * 用本插件唯一的调和方式推导种子色的明暗两套方案。
   *
   * 色调斑点是 Material 3 的默认方案，所以一个预设得到的就是设计系统文档里那张
   * 角色表，而不是它的近似值。
   */
  function paletteFromSeed(seedHex) {
    const source = Hct.fromInt(argbFromHex(seedHex));
    return {
      light: packScheme(new SchemeTonalSpot(source, false, 0), false),
      dark: packScheme(new SchemeTonalSpot(source, true, 0), true),
    };
  }

  /** 从压缩串里取一个角色的 `#rrggbb`。 */
  function unpack(packed, role) {
    const index = ROLE_INDEX.get(role);
    if (index === undefined) {
      throw new Error('配色引擎：没有叫 "' + role + '" 的角色');
    }
    const start = index * 6;
    return '#' + packed.slice(start, start + 6);
  }

  /** 一个角色加一个 alpha 字节的 `#rrggbbaa`。 */
  function unpackAlpha(packed, role, alpha) {
    const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
    return unpack(packed, role) + byte.toString(16).padStart(2, '0');
  }

  /** 颜色的彩度，用来判断系统强调色是不是接近中性。 */
  function chromaOf(seedHex) {
    return Hct.fromInt(argbFromHex(seedHex)).chroma;
  }

  /** WCAG 对比度，供构建期断言使用。 */
  function contrastRatio(firstHex, secondHex) {
    const luminance = (hex) => {
      const channel = (offset) => {
        const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
    };
    const a = luminance(firstHex);
    const b = luminance(secondHex);
    const lighter = Math.max(a, b);
    const darker = Math.min(a, b);
    return (lighter + 0.05) / (darker + 0.05);
  }

  return {
    paletteFromSeed,
    packScheme,
    unpack,
    unpackAlpha,
    chromaOf,
    contrastRatio,
  };
}


export { createPaletteEngine, ROLE_ORDER, FIXED_ROLE_ORDER, PRESETS, DEFAULT_PRESET };
export { mcu };
