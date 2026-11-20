/**
 * Host 半边的离线检查。
 *
 * 检查重点不是验证 Windows 是否返回强调色（该行为只能在真实桌面环境中验证），
 * 而是验证每条失败路径均以形状完整的 `{ ok: false, reason }` 结束而非抛错，并校验
 * 路由返回的 HTTP 状态码。
 */

import { strict as assert } from 'node:assert';

import { apply, inject } from '../plugin/index.js';

assert.deepEqual(inject, ['webServer'], 'webServer 必须是硬依赖');

let registered = null;
let disposed = 0;
const effects = [];
const ctx = {
  effect(fn, _label) {
    const dispose = fn();
    effects.push(dispose);
    return dispose;
  },
  webServer: {
    getOrigin() {
      throw new Error('listen 尚未绑定端口');
    },
    register(route) {
      registered = route;
      return () => {
        disposed += 1;
      };
    },
  },
};

apply(ctx);
assert.ok(registered !== null, 'apply 必须注册一条路由');
assert.equal(registered.kind, 'exact');
assert.equal(registered.path, '/stars-material/palette');

/** Node.js 请求/响应对象的最小替身。 */
function exchange(headers) {
  const state = { statusCode: 0, headers: {}, body: '' };
  const request = { headers, method: 'GET', url: '/stars-material/palette' };
  const response = {
    get statusCode() {
      return state.statusCode;
    },
    set statusCode(value) {
      state.statusCode = value;
    },
    setHeader(name, value) {
      state.headers[name.toLowerCase()] = value;
    },
    end(body) {
      state.body = body ?? '';
    },
  };
  return { request, response, state };
}

const sameOrigin = exchange({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' });
await registered.handler(sameOrigin.request, sameOrigin.response);
assert.equal(sameOrigin.state.statusCode, 200, '同源请求必须被受理');
assert.equal(sameOrigin.state.headers['cache-control'], 'no-store');
assert.match(sameOrigin.state.headers['content-type'], /application\/json/u);

const crossOrigin = exchange({ host: '127.0.0.1:12345', origin: 'http://evil.example' });
await registered.handler(crossOrigin.request, crossOrigin.response);
assert.equal(crossOrigin.state.statusCode, 403, '跨站请求必须被拒');
assert.equal(crossOrigin.state.body, 'forbidden');

const noHost = exchange({});
await registered.handler(noHost.request, noHost.response);
assert.equal(noHost.state.statusCode, 403, '没有 Host 头的请求必须被拒');

// 无论沙箱如何处理 `reg.exe`，答复都必须是 Client 可据以判断的形状：要么一份配色，
// 要么一条原因。
const payload = JSON.parse(sameOrigin.state.body);
assert.equal(typeof payload.ok, 'boolean');
if (payload.ok) {
  assert.match(payload.seed, /^#[0-9a-f]{6}$/u);
  assert.equal(payload.light.length, 270);
  assert.equal(payload.dark.length, 270);
} else {
  assert.equal(typeof payload.reason, 'string');
  assert.ok(payload.reason.length > 0, '失败时必须给出原因');
}

// 缓存窗口内的第二次请求不得重复读取；响应体逐字节相同即为证据。
const again = exchange({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' });
await registered.handler(again.request, again.response);
assert.equal(again.state.body, sameOrigin.state.body, '答复必须被缓存');

for (const dispose of effects) dispose();
assert.equal(disposed, 1, '移除 effect 时必须一并移除路由');

// ---------------------------------------------------------------------------
// 端口已绑定：`getOrigin()` 返回有效值，精确比对 Host 的分支随之执行。
// ---------------------------------------------------------------------------

const boundEffects = [];
let boundRoute = null;
apply({
  effect(fn, _label) {
    const dispose = fn();
    boundEffects.push(dispose);
    return dispose;
  },
  webServer: {
    getOrigin: () => 'http://127.0.0.1:12345',
    register(route) {
      boundRoute = route;
      return () => {};
    },
  },
});

async function statusOf(headers) {
  const exchange = (() => {
    const state = { statusCode: 0, body: '' };
    return {
      request: { headers, method: 'GET', url: '/stars-material/palette' },
      response: {
        set statusCode(value) {
          state.statusCode = value;
        },
        setHeader() {},
        end(body) {
          state.body = body ?? '';
        },
      },
      state,
    };
  })();
  await boundRoute.handler(exchange.request, exchange.response);
  return exchange.state.statusCode;
}

assert.equal(await statusOf({ host: '127.0.0.1:12345' }), 200, 'Harness 发起的请求必须被受理');
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' }),
  200,
  'Harness 的 origin 必须被接受',
);
assert.equal(
  await statusOf({ host: 'localhost:12345', origin: 'http://localhost:12345' }),
  200,
  '同一监听器的 localhost 写法必须被接受',
);
// DNS 重绑风险：外站页面可携带匹配的 Host 访问环回端口，此时只有 Origin 能区分来源。
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://evil.example' }),
  403,
  'Host 匹配但 Origin 为外站时必须拒绝',
);
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:9999' }),
  403,
  '环回端口不同即视为不同发送方',
);
assert.equal(
  await statusOf({ host: 'attacker.example:12345' }),
  403,
  'Host 不匹配时必须拒绝',
);

for (const dispose of boundEffects) dispose();

console.log(`路由            ${registered.kind} ${registered.path}`);
console.log(`取 origin 失败   仍返回结构化答复`);
console.log(`origin 已绑定    外站 Origin 被拒，环回请求放行`);
console.log(`答复             ${payload.ok ? `种子色 ${payload.seed}` : `拒绝：${payload.reason}`}`);
console.log('host-check 通过');
