/**
 * 构建期的调色板生成器。
 *
 * 读 `vendor/material-color-utilities` 里那份 vendored 的 Material Color Utilities，
 * 生成 `src/generated/palettes.js`：一个普通 JavaScript 模块，装着本插件在不问操作系统
 * 的前提下能显示的全部配色。于是 Client 半边既不用带色彩库，选预设时也不用往返 Host。
 *
 *   node build/generate-palettes.mjs
 *
 * 自动模式（"跟随系统强调色"）不在这里生成：那是 Host 半边运行时从操作系统推出来的。
 * 这里只覆盖设置页手动模式提供的那 8 个 Material 3 预设。
 *
 * 产物的形状是刻意压紧的——每套配色存成一条十六进制字符串（45 个角色 × 6 位，按 ROLES
 * 顺序，去掉每项开头的 `#`）。
 *
 * vendored 的那份是 Material Color Utilities v0.4.0，相对 import 都补上了 `.js`；详见
 * vendor/material-color-utilities/README.md 与 build/vendor-mcu.mjs。
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

/** 压在表面上的正文要 4.5:1，其余的只要能分辨出来。 */
const MIN_CONTRAST = {
  onSurface: 4.5,
  onSurfaceVariant: 3,
};

/**
 * 每一种容器色上都必须看得清的正文。
 *
 * `label-tertiary` 是产品里用得最多的次要墨色，它会压在卡片、菜单和选中行填充上，
 * 不只压在页面底色上。Material 3 对这些地方都要求 4.5:1，所以每套配色要对着全部
 * 容器色验一遍，而不是只对 `surface`。
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

/** 正文对比度下限，上面每一对都按它判。 */
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
 * 由 build/generate-palettes.mjs 生成，不要手改。
 *
 * 每套配色就是一条十六进制字符串：45 个角色 × 6 位，按 ROLES 顺序排，去掉每项开头
 * 的 "#"。取值时按角色切一段，所以发出去的 Client 半边不需要色彩库。要重新生成就跑：
 *
 *   node build/generate-palettes.mjs
 *
 * \`PRESET_TABLE\` 按预设 id 索引，明暗两套都在里面。预设清单（id、种子色、显示名）
 * 放在 \`src/parts/palette-spec.js\`，这样设置页和这份产物不会在"有哪些预设"上打架。
 *
 * 内容是 ${PRESETS.length} 个 Material 3 预设 × 2 套方案 = ${PRESETS.length * 2} 套配色、每套 ${ALL_ROLES.length} 个角色，
 * 全部由单一的 "${VARIANT_ID}"（${VARIANT_CLASS}）调和方式推导。
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
