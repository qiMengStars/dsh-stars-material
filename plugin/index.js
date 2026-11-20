/**
 * Material 3 主题包的 Host 半边。
 *
 * 所有渲染都在 Client 模块（client.js）里，由加载器挂到 Web UI 上。这一半只负责
 * 浏览器做不到的一件事：读操作系统的强调色。
 *
 * Client 会在加载时问一次，用户切到"跟随系统"时再问。答复是强调色，加上由它推导
 * 出的明暗两套完整 Material 3 角色，于是浏览器里不用跑色彩库。
 *
 * 这里处处可降级：服务缺失、子进程被拦、注册表键不存在、值解析不出来，一律以
 * `{ ok: false, reason }` 收场，Client 退回预设配色。
 */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { createPaletteEngine, mcu } from './lib/palette.js';

/** 硬依赖：没有 web server 就没法回应 Client。 */
export const inject = ['webServer'];

const ROUTE = '/stars-material/palette';

/** 强调色是用户设置，每敲一次键就重读一遍是浪费。 */
const CACHE_MS = 30_000;

/** 彩度低于这个值就是灰的，也就是没选过强调色。 */
const MIN_CHROMA = 5;

/**
 * 有 Electron 时不用起子进程就能拿到强调色。
 *
 * `reg.exe` 是可移植的路子，但每次刷新都要起一个进程，有些沙箱还直接拦掉。
 * `systemPreferences` 给的是操作系统报告的同一個值，直接从主进程拿，所以先试它，
 * `reg.exe` 退为后备。
 *
 * `electron` 不是本包的依赖：它由加载本包的 harness 进程解析，单跑 `node` 就是
 * 找不到。
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
    // 不在 Electron 里，或者沙箱把模块挡住了。
  }
  return systemPreferencesCache;
}

/**
 * 系统强调色，`#rrggbb`；Electron 答不上来就是 `null`。
 *
 * Electron 的文档说 `getAccentColor()` 返回 `#RRGGBBAA`，所以前六位是颜色，后两位
 * 是 alpha——Material 3 用不上那两位。
 *
 * @see https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetaccentcolor
 */
function accentFromElectron() {
  const preferences = loadSystemPreferences();
  if (preferences === null) return null;
  try {
    // Windows 和 macOS 上 Electron 都返回 `#RRGGBBAA`；个别构建会去掉 alpha，所以
    // 两种长度都接受。
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
 * 判断请求是不是本 harness 发出的页面发来的。
 *
 * `getOrigin()` 在监听端口绑定之前会抛错，所以按需读取；取不到时退化为拿请求自己
 * 的 Host 和 `Origin` 头相比——同样是防 DNS 重绑，只是只靠请求本身算。
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
    // origin 解析不出来时，就只剩精确比对 Host 这一条路。
  }

  // Host 检查就是防 DNS 重绑的。别的站点发来的页面照样能带着匹配的 `Host` 打到
  // 环回端口，所以只要带了 `Origin`，它也必须是本 harness。
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

/** 对某个值跑一次 `reg query`，返回它的 DWORD，取不到就是 `null`。 */
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

/**
 * DWM 写这两个值时用的字节序不一样，两种都真实存在于机器上：
 *
 *   - `ColorizationColor` 是 `0xAARRGGBB`。
 *   - `AccentColor` 是 `0xAABBGGRR`——同一个值，红蓝对调。
 *
 * Windows 设置里显示的是 `AccentColor`，所以以它为准，另一个只用来交叉核对。两个
 * 都读，才不会在某些机器上取到反色，也正因为如此谁都不能单独采信。
 */
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

/** `0xAARRGGBB` 转 `#rrggbb`。 */
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

/** Windows 是不是深色模式，用来给 Client 一个提示。 */
async function readAppsUseLightTheme() {
  const value = await queryRegistry(
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
    'AppsUseLightTheme',
  );
  return value === null ? null : value === 1;
}

/**
 * 读系统强调色，并推导出配色。
 *
 * @returns `{ ok: true, seed, light, dark, appsUseLightTheme }` 或
 *   `{ ok: false, reason }`。不会抛错。
 */
async function readSystemPalette(engine) {
  if (process.platform !== 'win32') {
    return { ok: false, reason: 'system accent colour is only read on Windows' };
  }

  // 快路：不起子进程，也不解析注册表。
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
    return { ok: false, reason: 'the accent colour registry values could not be read' };
  }

  const accentSeed = accentDword === null ? null : seedFromDword(accentDword);
  const colorizationSeed =
    colorizationDword === null ? null : seedFromArgbDword(colorizationDword);

  // 灰色强调色意味着"自动取色没开"；Material 3 从里面提不出色相，返回基准配色才是
  // 诚实的答案。
  const candidates = [accentSeed, colorizationSeed].filter((seed) => seed !== null);
  const usable = candidates.find((seed) => engine.chromaOf(seed) >= MIN_CHROMA);
  if (usable === undefined) {
    return { ok: false, reason: 'the Windows accent colour is neutral, so no hue can be derived' };
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

/**
 * 注册配色路由。
 *
 * `apply` 是加载器调用的入口。它建的东西都包在 `ctx.effect` 里，卸载本包时路由会
 * 跟着一起撤掉。
 */
export function apply(ctx) {
  const engine = createPaletteEngine(mcu);

  let cached = null;
  let cachedAt = 0;
  let inFlight = null;

  /** 每 {@link CACHE_MS} 答一次，并发调用共用同一次读取。 */
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
        const payload = await answer();
        response.statusCode = 200;
        response.setHeader('content-type', 'application/json; charset=utf-8');
        // 配色跟着用户设置走，缓存留久了就是错的。
        response.setHeader('cache-control', 'no-store');
        response.end(JSON.stringify(payload));
      },
    });
  }, 'material 3 palette route');
}
