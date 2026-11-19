/**
 * Offline check of the Host half.
 *
 * The point is not to prove that Windows returns an accent colour — that only
 * happens on a real desktop — but to prove that every failure path ends in a
 * well-formed `{ ok: false, reason }` instead of a throw, and that the route
 * answers with the right status codes.
 */

import { strict as assert } from 'node:assert';

import { apply, inject } from '../plugin/index.js';

assert.deepEqual(inject, ['webServer'], 'webServer must be a hard dependency');

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
      throw new Error('listen has not bound a port yet');
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
assert.ok(registered !== null, 'apply must register one route');
assert.equal(registered.kind, 'exact');
assert.equal(registered.path, '/material-3/palette');

/** Minimal stand-in for the node request/response pair. */
function exchange(headers) {
  const state = { statusCode: 0, headers: {}, body: '' };
  const request = { headers, method: 'GET', url: '/material-3/palette' };
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
assert.equal(sameOrigin.state.statusCode, 200, 'same-origin request must be served');
assert.equal(sameOrigin.state.headers['cache-control'], 'no-store');
assert.match(sameOrigin.state.headers['content-type'], /application\/json/u);

const crossOrigin = exchange({ host: '127.0.0.1:12345', origin: 'http://evil.example' });
await registered.handler(crossOrigin.request, crossOrigin.response);
assert.equal(crossOrigin.state.statusCode, 403, 'cross-origin request must be refused');
assert.equal(crossOrigin.state.body, 'forbidden');

const noHost = exchange({});
await registered.handler(noHost.request, noHost.response);
assert.equal(noHost.state.statusCode, 403, 'a request with no Host header must be refused');

// Whatever the sandbox does with `reg.exe`, the payload has to be a decision the
// Client can act on: either a palette or a reason string.
const payload = JSON.parse(sameOrigin.state.body);
assert.equal(typeof payload.ok, 'boolean');
if (payload.ok) {
  assert.match(payload.seed, /^#[0-9a-f]{6}$/u);
  assert.equal(payload.light.length, 270);
  assert.equal(payload.dark.length, 270);
} else {
  assert.equal(typeof payload.reason, 'string');
  assert.ok(payload.reason.length > 0, 'a failure must explain itself');
}

// A second request inside the cache window must not restart the reader; the
// observable proof is that the body is byte-identical.
const again = exchange({ host: '127.0.0.1:12345', origin: 'http://127.0.0.1:12345' });
await registered.handler(again.request, again.response);
assert.equal(again.state.body, sameOrigin.state.body, 'the answer must be cached');

for (const dispose of effects) dispose();
assert.equal(disposed, 1, 'disposing the effect must remove the route');

console.log(`host route        ${registered.kind} ${registered.path}`);
console.log(`origin fallback   getOrigin() throwing is survivable`);
console.log(`payload           ${payload.ok ? `seed ${payload.seed}` : `declined: ${payload.reason}`}`);
console.log('host-check OK');
