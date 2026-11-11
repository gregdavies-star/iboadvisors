/* Error reporting tests (no dependencies, no network):  npm run test:errors
   Covers tracking.js submitForm failure handling + reportError, the
   /api/client-error endpoint, and the alert helper. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).split('\n').slice(0, 3).join('\n       ')); }
}

// ---- load tracking.js in a fake browser ----
function loadTracking(fetchImpl) {
  const listeners = {};
  const win = {
    location: { href: 'https://www.iboadvisors.com/', origin: 'https://www.iboadvisors.com', pathname: '/', search: '' },
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); },
    localStorage: { getItem() { return null; }, setItem() {} },
  };
  const ctx = {
    window: win, document: { cookie: '', readyState: 'complete', title: 't', referrer: '', querySelectorAll: () => [], addEventListener() {} },
    navigator: { userAgent: 'TestUA', onLine: true }, fetch: fetchImpl, console,
    URL, URLSearchParams, Date, JSON, Math, Object, Array, String, Number, Error, Promise, setTimeout, encodeURIComponent, decodeURIComponent, RegExp, isNaN,
  };
  ctx.self = win; win.document = ctx.document; win.navigator = ctx.navigator;
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../tracking.js', import.meta.url), 'utf8'), ctx);
  return { t: win.iboTracking, listeners };
}
const res = (status, text) => ({ ok: status >= 200 && status < 300, status, json: async () => ({}), text: async () => text });

const F = [{ name: 'firstname', value: 'A' }, { name: 'lastname', value: 'B' }, { name: 'email', value: 'a@b.co' }, { name: 'phone', value: '555 1234' }];

await test('invalid optional phone is dropped and the lead still lands', async () => {
  const bodies = [];
  const { t } = loadTracking(async (url, o) => {
    if (url.includes('client-error')) return res(204, '');
    const b = JSON.parse(o.body).fields.map((f) => f.name); bodies.push(b);
    return b.includes('phone') ? res(400, '{"errors":[{"errorType":"INVALID_PHONE_NUMBER"}]}') : res(200, '');
  });
  await t.submitForm('1', 'g', F);
  assert.ok(bodies.length >= 2 && !bodies.at(-1).includes('phone'));
});

await test('a rejected submission is reported with status and detail, no values', async () => {
  const reports = [];
  const { t } = loadTracking(async (url, o) => {
    if (url.includes('client-error')) { reports.push(JSON.parse(o.body)); return res(204, ''); }
    return res(400, '{"errors":[{"errorType":"BLOCKED_EMAIL"}]}');
  });
  await assert.rejects(() => t.submitForm('1', 'guid-1', F), (e) => e.status === 400);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].kind, 'hubspot_form');
  assert.equal(reports[0].status, 400);
  assert.match(reports[0].detail, /BLOCKED_EMAIL/);
  assert.equal(reports[0].form, 'guid-1');
  assert.ok(!JSON.stringify(reports[0]).includes('a@b.co'));
});

await test('a network failure (blocked request) is reported and flagged', async () => {
  const reports = [];
  const { t } = loadTracking(async (url, o) => {
    if (url.includes('client-error')) { reports.push(JSON.parse(o.body)); return res(204, ''); }
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(() => t.submitForm('1', 'g', F), (e) => e.network === true && e.status === 0);
  assert.equal(reports[0].status, 0);
  assert.match(reports[0].message, /reach HubSpot/);
});

await test('reports are capped at five per page view', async () => {
  let n = 0;
  const { t } = loadTracking(async (url) => { if (url.includes('client-error')) n++; return res(204, ''); });
  for (let i = 0; i < 9; i++) t.reportError('script_error', { message: 'x' });
  assert.equal(n, 5);
});

// ---- endpoint ----
const { default: handler, scrub, normalise } = await import('../api/client-error.js');
const alert = await import('../api/_alert.js');
function fakeRes() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } }; }
const post = (body, extra = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json', host: 'www.iboadvisors.com', origin: 'https://www.iboadvisors.com', ...extra }, body });

await test('scrub removes emails and phone numbers', () => {
  assert.equal(scrub('bad jane.doe@acme.com / +1 (212) 555-0100 x', 100), 'bad [email] / [number] x');
});
await test('normalise rejects unknown kinds', () => { assert.equal(normalise({ kind: 'nope' }), null); });

await test('endpoint logs, alerts the webhook and returns 204', async () => {
  alert.resetAlertThrottle();
  process.env.IBO_ALERT_WEBHOOK_URL = 'https://hooks.example/x';
  const sent = [];
  const realFetch = globalThis.fetch, realErr = console.error;
  globalThis.fetch = async (u, o) => { sent.push({ u, body: JSON.parse(o.body) }); return { ok: true }; };
  console.error = () => {};
  const r = fakeRes();
  await handler(post({ kind: 'hubspot_form', status: 400, detail: 'BLOCKED_EMAIL for x@y.com', form: 'g', fields: ['email'], page: '/' }), r);
  globalThis.fetch = realFetch; console.error = realErr;
  assert.equal(r.statusCode, 204);
  assert.equal(sent.length, 1);
  assert.match(sent[0].body.text, /hubspot_form \(HTTP 400\)/);
  assert.ok(!sent[0].body.text.includes('x@y.com'));
});

await test('identical alerts are throttled', async () => {
  alert.resetAlertThrottle();
  const realErr = console.error; console.error = () => {};
  const a = await alert.sendAlert({ title: 't', signature: 's' });
  const b = await alert.sendAlert({ title: 't', signature: 's' });
  console.error = realErr;
  assert.equal(b.throttled, true); assert.equal(a.throttled, false);
});

await test('cross-origin and non-JSON are refused', async () => {
  let r = fakeRes(); await handler(post({ kind: 'script_error' }, { origin: 'https://evil.example' }), r); assert.equal(r.statusCode, 403);
  r = fakeRes(); await handler(post({ kind: 'script_error' }, { 'content-type': 'text/plain' }), r); assert.equal(r.statusCode, 415);
});

delete process.env.IBO_ALERT_WEBHOOK_URL;
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
