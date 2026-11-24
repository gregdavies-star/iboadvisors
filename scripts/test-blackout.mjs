/* ==========================================================================
   Blackout-date tests (no dependencies, no network).

     npm run test:blackout

   Covers the dated blackout in api/_scheduler.js (default 30 Nov - 7 Dec 2026,
   America/New_York, both ends inclusive): range parsing and boundaries, the
   hasMore hint, and that all four scheduler endpoints refuse a blacked-out
   time while still offering and booking times outside it. HubSpot is replaced
   by a fake globalThis.fetch. Run test-scheduler.mjs for everything else.
   ========================================================================== */
import assert from 'node:assert/strict';

process.env.IBO_HUBSPOT_SERVICE_KEY = 'test-token';
const errors = [];
const realError = console.error;
console.error = (...a) => errors.push(a.join(' '));

// 1. The shipped default, on a module instance of its own.
delete process.env.IBO_BLACKOUT;
const def = await import('../api/_scheduler.js?default');
// 2. A malformed override falls back to the default.
process.env.IBO_BLACKOUT = 'next week please';
const bad = await import('../api/_scheduler.js?bad');
// 3. A blackout around "now", so the handlers (which use the real clock) can be driven.
const HALF = 1800000;
const DAY = 86400000;
const MIN = 60000;
const now = Date.now();
const etDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
process.env.IBO_BLACKOUT = `${etDate(now + DAY)}/${etDate(now + 10 * DAY)}`;
const sched = await import('../api/_scheduler.js');
const book = await import('../api/book.js');
const partnerBook = await import('../api/partner-book.js');
const partnerAvailability = await import('../api/partner-availability.js');
const availability = await import('../api/availability.js');
const { LINKS, EBITDA_PROPERTY, LINK_BANDS } = sched;

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok  ${name}`); } catch (err) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n       ') : err}`);
  }
}

const realFetch = globalThis.fetch;
let calls = [];
const jsonResponse = (status, body) => {
  const text = body === undefined ? '' : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, json: async () => JSON.parse(text), text: async () => text };
};
function useFetch(routes) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : undefined });
    for (const [match, respond] of routes) if (match(String(url), init)) return respond(String(url), init);
    throw new Error(`unexpected fetch ${init.method || 'GET'} ${url}`);
  };
}
const isContactSearch = (u) => u.includes('/crm/v3/objects/contacts/search');
const isAvailability = (u) => u.includes('/availability-page/');
const isBookPost = (u, i) => i.method === 'POST' && u.startsWith(sched.SCHEDULER_BASE + '?');
const isDetails = (u, i) => (i.method || 'GET') === 'GET' && u.startsWith(sched.SCHEDULER_BASE + '/') && !isAvailability(u);
const details = { linkId: 1, customParams: { startTimeIncrementMinutes: 30, formFields: [{ name: EBITDA_PROPERTY, label: 'EBITDA', isRequired: true, enumeratedValues: LINK_BANDS }] } };
const detailsResponse = () => (u) => (/[?&]timezone=[^&]+/.test(u) ? jsonResponse(200, details) : jsonResponse(400, {}));
const availabilityBody = (starts, hasMore = false) => ({
  linkAvailability: {
    linkAvailabilityByDuration: { 1800000: { meetingDurationMillis: HALF, availabilities: starts.map((s) => ({ startMillisUtc: s, endMillisUtc: s + HALF })) } },
    hasMore,
  },
});

const quiet = { warn: console.warn, info: console.info, error: realError };
console.warn = () => {}; console.info = () => {};
console.log = (...a) => process.stdout.write(a.join(' ') + '\n');

function fakeReq(body) {
  return { method: 'POST', headers: { 'content-type': 'application/json', host: 'www.iboadvisors.com', origin: 'https://www.iboadvisors.com' }, body };
}
function fakeRes() {
  return { statusCode: 0, headers: {}, raw: '', setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(s) { this.raw = s; }, get json() { return JSON.parse(this.raw); } };
}

const inside = Math.ceil((now + 3 * DAY) / HALF) * HALF; // inside the around-now blackout
const outside = Math.ceil((now + 20 * DAY) / HALF) * HALF; // after it
const before = Math.ceil((now + 3 * 3600000) / HALF) * HALF; // today, before it starts

console.log('blackout tests');

// ---- the shipped default ----
await test('default blackout is 30 Nov - 7 Dec 2026 ET, both days inclusive', () => {
  const [b] = def.BLACKOUTS;
  assert.equal(def.BLACKOUTS.length, 1);
  assert.equal(new Date(b.start).toISOString(), '2026-11-30T05:00:00.000Z');
  assert.equal(new Date(b.end).toISOString(), '2026-12-08T05:00:00.000Z');
});
await test('default blackout boundaries: Nov 29 23:30 ET open, Nov 30 00:00 ET out, Dec 7 23:30 ET out, Dec 8 00:00 ET open', () => {
  const t = (iso) => Date.parse(iso);
  assert.equal(def.inBlackout(t('2026-11-30T04:30:00Z')), false);
  assert.equal(def.inBlackout(t('2026-11-30T05:00:00Z')), true);
  assert.equal(def.inBlackout(t('2026-12-08T04:30:00Z')), true);
  assert.equal(def.inBlackout(t('2026-12-08T05:00:00Z')), false);
  // Auckland visitor: Dec 8 09:00 NZDT is Dec 7 15:00 ET, still blacked out; Dec 8 19:00 NZDT is Dec 8 01:00 ET, open
  assert.equal(def.inBlackout(t('2026-12-07T20:00:00Z')), true);
  assert.equal(def.inBlackout(t('2026-12-08T06:00:00Z')), false);
});
await test('extractSlots drops blacked-out starts (and explicit options.blackouts overrides the default)', () => {
  const t = (iso) => Date.parse(iso);
  const starts = [t('2026-11-29T20:00:00Z'), t('2026-12-02T15:00:00Z'), t('2026-12-08T15:00:00Z')];
  const data = availabilityBody(starts);
  const ref = t('2026-11-24T00:00:00Z');
  assert.deepEqual(def.extractSlots(data, ref, { halfHourOnly: true }).map((s) => s.start), [starts[0], starts[2]]);
  assert.deepEqual(def.extractSlots(data, ref, { halfHourOnly: true, blackouts: [] }).map((s) => s.start), starts);
});
await test('a malformed IBO_BLACKOUT is reported and the default is used', () => {
  assert.deepEqual(bad.BLACKOUTS, def.BLACKOUTS);
  assert.ok(errors.some((e) => e.includes('IBO_BLACKOUT')));
});

// ---- parsing ----
await test('parseBlackouts: none/empty, several ranges, DST day, malformed', () => {
  assert.deepEqual(def.parseBlackouts('none'), []);
  assert.deepEqual(def.parseBlackouts(''), []);
  const two = def.parseBlackouts('2026-11-30/2026-12-07, 2026-12-24/2026-12-26');
  assert.equal(two.length, 2);
  // 14 Mar 2027 is the spring-forward day: 23 hours long
  const [dst] = def.parseBlackouts('2027-03-14/2027-03-14');
  assert.equal(new Date(dst.start).toISOString(), '2027-03-14T05:00:00.000Z');
  assert.equal(new Date(dst.end).toISOString(), '2027-03-15T04:00:00.000Z');
  for (const s of ['soon', '2026-12-07/2026-11-30', '2026-11-30', '2026-13-01/2026-13-02', '2026-02-30/2026-03-02', '2026-11-30/2026-12-07;x']) {
    assert.equal(def.parseBlackouts(s), null, s);
  }
});

// ---- the hasMore hint ----
await test('blackoutImpliesMore: true while the blackout still ends in or after the month asked for', () => {
  const tz = 'America/New_York';
  const nov24 = Date.parse('2026-11-24T15:00:00Z');
  const nov30 = Date.parse('2026-11-30T15:00:00Z');
  const dec8 = Date.parse('2026-12-08T15:00:00Z');
  assert.equal(def.blackoutImpliesMore(nov24, tz, 0), true); // Nov asked, blackout ends in Dec
  assert.equal(def.blackoutImpliesMore(nov30, tz, 0), true); // the Nov 30 dead-end case
  assert.equal(def.blackoutImpliesMore(nov30, tz, 1), true); // Dec asked, blackout ends Dec 7
  assert.equal(def.blackoutImpliesMore(nov30, tz, 2), false); // Jan asked
  assert.equal(def.blackoutImpliesMore(dec8, tz, 0), false); // over
  assert.equal(def.blackoutImpliesMore(nov24, tz, 0, []), false);
});

// ---- endpoints ----
await test('fetchAvailability: drops the blacked-out slot, keeps the others, and says hasMore even when HubSpot does not', async () => {
  useFetch([[isAvailability, () => jsonResponse(200, availabilityBody([before, inside, outside], false))]]);
  const r = await sched.fetchAvailability('t', 'America/New_York', 0, { slug: LINKS.team.slug, halfHourOnly: true });
  assert.deepEqual(r.slots.map((s) => s.start), [before, outside]);
  assert.equal(r.hasMore, true);
});
await test('/api/availability: both calendars hide the blacked-out slot', async () => {
  for (const [band, cal] of [['%245M%20-%20%2410M', 'team'], ['%2420M%2B', 'michael']]) {
    useFetch([[isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))], [isDetails, detailsResponse()]]);
    const res = fakeRes();
    await availability.default({ method: 'GET', url: `/api/availability?band=${band}` }, res);
    assert.equal(res.statusCode, 200, res.raw);
    assert.equal(res.json.calendar, cal);
    assert.deepEqual(res.json.slots.map((s) => s.start), [outside]);
    assert.equal(res.json.hasMore, true);
    assert.deepEqual(Object.keys(res.json.slots[0]).sort(), ['end', 'start']);
  }
});
await test('/api/partner-availability hides the blacked-out slot', async () => {
  useFetch([[isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))]]);
  const res = fakeRes();
  await partnerAvailability.default({ method: 'GET', url: '/api/partner-availability' }, res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.deepEqual(res.json.slots.map((s) => s.start), [outside]);
  assert.equal(res.json.hasMore, true);
});

const bookBody = (startTime) => ({
  startTime, timezone: 'America/New_York', band: '$5M - $10M', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', answers: {},
});
const partnerBody = (startTime) => ({
  startTime, timezone: 'America/Chicago',
  client: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
  partner: { name: 'Pat Partner', email: 'pat@example.com', cell: '' }, ebitdaBand: '$3M - $5M',
});
const organizer = { postResponse: { organizer: { email: 'darren@iboadvisors.com' } } };
const noBookPost = (c) => c.method === 'POST' && !isContactSearch(c.url);

await test('/api/book: a blacked-out start is 409 slot_unavailable and nothing is booked, even if HubSpot offers it', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))],
    [isDetails, detailsResponse()],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const res = fakeRes();
  await book.default(fakeReq(bookBody(inside)), res);
  assert.equal(res.statusCode, 409, res.raw);
  assert.equal(res.json.error, 'slot_unavailable');
  assert.ok(!calls.some(noBookPost));
});
await test('/api/book: a start outside the blackout still books, payload unchanged', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))],
    [isDetails, detailsResponse()],
    [isBookPost, () => jsonResponse(200, organizer)],
  ]);
  const res = fakeRes();
  await book.default(fakeReq(bookBody(outside)), res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.equal(res.json.calendar, 'team');
  assert.equal(res.json.hubspot.organizer.email, 'darren@iboadvisors.com');
  const post = calls.find(noBookPost);
  assert.deepEqual(post.body, {
    slug: LINKS.team.slug, duration: HALF, startTime: outside, email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe',
    timezone: 'America/New_York', locale: 'en-us', formFields: [{ name: EBITDA_PROPERTY, value: '$5M - $10M' }],
  });
});
await test('/api/book: the Michael-only route is blacked out too', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([inside]))],
    [isDetails, detailsResponse()],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const b = bookBody(inside); b.band = '$20M+';
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.statusCode, 409, res.raw);
  assert.ok(calls.some((c) => isAvailability(c.url) && c.url.includes(encodeURIComponent(LINKS.michael.slug))));
  assert.ok(!calls.some(noBookPost));
});
await test('/api/partner-book: a blacked-out start is 409, an open one books with the partner as guest', async () => {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const res = fakeRes();
  await partnerBook.default(fakeReq(partnerBody(inside)), res);
  assert.equal(res.statusCode, 409, res.raw);
  assert.equal(res.json.error, 'slot_unavailable');
  assert.ok(!calls.some((c) => c.method === 'POST'));

  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([inside, outside]))],
    [isBookPost, () => jsonResponse(200, { postResponse: { organizer: { email: 'michael@iboadvisors.com' } } })],
  ]);
  const ok = fakeRes();
  await partnerBook.default(fakeReq(partnerBody(outside)), ok);
  assert.equal(ok.statusCode, 200, ok.raw);
  const post = calls.find((c) => c.method === 'POST');
  assert.equal(post.body.slug, 'michael-chasen/ibo-discussion');
  assert.deepEqual(post.body.guestEmails, ['pat@example.com']);
  assert.equal(post.body.startTime, outside);
});

globalThis.fetch = realFetch;
Object.assign(console, quiet);
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
