/**
 * 构建期预设调色板生成器。
 *
 * 导入本地缓存的 `vendor/material-color-utilities`，为 8 套内置预设生成
 * `src/generated/palettes.js`，使 Client 端切换预设时无需携带色彩库或请求 Host 端。
 * 跟随系统与自定义颜色模式不在构建期生成，由 Host 端在运行时实时推导。
 *
 *   node build/generate-palettes.mjs
 *
 * 单套配色编码为 270 位小写十六进制字符串（45 个角色 × 6 位，不含 `#`）。
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FIXED_ROLE_ORDER,
  PRESETS,
  ROLE_ORDER,
  VARIANT_CLASS,
  VARIANT_ID,
} from '../src/parts/palette-spec.js';
import { createPaletteEngine } from '../src/parts/palette-engine.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const MCU_ENTRY = resolve(REPO, 'vendor/material-color-utilities/index.js');
const OUT_DIR = resolve(REPO, 'src/generated');
const OUT_FILE = resolve(OUT_DIR, 'palettes.js');

const mcu = await import(`file://${MCU_ENTRY.replaceAll('\\', '/')}`);
const engine = createPaletteEngine(mcu);

/** 基础组件与状态色必须满足的对比度配对。 */
const CONTRAST_PAIRS = [
  ['onSurface', 'surface'],
  ['onSurfaceVariant', 'surface'],
  ['onPrimary', 'primary'],
  ['onPrimaryContainer', 'primaryContainer'],
  ['onSecondaryContainer', 'secondaryContainer'],
  ['onError', 'error'],
  ['onErrorContainer', 'errorContainer'],
  ['onSuccessContainer', 'successContainer'],
  ['onWarningContainer', 'warningContainer'],
];

/** 表面正文的最小对比度为 4.5:1，其余交互/状态配对默认按 3:1 校验。 */
const MIN_CONTRAST = {
  onSurface: 4.5,
  onSurfaceVariant: 3,
};

/** 需在各级容器背景色上满足 4.5:1 可读性的正文文本配对。 */
const TEXT_CONTRAST_PAIRS = [
  ['onSurfaceVariant', 'surface'],
  ['onSurfaceVariant', 'surfaceContainerLow'],
  ['onSurfaceVariant', 'surfaceContainer'],
  ['onSurfaceVariant', 'surfaceContainerHigh'],
  ['onSurfaceVariant', 'surfaceContainerHighest'],
  ['onSurfaceVariant', 'secondaryContainer'],
  ['onSurface', 'surfaceContainerHighest'],
  ['onSecondaryContainer', 'secondaryContainer'],
];

const MIN_TEXT_CONTRAST = 4.5;

const ALL_ROLES = [...ROLE_ORDER, 'surfaceTint', ...FIXED_ROLE_ORDER];

function assertContrast(presetId, schemeName, packed) {
  for (const [foreground, background] of CONTRAST_PAIRS) {
    const ratio = engine.contrastRatio(
      engine.unpack(packed, foreground),
      engine.unpack(packed, background),
    );
    const floor = MIN_CONTRAST[foreground] ?? 3;
    if (ratio < floor) {
      throw new Error(
        `预设 "${presetId}"（${schemeName}）：${foreground} 与 ${background} 对比度为 ` +
          `${ratio.toFixed(2)}:1，低于最低要求 ${floor}:1`,
      );
    }
  }
  for (const [foreground, background] of TEXT_CONTRAST_PAIRS) {
    const ratio = engine.contrastRatio(
      engine.unpack(packed, foreground),
      engine.unpack(packed, background),
    );
    if (ratio < MIN_TEXT_CONTRAST) {
      throw new Error(
        `预设 "${presetId}"（${schemeName}）：正文 ${foreground} 与 ${background} 对比度为 ` +
          `${ratio.toFixed(2)}:1，低于最低要求 ${MIN_TEXT_CONTRAST}:1`,
      );
    }
  }
}

function buildPalettes() {
  const palettes = {};
  for (const preset of PRESETS) {
    const palette = engine.paletteFromSeed(preset.hex);
    assertContrast(preset.id, 'light', palette.light);
    assertContrast(preset.id, 'dark', palette.dark);
    palettes[preset.id] = palette;
  }
  return palettes;
}

const palettes = buildPalettes();

const banner = `/**
 * 由 build/generate-palettes.mjs 自动生成，请勿手动修改。
 *
 * 单套配色编码为 270 位小写十六进制字符串（45 个角色 × 6 位，不含 "#"），
 * 顺序与 ROLES 一致，运行时按索引切片读取。
 *
 * \`PRESET_TABLE\` 按 \`src/parts/palette-spec.js\` 中的预设 ID 索引，包含浅色与深色两套配色，
 * 共 ${PRESETS.length} 套预设 × 2 套方案 = ${PRESETS.length * 2} 组（每组 ${ALL_ROLES.length} 个角色，算法：${VARIANT_ID} / ${VARIANT_CLASS}）。
 */`;

const body = `${banner}

export const ROLES = ${JSON.stringify(ALL_ROLES)};

export const PRESET_TABLE = ${JSON.stringify(palettes)};
`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, body, 'utf8');

const bytes = Buffer.byteLength(body, 'utf8');
console.log(`已写出 ${OUT_FILE}（${bytes} 字节）`);
console.log(`预设=${PRESETS.length} 角色=${ALL_ROLES.length} 调和=${VARIANT_ID}`);
