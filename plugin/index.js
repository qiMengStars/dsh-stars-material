/**
 * Host half of the Material 3 theme bundle.
 *
 * All rendering happens in the Client module (`client.js`), which the loader
 * mounts into the web UI. This half exists for the one thing a browser cannot
 * do: read the operating system accent colour.
 *
 * The Client asks for it once on load and whenever the user switches to
 * "follow system". The answer is the accent colour plus the complete Material 3
 * role set derived from it in both schemes, so the browser never has to run a
 * colour library.
 *
 * The same route also answers `?seed=#rrggbb` for the custom-colour control.
 * Those requests use the identical palette engine but skip the operating-system
 * read and its cache: the seed comes from the user, so every colour change must
 * be derived afresh.
 *
 * Everything here degrades: a missing service, a blocked child process, a
 * registry key that does not exist and an unparseable value all end as
 * `{ ok: false, reason }`, and the Client falls back to a preset palette.
 */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { createPaletteEngine, mcu } from './lib/palette.js';

/** Hard dependency: without a web server there is nothing to answer the Client. */
export const inject = ['webServer'];

const ROUTE = '/stars-material/palette';

/** Accent colours are user settings; re-reading them every keystroke is waste. */
const CACHE_MS = 30_000;

/** Below this chroma a colour is a grey, i.e. no accent has been chosen. */
const MIN_CHROMA = 5;

/**
 * Electron can answer the accent colour without a child process.
 *
 * `reg.exe` is the portable route, but running it spawns a process on every
 * refresh and is blocked outright in some sandboxes. `systemPreferences` is the
 * same value the OS reports, straight from the main process, so it is tried
 * first and `reg.exe` becomes the fallback.
 *
 * `electron` is not a dependency of this package: it is resolved from the
 * harness process that loads the bundle, and a plain `node` run simply does not
 * find it.
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
    // Not running inside Electron, or the sandbox hides the module.
  }
  return systemPreferencesCache;
}

/**
 * The OS accent colour as `#rrggbb`, or `null` when Electron cannot answer.
 *
 * Electron documents `getAccentColor()` as returning the system colour in
 * `#RRGGBBAA` hex form, so the first six digits are the colour and the last two
 * are alpha — which is the only part Material 3 cannot use.
 *
 * @see https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetaccentcolor
 */
function accentFromElectron() {
  const preferences = loadSystemPreferences();
  if (preferences === null) return null;
  try {
    // Electron returns `#RRGGBBAA` on Windows and macOS alike; some builds drop
    // the alpha, so both lengths are accepted.
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
 * Whether the request came from a page this harness served.
 *
 * `getOrigin()` throws before the listener binds, so it is read lazily and any
 * failure falls back to comparing the request's own host with its `Origin`
 * header — the same DNS-rebinding guard, computed from the request alone.
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
    // A malformed origin leaves only the exact host to compare against.
  }

  // The `Host` check is the DNS-rebinding guard. A page served from another
  // site still reaches a loopback listener with a matching `Host`, so any
  // `Origin` that is present has to name this harness as well.
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

/** Run `reg query` for one value and return its DWORD, or `null`. */
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
 * The DWM writes two different orders and both are used in the wild:
 *
 *   - `ColorizationColor` is `0xAARRGGBB`.
 *   - `AccentColor` is `0xAABBGGRR` — the same value with red and blue swapped.
 *
 * `AccentColor` is the one Windows exposes in Settings, so it wins; the other is
 * only a cross-check. Reading both is what makes the result correct on machines
 * that disagree, which is why neither is trusted alone.
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

/** `0xAARRGGBB` to `#rrggbb`. */
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

/** Whether Windows is set to dark mode, used for the reduced-motion-free hint. */
async function readAppsUseLightTheme() {
  const value = await queryRegistry(
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
    'AppsUseLightTheme',
  );
  return value === null ? null : value === 1;
}

/**
 * Read the operating system accent colour and derive the palette.
 *
 * @returns `{ ok: true, seed, light, dark, appsUseLightTheme }` or
 *   `{ ok: false, reason }`. Never throws.
 */
async function readSystemPalette(engine) {
  if (process.platform !== 'win32') {
    return { ok: false, reason: 'system accent colour is only read on Windows' };
  }

  // Fast path: no child process, no registry parsing.
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

  // A grey accent means "automatic colouring is off"; Material 3 cannot derive
  // a hue from it, so the baseline palette is the honest answer.
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
 * Register the palette route.
 *
 * `apply` is the bundle entry point the loader calls. Everything it creates is
 * wrapped in `ctx.effect` so unloading the bundle removes the route again.
 */
export function apply(ctx) {
  const engine = createPaletteEngine(mcu);

  let cached = null;
  let cachedAt = 0;
  let inFlight = null;

  /** Answer once per {@link CACHE_MS}, and share one read between callers. */
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
        // The palette follows a user setting; a stale copy would be wrong.
        response.setHeader('cache-control', 'no-store');
        response.end(JSON.stringify(payload));
      },
    });
  }, 'material 3 palette route');
}
