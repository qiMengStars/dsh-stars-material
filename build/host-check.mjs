/**
 * Host 半边的离线检查。
 *
 * 重点不是证明 Windows 会返回强调色——那只有真机桌面才可能——而是证明每一条失败路径都
 * 以形状完整的 `{ ok: false, reason }` 收场而不是抛错，以及路由回的 HTTP 状态码是对的。
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
      throw new Error('listen 还没绑定端口');
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

/** node 那对请求/响应对象的最小替身。 */
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

// 不管沙箱怎么处理 `reg.exe`，答复都得是 Client 能据以做决定的形状：要么一份配色，要么
// 一句原因。
const payload = JSON.parse(sameOrigin.state.body);
assert.equal(typeof payload.ok, 'boolean');
if (payload.ok) {
  assert.match(payload.seed, /^#[0-9a-f]{6}$/u);
  assert.equal(payload.light.length, 270);
  assert.equal(payload.dark.length, 270);
} else {
  assert.equal(typeof payload.reason, 'string');
  assert.ok(payload.reason.length > 0, '失败也必须说清原因');
}

// 缓存窗口内的第二次请求不该重新读一遍；能看见的证据就是响应体逐字节相同。
const again = exchange({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' });
await registered.handler(again.request, again.response);
assert.equal(again.state.body, sameOrigin.state.body, '答复必须被缓存');

for (const dispose of effects) dispose();
assert.equal(disposed, 1, '撤掉 effect 必须把路由也移除');

// ---------------------------------------------------------------------------
// 端口已绑定的情况：`getOrigin()` 有答复，于是精确比对 Host 那条分支会跑起来。
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

assert.equal(await statusOf({ host: '127.0.0.1:12345' }), 200, 'harness 自己发的请求必须被受理');
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' }),
  200,
  'harness 的 origin 必须被接受',
);
assert.equal(
  await statusOf({ host: 'localhost:12345', origin: 'http://localhost:12345' }),
  200,
  '同一个监听器的 localhost 写法也必须被接受',
);
// DNS 重绑的洞：别的站点发来的页面照样带着匹配的 Host 打到环回端口，这时只有它的 Origin
// 能暴露它。
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://evil.example' }),
  403,
  'Host 匹配但 Origin 是外站的，必须拒',
);
assert.equal(
  await statusOf({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:9999' }),
  403,
  '环回端口不同，就是另一个发送方',
);
assert.equal(
  await statusOf({ host: 'attacker.example:12345' }),
  403,
  'Host 对不上必须拒',
);

for (const dispose of boundEffects) dispose();

console.log(`路由            ${registered.kind} ${registered.path}`);
console.log(`取 origin 失败   照样不崩`);
console.log(`origin 已绑定    外站 Origin 被拒，环回放行`);
console.log(`答复             ${payload.ok ? `种子色 ${payload.seed}` : `拒绝：${payload.reason}`}`);
console.log('host-check 通过');
