/**
 * Palette engine shared by the build script and the Host half.
 *
 * Every entry point is created by `createPaletteEngine(mcu)`, which takes the
 * Material Color Utilities module object as an argument instead of importing it.
 * That keeps one implementation usable from two very different loaders:
 *
 *   - `build/generate-palettes.mjs` passes the vendored checkout directly.
 *   - `plugin/lib/palette.js` is generated from this file plus
 *     `src/parts/palette-spec.js` and ships the vendored copy in `plugin/lib/mcu/`.
 *
 * The only import below is the role table, and it disappears when the bundles
 * are concatenated (see `build/bundle-client.mjs` and `build/bundle-host.mjs`).
 *
 * All palettes are packed into ONE hex-digit string: 45 roles x 6 digits in
 * `ROLE_ORDER` order with the leading `#` dropped. Slicing a string is cheaper
 * than carrying an object per palette, and it keeps the generated artifact
 * readable.
 */

import { FIXED_ROLE_ORDER, ROLE_ORDER } from './palette-spec.js';

/** Role name to its slot in a packed palette string. */
const ROLE_INDEX = new Map(
  [...ROLE_ORDER, 'surfaceTint', ...FIXED_ROLE_ORDER].map((role, index) => [role, index]),
);

/** Fixed hues keep success/warning readable regardless of the seed colour. */
const FIXED_PALETTES = {
  success: { hue: 145, chroma: 48 },
  warning: { hue: 75, chroma: 60 },
};

/** Tone choices mirror the M3 primary role pattern. */
const FIXED_TONES = {
  light: { base: 40, onBase: 100, container: 90, onContainer: 10 },
  dark: { base: 80, onBase: 20, container: 30, onContainer: 90 },
};

/**
 * Build the engine over one Material Color Utilities module object.
 *
 * @param mcu the vendored `@material/material-color-utilities` namespace.
 * @returns the palette operations both halves need.
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
        throw new Error('palette engine: scheme is missing role "' + role + '"');
      }
      values.push(hexFromArgb(argb));
    }
    values.push(hexFromArgb(MaterialDynamicColors.surfaceTint.getArgb(scheme)));
    return values;
  }

  /** One scheme's complete role set, packed. */
  function packScheme(scheme, isDark) {
    const values = [...schemeRoleValues(scheme), ...fixedRoleValues(isDark)];
    for (const value of values) {
      if (!/^#[0-9a-f]{6}$/u.test(value)) {
        throw new Error('palette engine: unexpected role value "' + value + '"');
      }
    }
    return values.map((hex) => hex.slice(1)).join('');
  }

  /**
   * Derive both schemes of a seed through the one harmony this plugin ships.
   *
   * Tonal spot is the Material 3 default, so a preset lands on the role table
   * the design system documents rather than on an approximation of it.
   */
  function paletteFromSeed(seedHex) {
    const source = Hct.fromInt(argbFromHex(seedHex));
    return {
      light: packScheme(new SchemeTonalSpot(source, false, 0), false),
      dark: packScheme(new SchemeTonalSpot(source, true, 0), true),
    };
  }

  /** `#rrggbb` for one role out of a packed palette string. */
  function unpack(packed, role) {
    const index = ROLE_INDEX.get(role);
    if (index === undefined) {
      throw new Error('palette engine: unknown role "' + role + '"');
    }
    const start = index * 6;
    return '#' + packed.slice(start, start + 6);
  }

  /** `#rrggbbaa` for one role plus an alpha byte. */
  function unpackAlpha(packed, role, alpha) {
    const byte = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
    return unpack(packed, role) + byte.toString(16).padStart(2, '0');
  }

  /** Hue and chroma of a colour, used to reject a near-neutral OS accent. */
  function chromaOf(seedHex) {
    return Hct.fromInt(argbFromHex(seedHex)).chroma;
  }

  /** WCAG contrast ratio, used by the build assertions. */
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
