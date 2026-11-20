/**
 * 构建脚本与 Host 端共用的配色引擎。
 *
 * 所有入口均由 `createPaletteEngine(mcu)` 生成。该函数接收 Material Color Utilities
 * 的模块对象作为参数，本身不 import 该库，同一实现可供两个加载器使用：
 *
 *   - `build/generate-palettes.mjs` 直接传入 vendored 目录。
 *   - `plugin/lib/palette.js` 由此文件与 `src/parts/palette-spec.js` 拼接而成，随包携带
 *     `plugin/lib/mcu/` 中的依赖。
 *
 * 文件中唯一的 import 是角色表，打包拼接时会移除该声明（见 `build/bundle-client.mjs`
 * 与 `build/bundle-host.mjs`）。
 *
 * 每套配色压缩为一个十六进制字符串：45 个角色 × 6 位，按 `ROLE_ORDER` 排列，去掉
 * 前缀 `#`。按字符串切片比按对象携带每套配色开销更低，生成的文件也仍可阅读。
 */

import { FIXED_ROLE_ORDER, ROLE_ORDER } from './palette-spec.js';

/** 角色名到其在压缩串中槽位的映射。 */
const ROLE_INDEX = new Map(
  [...ROLE_ORDER, 'surfaceTint', ...FIXED_ROLE_ORDER].map((role, index) => [role, index]),
);

/** 固定色相使成功色与警告色不随种子色漂移。 */
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
 * 在一个 Material Color Utilities 模块对象上建立引擎。
 *
 * @param mcu vendored 的 `@material/material-color-utilities` 命名空间。
 * @returns 两半共用的配色操作。
 */
export function createPaletteEngine(mcu) {
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

  /** 压缩一套方案的全部角色。 */
  function packScheme(scheme, isDark) {
    const values = [...schemeRoleValues(scheme), ...fixedRoleValues(isDark)];
    for (const value of values) {
      if (!/^#[0-9a-f]{6}$/u.test(value)) {
        throw new Error('配色引擎：角色取值格式不正确 "' + value + '"');
      }
    }
    return values.map((hex) => hex.slice(1)).join('');
  }

  /**
   * 用插件采用的调和方式，从种子色推导明暗两套方案。
   *
   * tonal spot 是 Material 3 的默认方案，从任一预设得到的角色表与设计系统文档一致。
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

  /** 颜色的彩度，用于判断系统强调色是否接近中性。 */
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
