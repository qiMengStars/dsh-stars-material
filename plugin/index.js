/**
 * Material 3 主题包的 Host 半边。
 *
 * 渲染逻辑位于 Client 模块（client.js），由加载器挂到 Web UI。Host 半边只处理
 * 浏览器无法完成的操作：读取操作系统强调色并推导配色。
 *
 * Client 在加载时和切换到"跟随系统"时各请求一次。响应包含强调色，以及由该色
 * 推导的明暗两套 Material 3 角色，浏览器无需引入色彩库。
 *
 * 服务缺失、子进程被拦截、注册表键不存在或取值解析失败时，返回
 * `{ ok: false, reason }`，由 Client 回退到预设配色。
 */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { createPaletteEngine, mcu } from './lib/palette.js';

/** 注册配色路由所依赖的服务。 */
export const inject = ['webServer'];

const ROUTE = '/stars-material/palette';

/** 强调色缓存时长（毫秒）。 */
const CACHE_MS = 30_000;

/** 判定强调色有效的彩度下限；低于该值视为未设置强调色。 */
const MIN_CHROMA = 5;

/**
 * 通过 Electron 主进程读取强调色，避免创建子进程。
 *
 * reg.exe 需要为每个请求创建进程，部分沙箱会拦截；systemPreferences 返回的
 * 是同一个系统值，优先使用，reg.exe 作为后备。
 *
 * electron 由加载本包的 Harness 进程解析，并非本包的依赖；单独的 node 进程
 * 中无法解析。
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
    // 当前进程未提供 electron 模块，或模块加载被拦截。
  }
  return systemPreferencesCache;
}

/**
 * 读取系统强调色，返回 `#rrggbb`；无法读取时返回 null。
 *
 * Electron 的 getAccentColor() 返回 `#RRGGBBAA`，前六位为颜色值，末两位为
 * alpha 通道，Material 3 配色不使用 alpha。
 *
 * @see https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetaccentcolor
 */
function accentFromElectron() {
  const preferences = loadSystemPreferences();
  if (preferences === null) return null;
  try {
    // Electron 通常返回 `#RRGGBBAA`；部分构建省略 alpha，两种长度均接受。
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
 * 判断请求是否来自本 Harness 提供的页面。
 *
 * getOrigin() 在端口绑定前会抛错，因此按需读取；读取失败时改为比对请求自身的
 * Host 与 Origin 头。
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
    // origin 无法解析时，仅按 Host 精确比对。
  }

  // Origin 头用于抵御 DNS 重绑：外部站点的请求可能携带匹配的 Host，但其 Origin
  // 与本 Harness 不同。
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

/** A custom seed as `#rrggbb`, or `null` when the request did not carry one. */
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

/**
 * Derive a palette from a user-supplied seed.
 *
 * Returns `null` when the request is the ordinary system-colour question.
 * A malformed seed is a bad request rather than a system-colour failure, so it
 * gets its own status code and reason.
 */
function answerForSeed(request, engine) {
  const seed = seedFromRequest(request);
  if (seed === null) return null;
  if (!/^#[0-9a-f]{6}$/u.test(seed)) {
    return { status: 400, payload: { ok: false, reason: 'seed must be a #rrggbb colour' } };
  }
  const palette = engine.paletteFromSeed(seed);
  return {
    status: 200,
    payload: { ok: true, seed, light: palette.light, dark: palette.dark },
  };
}

/** A custom seed as `#rrggbb`, or `null` when the request did not carry one. */
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

/**
 * Derive a palette from a user-supplied seed.
 *
 * Returns `null` when the request is the ordinary system-colour question.
 * A malformed seed is a bad request rather than a system-colour failure, so it
 * gets its own status code and reason.
 */
function answerForSeed(request, engine) {
  const seed = seedFromRequest(request);
  if (seed === null) return null;
  if (!/^#[0-9a-f]{6}$/u.test(seed)) {
    return { status: 400, payload: { ok: false, reason: 'seed must be a #rrggbb colour' } };
  }
  const palette = engine.paletteFromSeed(seed);
  return {
    status: 200,
    payload: { ok: true, seed, light: palette.light, dark: palette.dark },
  };
}

/** 查询注册表项的 DWORD 值；查询失败返回 null。 */
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
 * 解析 AccentColor 的 ABGR 字节序，转换为 `#rrggbb`。
 *
 * DWM 写入的两个值字节序不同：ColorizationColor 为 0xAARRGGBB，AccentColor
 * 为 0xAABBGGRR。Windows 设置界面显示的是 AccentColor，因此以它为准，
 * ColorizationColor 仅用于交叉核对；两值都读取可避免取到反色。
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

/** 将 ColorizationColor 的 ARGB 值转换为 `#rrggbb`。 */
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

/** 读取 Windows 的深色模式设置，作为提供给 Client 的提示。 */
async function readAppsUseLightTheme() {
  const value = await queryRegistry(
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
    'AppsUseLightTheme',
  );
  return value === null ? null : value === 1;
}

/**
 * 读取系统强调色并推导配色。
 *
 * @returns `{ ok: true, seed, light, dark, appsUseLightTheme }`，或
 *   `{ ok: false, reason }`；不抛错。
 */
async function readSystemPalette(engine) {
  if (process.platform !== 'win32') {
    return { ok: false, reason: '系统强调色仅在 Windows 上读取' };
  }

  // 优先使用 Electron，避免创建进程和读取注册表。
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
    return { ok: false, reason: '无法读取强调色的注册表值' };
  }

  const accentSeed = accentDword === null ? null : seedFromDword(accentDword);
  const colorizationSeed =
    colorizationDword === null ? null : seedFromArgbDword(colorizationDword);

  // 中性色不含色相，无法据此生成 Material 3 配色。
  const candidates = [accentSeed, colorizationSeed].filter((seed) => seed !== null);
  const usable = candidates.find((seed) => engine.chromaOf(seed) >= MIN_CHROMA);
  if (usable === undefined) {
    return { ok: false, reason: '强调色为中性色，无法推导出色相' };
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
 * apply 为加载器调用的入口；创建的资源均由 ctx.effect 管理，卸载本包时一并释放。
 */
export function apply(ctx) {
  const engine = createPaletteEngine(mcu);

  let cached = null;
  let cachedAt = 0;
  let inFlight = null;

  /** 缓存有效期为 CACHE_MS；并发请求共用同一次读取。 */
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
        // 强调色可能随系统设置改变，禁用客户端缓存。
        response.setHeader('cache-control', 'no-store');
        response.end(JSON.stringify(payload));
      },
    });
  }, 'Material 3 配色路由');
}
