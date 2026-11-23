/**
 * 构建脚本与 Host 端共用的配色引擎。
 *
 * 通过 `createPaletteEngine(mcu)` 注入 `@material/material-color-utilities` 命名空间，
 * 使同一套实现可同时服务于构建期与运行时：
 *   - `build/generate-palettes.mjs` 直接传入 `vendor/material-color-utilities`
 *   - `build/bundle-host.mjs` 将本文件与 `src/parts/palette-spec.js` 合并生成 `plugin/lib/palette.js`
 *
 * 单套配色编码为 270 位小写十六进制字符串（45 个角色 × 6 位，不含 `#`），角色顺序依次为
 * `ROLE_ORDER`、`surfaceTint` 与 `FIXED_ROLE_ORDER`。
 */

import { FIXED_ROLE_ORDER, ROLE_ORDER } from './palette-spec.js';

/** 角色名到压缩串槽位索引（0–44）的映射。 */
const ROLE_INDEX = new Map(
  [...ROLE_ORDER, 'surfaceTint', ...FIXED_ROLE_ORDER].map((role, index) => [role, index]),
);

/** 固定色相与彩度，确保成功色与警告色不随种子色偏移。 */
const FIXED_PALETTES = {
  success: { hue: 145, chroma: 48 },
  warning: { hue: 75, chroma: 60 },
};

/** 固定语义色的明度（tone）配置，沿用 Material 3 标准角色的明暗规律。 */
const FIXED_TONES = {
  light: { base: 40, onBase: 100, container: 90, onContainer: 10 },
  dark: { base: 80, onBase: 20, container: 30, onContainer: 90 },
};

/**
 * 基于传入的 Material Color Utilities 模块创建配色引擎。
 *
 * @param mcu `@material/material-color-utilities` 命名空间对象。
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
        throw new Error('palette-engine: 方案缺少角色 "' + role + '"');
      }
      values.push(hexFromArgb(argb));
    }
    values.push(hexFromArgb(MaterialDynamicColors.surfaceTint.getArgb(scheme)));
    return values;
  }

  /** 将单个方案的 45 个角色打包为 270 位十六进制字符串。 */
  function packScheme(scheme, isDark) {
    const values = [...schemeRoleValues(scheme), ...fixedRoleValues(isDark)];
    for (const value of values) {
      if (!/^#[0-9a-f]{6}$/u.test(value)) {
        throw new Error('palette-engine: 角色颜色格式无效 "' + value + '"');
      }
    }
    return values.map((hex) => hex.slice(1)).join('');
  }

  /** 使用 Tonal Spot 算法由种子色同步生成浅色与深色两套压缩配色。 */
  function paletteFromSeed(seedHex) {
    const source = Hct.fromInt(argbFromHex(seedHex));
    return {
      light: packScheme(new SchemeTonalSpot(source, false, 0), false),
      dark: packScheme(new SchemeTonalSpot(source, true, 0), true),
    };
  }

  /** 从压缩配色串中读取指定角色的 #rrggbb 值。 */
  function unpack(packed, role) {
    const index = ROLE_INDEX.get(role);
    if (index === undefined) {
      throw new Error('palette-engine: 未知角色 "' + role + '"');
    }
    const start = index * 6;
    return '#' + packed.slice(start, start + 6);
  }

  /** 读取指定角色并附加透明度通道，返回 #rrggbbaa。 */
  function unpackAlpha(packed, role, alpha) {
    const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
    return unpack(packed, role) + byte.toString(16).padStart(2, '0');
  }

  /** 计算颜色在 HCT 空间中的彩度，用于过滤接近中性灰的系统强调色。 */
  function chromaOf(seedHex) {
    return Hct.fromInt(argbFromHex(seedHex)).chroma;
  }

  /** 计算两色之间的 WCAG 对比度，供构建期校验使用。 */
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
