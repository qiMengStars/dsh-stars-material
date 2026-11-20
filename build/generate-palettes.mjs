/**
 * 构建期的调色板生成器。
 *
 * 读取 `vendor/material-color-utilities` 中 vendored 的 Material Color Utilities，
 * 生成 `src/generated/palettes.js`：普通 JavaScript 模块，包含插件在不查询操作系统的
 * 前提下可显示的全部配色。Client 端据此无需携带色彩库，切换预设也无需与 Host 往返。
 *
 *   node build/generate-palettes.mjs
 *
 * 自动模式（跟随系统强调色）不在此生成，其配色由 Host 端在运行时从操作系统推导。
 * 只覆盖设置页手动模式提供的 8 个 Material 3 预设。
 *
 * 产物采用紧凑格式：每套配色编码为一条十六进制字符串，包含 45 个角色 × 6 位，
 * 按 ROLES 顺序排列，并去掉每个颜色值开头的 `#`。
 *
 * vendored 副本为 Material Color Utilities v0.4.0，相对 import 均已补上 `.js` 后缀；
 * 详见 vendor/material-color-utilities/README.md 与 build/vendor-mcu.mjs。
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

/** 每套配色都必须满足的对比度配对。 */
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

/** 表面上正文的最小对比度为 4.5:1，其余配对为 3:1。 */
const MIN_CONTRAST = {
  onSurface: 4.5,
  onSurfaceVariant: 3,
};

/**
 * 需在每一种容器色上保持可读的正文配对。
 *
 * `label-tertiary` 是产品中使用最多的次要文字颜色，除页面底色外，还用于卡片、菜单
 * 和选中行填充。Material 3 要求这些场景的对比度不低于 4.5:1，每套配色对全部容器
 * 色逐一校验。
 */
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

/** 正文配对的最小对比度，所有 TEXT_CONTRAST_PAIRS 均按此值校验。 */
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
        `预设 "${presetId}" ${schemeName}：${foreground} 压在 ${background} 上是 ` +
          `${ratio.toFixed(2)}:1，低于 ${floor}:1`,
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
        `预设 "${presetId}" ${schemeName}：正文 ${foreground} 压在 ${background} 上是 ` +
          `${ratio.toFixed(2)}:1，低于 ${MIN_TEXT_CONTRAST}:1`,
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
 * 由 build/generate-palettes.mjs 生成，请勿手动修改。
 *
 * 每套配色编码为一条十六进制字符串，包含 45 个角色 × 6 位，按 ROLES 顺序排列，
 * 并去掉每个颜色值开头的 "#"。取值时按角色截取对应片段，因此 Client 端无需携带色彩库。
 * 重新生成时执行：
 *
 *   node build/generate-palettes.mjs
 *
 * \`PRESET_TABLE\` 按预设 id 索引，包含明暗两套配色。预设清单（id、种子色、显示名）
 * 定义在 \`src/parts/palette-spec.js\`，设置页与本产物共用该定义，避免预设集合不一致。
 *
 * 共包含 ${PRESETS.length} 个 Material 3 预设 × 2 套方案 = ${PRESETS.length * 2} 套配色，每套 ${ALL_ROLES.length} 个角色，
 * 全部由单一 "${VARIANT_ID}"（${VARIANT_CLASS}）调和方式推导。
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
