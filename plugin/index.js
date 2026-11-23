/**
 * 插件 Host 端入口：向宿主 webServer 注册 `/stars-material/palette` 接口。
 *
 * - 无查询参数：读取 Windows 系统强调色（优先 Electron API，回退注册表），
 *   生成浅色与深色两套 Material 3 配色并按 `CACHE_MS` 缓存；失败时返回
 *   `{ ok: false, reason }`，由 Client 回退至默认预设。
 * - 带 `?seed=#rrggbb`：直接按指定种子色生成配色，不读取系统强调色，也不走系统缓存。
 */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { createPaletteEngine, mcu } from './lib/palette.js';

/** 声明依赖的宿主服务。 */
export const inject = ['webServer'];

const ROUTE = '/stars-material/palette';

/** 系统强调色配色缓存有效期（毫秒）。 */
const CACHE_MS = 30_000;

/** 有效强调色的 HCT 彩度下限；低于该值视为中性灰，不用于生成主题色。 */
const MIN_CHROMA = 5;

/**
 * 尝试从宿主进程获取 Electron 的 `systemPreferences`。
 * 优先于 `reg.exe` 使用，避免每次读取都创建子进程（部分沙箱会拦截）。
 * `electron` 由宿主在运行时提供，不在此包的依赖声明中。
 */
let systemPreferencesCache;
function loadSystemPreferences() {
  if (systemPreferencesCache !== undefined) return systemPreferencesCache;
  systemPreferencesCache = null;
  try {
    const require = createRequire(import.meta.url);
    const electron = require('electron');
    const preferences = electron?.systemPreferences;
    if (typeof preferences?.getAccentColor === 'function') systemPreferencesCache = preferences;
  } catch {
    // 非 Electron 环境或模块加载受限时静默回退到注册表方案。
  }
  return systemPreferencesCache;
}

/**
 * 通过 Electron `systemPreferences.getAccentColor()` 读取系统强调色，返回小写 `#rrggbb`（忽略 alpha），失败返回 null。
 *
 * @see https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetaccentcolor
 */
function accentFromElectron() {
  const preferences = loadSystemPreferences();
  if (preferences === null) return null;
  try {
    const value = preferences.getAccentColor();
    if (typeof value !== 'string') return null;
    const digits = value.replace(/^#/u, '');
    if (!/^[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/u.test(digits)) return null;
    return '#' + digits.slice(0, 6).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * 校验请求是否来自本地 Harness 页面，防止跨站访问与 DNS rebinding。
 * 当端口尚未绑定（`readOrigin()` 抛错）时，退化为比对请求的 `Origin` 与 `Host` 头。
 */
function isSameOrigin(request, readOrigin) {
  const host = request.headers.host;
  if (typeof host !== 'string') return false;

  let origin;
  try {
    origin = readOrigin();
  } catch {
    origin = null;
  }

  if (origin === null) {
    const originHeader = request.headers.origin;
    if (typeof originHeader !== 'string') return true;
    try {
      return new URL(originHeader).host === host;
    } catch {
      return false;
    }
  }

  const expected = origin.replace(/^https?:\/\//u, '').replace(/\/$/u, '');
  const localHosts = [expected];
  try {
    localHosts.push(`localhost:${new URL(origin).port}`);
  } catch {
    // origin 解析失败时仅校验 Host。
  }

  // 校验 Origin 以防 DNS rebinding：外部站点请求可能伪造 Host，但 Origin 不同。
  const originHeader = request.headers.origin;
  if (typeof originHeader === 'string') {
    let sender;
    try {
      sender = new URL(originHeader).host;
    } catch {
      return false;
    }
    if (!localHosts.includes(sender)) return false;
  }

  return localHosts.includes(host);
}

/** 提取查询参数中的 seed 并转为小写，未提供时返回 null。 */
function seedFromRequest(request) {
  let url;
  try {
    url = new URL(request.url ?? '/', 'http://localhost');
  } catch {
    return null;
  }
  const seed = url.searchParams.get('seed');
  return seed === null ? null : seed.toLowerCase();
}

/** 处理 `?seed=#rrggbb` 自定义取色请求；未带 seed 参数时返回 null，交由系统取色流程处理。 */
function answerForSeed(request, engine) {
  const seed = seedFromRequest(request);
  if (seed === null) return null;
  if (!/^#[0-9a-f]{6}$/u.test(seed)) {
    return { status: 400, payload: { ok: false, reason: 'seed 必须为 #rrggbb 格式' } };
  }
  const palette = engine.paletteFromSeed(seed);
  return {
    status: 200,
    payload: { ok: true, seed, light: palette.light, dark: palette.dark },
  };
}

/** 调用 Windows reg.exe 读取指定注册表项的 REG_DWORD 数值，失败返回 null。 */
function queryRegistry(key, value) {
  return new Promise((resolvePromise) => {
    const systemRoot = process.env.SystemRoot ?? 'C:\\Windows';
    const executable = resolve(systemRoot, 'System32', 'reg.exe');
    const args = ['query', key, '/v', value];
    execFile(executable, args, { windowsHide: true, timeout: 4000 }, (error, stdout) => {
      if (error) {
        resolvePromise(null);
        return;
      }
      const match = /REG_DWORD\s+0x([0-9a-fA-F]+)/u.exec(stdout);
      resolvePromise(match === null ? null : Number.parseInt(match[1], 16));
    });
  });
}

/** 将 DWM AccentColor（0xAABBGGRR，小端 ABGR 字节序）转换为 #rrggbb。 */
function seedFromDword(dword) {
  const red = dword & 0xff;
  const green = (dword >> 8) & 0xff;
  const blue = (dword >> 16) & 0xff;
  return (
    '#' +
    red.toString(16).padStart(2, '0') +
    green.toString(16).padStart(2, '0') +
    blue.toString(16).padStart(2, '0')
  );
}

/** 将 DWM ColorizationColor（0xAARRGGBB，ARGB 字节序）转换为 #rrggbb。 */
function seedFromArgbDword(dword) {
  const blue = dword & 0xff;
  const green = (dword >> 8) & 0xff;
  const red = (dword >> 16) & 0xff;
  return (
    '#' +
    red.toString(16).padStart(2, '0') +
    green.toString(16).padStart(2, '0') +
    blue.toString(16).padStart(2, '0')
  );
}

/** 读取 Windows 的 AppsUseLightTheme 注册表项（1 为浅色，0 为深色，读取失败返回 null）。 */
async function readAppsUseLightTheme() {
  const value = await queryRegistry(
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
    'AppsUseLightTheme',
  );
  return value === null ? null : value === 1;
}

/**
 * 读取 Windows 系统强调色并推导明暗两套配色；任何失败均返回 `{ ok: false, reason }`，不向外抛错。
 */
async function readSystemPalette(engine) {
  if (process.platform !== 'win32') {
    return { ok: false, reason: '仅在 Windows 平台支持读取系统强调色' };
  }

  // 优先使用 Electron API，避免创建子进程读取注册表。
  const electronSeed = accentFromElectron();
  if (electronSeed !== null && engine.chromaOf(electronSeed) >= MIN_CHROMA) {
    const palette = engine.paletteFromSeed(electronSeed);
    return {
      ok: true,
      seed: electronSeed,
      light: palette.light,
      dark: palette.dark,
      appsUseLightTheme: await readAppsUseLightTheme(),
    };
  }

  const accentDword = await queryRegistry('HKCU\\Software\\Microsoft\\Windows\\DWM', 'AccentColor');
  const colorizationDword = await queryRegistry(
    'HKCU\\Software\\Microsoft\\Windows\\DWM',
    'ColorizationColor',
  );

  if (accentDword === null && colorizationDword === null) {
    return { ok: false, reason: '无法读取系统强调色注册表项' };
  }

  const accentSeed = accentDword === null ? null : seedFromDword(accentDword);
  const colorizationSeed =
    colorizationDword === null ? null : seedFromArgbDword(colorizationDword);

  // 优先采用 AccentColor，缺失或接近中性灰时回退到 ColorizationColor。
  const candidates = [accentSeed, colorizationSeed].filter((seed) => seed !== null);
  const usable = candidates.find((seed) => engine.chromaOf(seed) >= MIN_CHROMA);
  if (usable === undefined) {
    return { ok: false, reason: '系统强调色接近中性灰，无法提取有效色相' };
  }

  const palette = engine.paletteFromSeed(usable);
  const appsUseLightTheme = await readAppsUseLightTheme();

  return {
    ok: true,
    seed: usable,
    light: palette.light,
    dark: palette.dark,
    appsUseLightTheme,
  };
}

/** 插件 Host 端入口：注册配色路由，资源随 ctx.effect 生命周期自动清理。 */
export function apply(ctx) {
  const engine = createPaletteEngine(mcu);

  let cached = null;
  let cachedAt = 0;
  let inFlight = null;

  /** 带有效期缓存与并发去重的系统配色读取。 */
  const answer = async () => {
    const now = Date.now();
    if (cached !== null && now - cachedAt < CACHE_MS) return cached;

    if (inFlight === null) {
      inFlight = readSystemPalette(engine)
        .catch((error) => ({ ok: false, reason: String(error?.message ?? error) }))
        .then((result) => {
          cached = result;
          cachedAt = Date.now();
          inFlight = null;
          return result;
        });
    }
    return inFlight;
  };

  ctx.effect(() => {
    const readOrigin = () => ctx.webServer.getOrigin();
    return ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: async (request, response) => {
        if (!isSameOrigin(request, readOrigin)) {
          response.statusCode = 403;
          response.end('forbidden');
          return;
        }
        const seeded = answerForSeed(request, engine);
        const payload = seeded === null ? await answer() : seeded.payload;
        response.statusCode = seeded === null ? 200 : seeded.status;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        // 系统强调色可能随时变更，禁止浏览器缓存响应。
        response.setHeader('cache-control', 'no-store');
        response.end(JSON.stringify(payload));
      },
    });
  }, 'Material 3 配色路由');
}
