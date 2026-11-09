/* ==========================================================================
   Scheduler API unit tests (no dependencies, no network).

     npm run test:scheduler

   Covers the shared helpers in api/_scheduler.js (half-hour slot filter,
   EBITDA band routing, link-question mapping, contact band lookup) and the
   /api/book handler's validation, missing_answers and booking paths. HubSpot
   is replaced by a fake globalThis.fetch, so nothing here touches the portal.
   ========================================================================== */
import assert from 'node:assert/strict';

process.env.IBO_HUBSPOT_SERVICE_KEY = 'test-token';

const sched = await import('../api/_scheduler.js');
const book = await import('../api/book.js');
const partnerBook = await import('../api/partner-book.js');
const partnerAvailability = await import('../api/partner-availability.js');
const availability = await import('../api/availability.js');
const { extractSlots, linkForBand, fetchLinkDetails, findContactBand, EBITDA_BANDS, LINK_BANDS, CONTACT_BANDS, LINKS, EBITDA_PROPERTY } = sched;

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n       ') : err}`);
  }
}

// ---- fake fetch ----
const realFetch = globalThis.fetch;
let calls = [];
function jsonResponse(status, body) {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(text),
    text: async () => text,
  };
}
// routes: array of [predicate(url, init), responder(url, init)]
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
const isBookPost = (u, i) => (i.method === 'POST') && u.startsWith(sched.SCHEDULER_BASE + '?');
// Link details: HubSpot answers 400 without ?timezone=, and so does this fake.
const isDetails = (u, i) => (i.method || 'GET') === 'GET' && u.startsWith(sched.SCHEDULER_BASE + '/') && !isAvailability(u);
function detailsResponse(status, body) {
  return (u) => (/[?&]timezone=[^&]+/.test(u) ? jsonResponse(status, body) : jsonResponse(400, { message: 'timezone is required' }));
}

// Silence the handlers' status-only logs during tests.
const quiet = { warn: console.warn, info: console.info, error: console.error };
console.warn = () => {}; console.info = () => {}; console.error = () => {};
const log = (...a) => process.stdout.write(a.join(' ') + '\n');
console.log = log;

const HALF = 1800000;
const now = Date.now();
const base = Math.ceil((now + 2 * 86400000) / HALF) * HALF; // a future :00/:30, two days out
const MIN = 60000;

function availabilityBody(starts) {
  return {
    linkAvailability: {
      linkAvailabilityByDuration: {
        1800000: { meetingDurationMillis: 1800000, availabilities: starts.map((s) => ({ startMillisUtc: s, endMillisUtc: s + HALF })) },
      },
      hasMore: false,
    },
    allUsersBusyTimes: [{ busyTimes: [] }],
  };
}

const DETAILS = {
  linkId: 987654,
  slug: 'michael-chasen/discussing-the-ibo',
  customParams: {
    startTimeIncrementMinutes: 30,
    formFields: [
      { label: 'First name', name: 'firstName', fieldType: 'string', isRequired: true },
      { label: 'Last name', name: 'LASTNAME', fieldType: 'string', isRequired: true },
      { label: 'Email', name: 'email', fieldType: 'string', isRequired: true },
      { label: 'Mobile phone number', name: 'mobilephone', fieldType: 'phonenumber', isRequired: true },
      {
        label: "What is your company's industry?", name: 'what_is_your_companys_industry', fieldType: 'select', isRequired: true,
        options: [{ label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Other', value: 'Other' }, { label: 'Hidden', value: 'H', hidden: true }],
      },
      {
        label: 'Approximate annual EBITDA', name: EBITDA_PROPERTY, fieldType: 'enumeration', isRequired: true,
        enumeratedValues: LINK_BANDS,
      },
      { label: 'Anything else?', name: 'notes', fieldType: 'textarea' },
    ],
  },
};

function fakeReq(body, headers = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'www.iboadvisors.com', origin: 'https://www.iboadvisors.com', ...headers },
    body,
  };
}
function fakeRes() {
  return {
    statusCode: 0, headers: {}, raw: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(s) { this.raw = s; },
    get json() { return JSON.parse(this.raw); },
  };
}

log('scheduler tests');

// ---- extractSlots ----
await test('extractSlots: halfHourOnly keeps :00/:30, drops :15/:45, past and duplicates, sorts', () => {
  const starts = [base + 45 * MIN, base, base + 15 * MIN, base + 30 * MIN, base, now - HALF, base + 60 * MIN];
  const data = availabilityBody(starts);
  const all = extractSlots(data, now);
  assert.deepEqual(all.map((s) => s.start), [base, base + 15 * MIN, base + 30 * MIN, base + 45 * MIN, base + 60 * MIN]);
  const half = extractSlots(data, now, { halfHourOnly: true });
  assert.deepEqual(half.map((s) => s.start), [base, base + 30 * MIN, base + 60 * MIN]);
  assert.ok(half.every((s) => s.end === s.start + HALF));
});
await test('extractSlots: tolerates empty / malformed input', () => {
  assert.deepEqual(extractSlots(null, now, { halfHourOnly: true }), []);
  assert.deepEqual(extractSlots({ linkAvailability: {} }, now), []);
});

// ---- linkForBand ----
await test('linkForBand routes $10M+ to michael, everything else to team', () => {
  assert.equal(linkForBand('$0 - $3M'), 'team');
  assert.equal(linkForBand('$3M - $5M'), 'team');
  assert.equal(linkForBand('$5M - $10M'), 'team');
  assert.equal(linkForBand('$10M - $20M'), 'michael');
  assert.equal(linkForBand('$20M+'), 'michael');
  assert.equal(linkForBand(null), 'team');
  assert.equal(linkForBand(undefined), 'team');
  assert.equal(linkForBand('$100M'), 'team');
  assert.equal(linkForBand('$10M+'), 'michael');
  assert.equal(linkForBand('$3M - $10M'), 'team');
  assert.equal(linkForBand('$0 - $1M'), 'team');
  assert.equal(linkForBand('$1M - $3M'), 'team');
  assert.equal(LINKS.partner.slug, 'michael-chasen/ibo-discussion');
  assert.ok(LINKS.michael.slug && LINKS.team.slug);
});
await test('partner-book still exports EBITDA_BANDS and hubspotSubset', () => {
  assert.deepEqual(partnerBook.EBITDA_BANDS, ['$0 - $3M', '$3M - $5M', '$5M - $10M', '$10M - $20M', '$20M+']);
  assert.equal(CONTACT_BANDS.length, 9);
  assert.equal(EBITDA_BANDS, CONTACT_BANDS);
  assert.equal(typeof partnerBook.hubspotSubset, 'function');
});

// ---- fetchLinkDetails ----
await test('fetchLinkDetails maps custom questions and filters standard fields', async () => {
  useFetch([[isDetails, detailsResponse(200, DETAILS)]]);
  const out = await fetchLinkDetails('t', 'michael-chasen/discussing-the-ibo', 'America/Chicago');
  assert.equal(calls[0].url, `${sched.SCHEDULER_BASE}/michael-chasen%2Fdiscussing-the-ibo?timezone=America%2FChicago`);
  assert.equal(out.linkId, '987654');
  assert.equal(out.startTimeIncrementMinutes, 30);
  assert.deepEqual(out.questions.map((q) => q.name), ['mobilephone', 'what_is_your_companys_industry', EBITDA_PROPERTY, 'notes']);
  const [phone, industry, ebitda, notes] = out.questions;
  assert.deepEqual(phone, { name: 'mobilephone', label: 'Mobile phone number', required: true, type: 'phone', options: [] });
  assert.equal(industry.type, 'select');
  assert.deepEqual(industry.options, [{ label: 'Manufacturing', value: 'Manufacturing' }, { label: 'Other', value: 'Other' }]);
  assert.equal(ebitda.type, 'select');
  assert.deepEqual(ebitda.options.map((o) => o.value), LINK_BANDS);
  assert.equal(notes.required, false);
  assert.equal(notes.type, 'text');
});
await test('fetchLinkDetails: missing arrays give no questions; non-2xx throws with upstreamStatus', async () => {
  useFetch([[isDetails, detailsResponse(200, { linkId: 1 })]]);
  const bare = await fetchLinkDetails('t', 'x', 'America/New_York');
  assert.deepEqual(bare.questions, []);
  assert.equal(bare.startTimeIncrementMinutes, null);
  useFetch([[isDetails, () => jsonResponse(404, { message: 'nope' })]]);
  await assert.rejects(fetchLinkDetails('t', 'x'), (e) => e.upstreamStatus === 404);
});

// ---- findContactBand ----
await test('findContactBand returns null on 403 (missing scope)', async () => {
  useFetch([[isContactSearch, () => jsonResponse(403, { category: 'MISSING_SCOPES' })]]);
  assert.equal(await findContactBand('t', 'jane@example.com'), null);
  assert.deepEqual(calls[0].body.properties, [EBITDA_PROPERTY]);
  assert.equal(calls[0].body.filterGroups[0].filters[0].value, 'jane@example.com');
});
await test('findContactBand returns the stored band, null for unknown values or network errors', async () => {
  useFetch([[isContactSearch, () => jsonResponse(200, { total: 1, results: [{ id: '1', properties: { [EBITDA_PROPERTY]: '$20M+' } }] })]]);
  assert.equal(await findContactBand('t', 'jane@example.com'), '$20M+');
  useFetch([[isContactSearch, () => jsonResponse(200, { total: 1, results: [{ id: '1', properties: { [EBITDA_PROPERTY]: 'lots' } }] })]]);
  assert.equal(await findContactBand('t', 'jane@example.com'), null);
  useFetch([[isContactSearch, () => { throw new TypeError('network'); }]]);
  assert.equal(await findContactBand('t', 'jane@example.com'), null);
});

// ---- /api/book validate ----
const goodBody = () => ({
  startTime: base, timezone: 'America/New_York', band: '$5M - $10M',
  firstName: ' Jane ', lastName: 'Doe', email: 'Jane@Example.com',
  answers: { mobilephone: '(555) 123-4567', what_is_your_companys_industry: 'Manufacturing' },
});
await test('book.validate accepts a good body and cleans it', () => {
  const { errors, value } = book.validate(goodBody(), now);
  assert.deepEqual(errors, []);
  assert.equal(value.firstName, 'Jane');
  assert.equal(value.email, 'jane@example.com');
  assert.equal(value.band, '$5M - $10M');
  assert.deepEqual(value.answers, goodBody().answers);
});
await test('book.validate rejects a bad answers key', () => {
  const b = goodBody(); b.answers['Bad-Key'] = 'x';
  assert.ok(book.validate(b, now).errors.some((e) => e.includes('answers keys')));
});
await test('book.validate rejects an unknown band, accepts a missing one', () => {
  const b = goodBody(); b.band = '$50M';
  assert.ok(book.validate(b, now).errors.some((e) => e.includes('band')));
  const c = goodBody(); delete c.band;
  assert.equal(book.validate(c, now).value.band, null);
});
await test('book.validate rejects non-string, over-long and too many answers', () => {
  const a = goodBody(); a.answers.mobilephone = 5551234567;
  assert.ok(book.validate(a, now).errors.length);
  const b = goodBody(); b.answers.notes = 'x'.repeat(501);
  assert.ok(book.validate(b, now).errors.length);
  const c = goodBody(); c.answers = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`q${i}`, 'v']));
  assert.ok(book.validate(c, now).errors.length);
  const d = goodBody(); d.startTime = now - 1000;
  assert.ok(book.validate(d, now).errors.length);
});

// ---- /api/book handler ----
await test('book handler: missing required answers -> 400 missing_answers, nothing booked', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([base, base + 15 * MIN]))],
    [isDetails, detailsResponse(200, DETAILS)],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const b = goodBody(); b.answers = {};
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.json.error, 'missing_answers');
  // the EBITDA question is filled from the band, so only these two are missing
  assert.deepEqual(res.json.missing, ['mobilephone', 'what_is_your_companys_industry']);
  assert.ok(calls.some((c) => isAvailability(c.url) && c.url.includes(encodeURIComponent(LINKS.team.slug))));
  assert.ok(!calls.some((c) => c.method === 'POST' && isBookPost(c.url, { method: 'POST' })));
});
await test('book handler: books the team link, fills EBITDA, drops unknown answers', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
    [isBookPost, () => jsonResponse(200, {
      postResponse: { organizer: { email: 'darren@iboadvisors.com', userId: 162759897, firstName: 'Darren', lastName: 'Gleeman' },
        timerange: { start: base, end: base + HALF } },
    })],
  ]);
  const b = goodBody(); b.answers.not_on_link = 'drop me';
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.statusCode, 200, res.raw);
  const out = res.json;
  assert.equal(out.ok, true);
  assert.equal(out.calendar, 'team');
  assert.equal(out.band, '$5M - $10M');
  assert.equal(out.start, base);
  assert.equal(out.end, base + HALF);
  assert.equal(out.hubspot.organizer.email, 'darren@iboadvisors.com');
  const post = calls.find((c) => c.method === 'POST' && !isContactSearch(c.url));
  assert.equal(post.body.slug, LINKS.team.slug);
  assert.equal(post.body.duration, HALF);
  assert.equal(post.body.locale, 'en-us');
  assert.equal(post.body.guestEmails, undefined);
  assert.deepEqual(post.body.formFields, [
    { name: 'mobilephone', value: '(555) 123-4567' },
    { name: 'what_is_your_companys_industry', value: 'Manufacturing' },
    { name: EBITDA_PROPERTY, value: '$5M - $10M' },
  ]);
  assert.equal(res.headers['cache-control'], 'no-store');
});
await test('book handler: contact band overrides the request band and routes to michael', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(200, { results: [{ properties: { [EBITDA_PROPERTY]: '$10M - $20M' } }] })],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, () => jsonResponse(503, {})],
    [isBookPost, () => jsonResponse(200, { postResponse: { organizer: { email: 'michael@iboadvisors.com' } } })],
  ]);
  const res = fakeRes();
  await book.default(fakeReq(goodBody()), res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.equal(res.json.calendar, 'michael');
  assert.equal(res.json.band, '$10M - $20M');
  const post = calls.find((c) => c.method === 'POST' && !isContactSearch(c.url));
  assert.equal(post.body.slug, LINKS.michael.slug);
  // details unavailable: given answers plus the band are sent as they are
  assert.deepEqual(post.body.formFields.find((f) => f.name === EBITDA_PROPERTY), { name: EBITDA_PROPERTY, value: '$10M - $20M' });
});
await test('book handler: a :15 start is not bookable (409), cross-origin is 403', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([base + 15 * MIN]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const b = goodBody(); b.startTime = base + 15 * MIN;
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.json.error, 'slot_unavailable');
  const res2 = fakeRes();
  await book.default(fakeReq(goodBody(), { origin: 'https://evil.example' }), res2);
  assert.equal(res2.statusCode, 403);
});

await test('book.validate accepts all nine contact bands, including coarse ones', () => {
  for (const band of CONTACT_BANDS) {
    const b = goodBody(); b.band = band;
    assert.deepEqual(book.validate(b, now).errors, [], band);
  }
});
await test('book handler: coarse $3M - $10M leaves a required 5-option EBITDA question unanswered', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const b = goodBody(); b.band = '$3M - $10M';
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.statusCode, 400, res.raw);
  assert.equal(res.json.error, 'missing_answers');
  assert.deepEqual(res.json.missing, [EBITDA_PROPERTY]);
  assert.ok(calls.some((c) => isAvailability(c.url) && c.url.includes(encodeURIComponent(LINKS.team.slug))));
});
await test('book handler: coarse $10M+ routes to michael; buildFormFields fills only matching options', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, {})],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
    [isBookPost, () => { throw new Error('must not book'); }],
  ]);
  const b = goodBody(); b.band = '$10M+';
  const res = fakeRes();
  await book.default(fakeReq(b), res);
  assert.equal(res.json.error, 'missing_answers');
  assert.deepEqual(res.json.missing, [EBITDA_PROPERTY]);
  assert.ok(calls.some((c) => isAvailability(c.url) && c.url.includes(encodeURIComponent(LINKS.michael.slug))));

  const qs = [{ name: EBITDA_PROPERTY, required: true, options: LINK_BANDS.map((v) => ({ label: v, value: v })) }];
  assert.deepEqual(book.buildFormFields(qs, {}, '$5M - $10M'), { missing: [], formFields: [{ name: EBITDA_PROPERTY, value: '$5M - $10M' }] });
  assert.deepEqual(book.buildFormFields(qs, {}, '$3M - $10M'), { missing: [EBITDA_PROPERTY], formFields: [] });
  assert.deepEqual(book.buildFormFields(qs, { [EBITDA_PROPERTY]: '$5M - $10M' }, '$3M - $10M').missing, []);
  const free = [{ name: EBITDA_PROPERTY, required: true, options: [] }];
  assert.deepEqual(book.buildFormFields(free, {}, '$10M+').formFields, [{ name: EBITDA_PROPERTY, value: '$10M+' }]);
  // link questions unknown: a coarse band is not sent as the EBITDA answer
  assert.deepEqual(book.buildFormFields(null, {}, '$10M+').formFields, []);
  assert.deepEqual(book.buildFormFields(null, {}, '$20M+').formFields, [{ name: EBITDA_PROPERTY, value: '$20M+' }]);
});
await test('availability handler: coarse URL band $10M+ routes to michael', async () => {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%2410M%2B' }, res);
  assert.equal(res.json.calendar, 'michael');
  assert.equal(res.json.band, '$10M+');
});
await test('partner-book still rejects a coarse band', () => {
  const r = partnerBook.validate({
    startTime: base, timezone: 'America/Chicago',
    client: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '555-123-4567' },
    partner: { name: 'Pat', email: 'pat@example.com' }, industry: 'Manufacturing', ebitdaBand: '$10M+',
  }, now);
  assert.ok(r.errors.some((e) => e.includes('ebitdaBand')));
});

// ---- partner endpoints unchanged ----
const partnerBody = (extra = {}) => ({
  startTime: base, timezone: 'America/Chicago',
  client: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', ...(extra.client || {}) },
  partner: { name: 'Pat Partner', email: 'pat@example.com', cell: '' },
  ebitdaBand: '$3M - $5M',
  ...(extra.top || {}),
});
function partnerFetch() {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base, base + 15 * MIN]))],
    [isBookPost, () => jsonResponse(200, { postResponse: { organizer: { email: 'michael@iboadvisors.com' } } })],
  ]);
}
await test('partner-book refuses a :15 start with 409, like /api/book', async () => {
  partnerFetch();
  const res = fakeRes();
  await partnerBook.default(fakeReq(partnerBody({ top: { startTime: base + 15 * MIN } })), res);
  assert.equal(res.statusCode, 409, res.raw);
  assert.equal(res.json.error, 'slot_unavailable');
  assert.ok(!calls.some((c) => c.method === 'POST'));
});
await test('partner-availability drops :15/:45 slots', async () => {
  useFetch([[isAvailability, () => jsonResponse(200, availabilityBody([base, base + 15 * MIN, base + 30 * MIN, base + 45 * MIN, base + 60 * MIN]))]]);
  const res = fakeRes();
  await partnerAvailability.default({ method: 'GET', url: '/api/partner-availability?timezone=America%2FChicago&monthOffset=0' }, res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.deepEqual(res.json.slots.map((s) => s.start), [base, base + 30 * MIN, base + 60 * MIN]);
  assert.ok(calls[0].url.includes(encodeURIComponent('michael-chasen/ibo-discussion')));
});
await test('partner-book books a :00 start on the partner link without client phone or industry', async () => {
  partnerFetch();
  const res = fakeRes();
  await partnerBook.default(fakeReq(partnerBody()), res);
  assert.equal(res.statusCode, 200, res.raw);
  const post = calls.find((c) => c.method === 'POST');
  assert.equal(post.body.slug, 'michael-chasen/ibo-discussion');
  assert.deepEqual(post.body.guestEmails, ['pat@example.com']);
  assert.deepEqual(post.body.formFields, [{ name: EBITDA_PROPERTY, value: '$3M - $5M' }]);
  assert.ok(calls[0].url.includes(encodeURIComponent('michael-chasen/ibo-discussion')));
  // empty strings and null count as absent too
  partnerFetch();
  const res2 = fakeRes();
  await partnerBook.default(fakeReq(partnerBody({ client: { phone: '' }, top: { industry: null } })), res2);
  assert.equal(res2.statusCode, 200, res2.raw);
  assert.deepEqual(calls.find((c) => c.method === 'POST').body.formFields, [{ name: EBITDA_PROPERTY, value: '$3M - $5M' }]);
});
await test('partner-book still sends phone and industry when given, and validates them', async () => {
  partnerFetch();
  const res = fakeRes();
  await partnerBook.default(fakeReq(partnerBody({ client: { phone: '555-123-4567' }, top: { industry: 'Manufacturing' } })), res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.deepEqual(calls.find((c) => c.method === 'POST').body.formFields, [
    { name: 'mobilephone', value: '555-123-4567' },
    { name: 'what_is_your_companys_industry', value: 'Manufacturing' },
    { name: EBITDA_PROPERTY, value: '$3M - $5M' },
  ]);
  assert.ok(partnerBook.validate(partnerBody({ client: { phone: '123' } }), now).errors.some((e) => e.includes('client.phone')));
  assert.ok(partnerBook.validate(partnerBody({ top: { industry: 'Mining' } }), now).errors.some((e) => e.includes('industry')));
  assert.ok(partnerBook.validate(partnerBody({ top: { ebitdaBand: undefined } }), now).errors.some((e) => e.includes('ebitdaBand')));
  assert.ok(Array.isArray(partnerBook.INDUSTRIES) && partnerBook.INDUSTRIES.includes('Manufacturing'));
});
await test('availability handler: band routing, half-hour slots, questions, degraded questions', async () => {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base, base + 15 * MIN, base + 30 * MIN]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%2420M%2B&monthOffset=0' }, res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.equal(res.json.calendar, 'michael');
  assert.deepEqual(res.json.slots.map((s) => s.start), [base, base + 30 * MIN]);
  assert.equal(res.json.questions.length, 4);
  assert.equal(res.json.questionsUnavailable, undefined);
  assert.equal(res.json.increment, 30);
  assert.ok(calls.some((c) => isDetails(c.url, { method: c.method }) && c.url.includes('timezone=America%2FNew_York')));
  assert.ok(calls.every((c) => c.url.includes(encodeURIComponent(LINKS.michael.slug))));

  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, () => jsonResponse(500, {})],
  ]);
  const res2 = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=whatever' }, res2);
  assert.equal(res2.statusCode, 200);
  assert.equal(res2.json.calendar, 'team');
  assert.deepEqual(res2.json.questions, []);
  assert.equal(res2.json.questionsUnavailable, true);
  assert.equal(res2.json.increment, null);

  const res3 = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?monthOffset=7' }, res3);
  assert.equal(res3.statusCode, 400);
});

await test('availability handler: no email keeps URL-band routing and reports bandSource', async () => {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%245M%20-%20%2410M' }, res);
  assert.equal(res.json.calendar, 'team');
  assert.equal(res.json.band, '$5M - $10M');
  assert.equal(res.json.bandSource, 'request');
  assert.ok(!calls.some((c) => isContactSearch(c.url)));
  const res2 = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability' }, res2);
  assert.equal(res2.json.band, null);
  assert.equal(res2.json.bandSource, 'none');
});
await test('availability handler: contact band overrides the URL band', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(200, { results: [{ properties: { [EBITDA_PROPERTY]: '$20M+' } }] })],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%243M%20-%20%245M&email=Jane%40Example.com' }, res);
  assert.equal(res.statusCode, 200, res.raw);
  assert.equal(res.json.calendar, 'michael');
  assert.equal(res.json.band, '$20M+');
  assert.equal(res.json.bandSource, 'contact');
  assert.equal(calls.find((c) => isContactSearch(c.url)).body.filterGroups[0].filters[0].value, 'jane@example.com');
  assert.ok(calls.filter((c) => !isContactSearch(c.url)).every((c) => c.url.includes(encodeURIComponent(LINKS.michael.slug))));
});
await test('availability handler: invalid email is ignored (no lookup)', async () => {
  useFetch([
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%2410M%20-%20%2420M&email=not-an-email' }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.calendar, 'michael');
  assert.equal(res.json.bandSource, 'request');
  assert.ok(!calls.some((c) => isContactSearch(c.url)));
});
await test('availability handler: lookup failure falls back to the URL band', async () => {
  useFetch([
    [isContactSearch, () => jsonResponse(403, { category: 'MISSING_SCOPES' })],
    [isAvailability, () => jsonResponse(200, availabilityBody([base]))],
    [isDetails, detailsResponse(200, DETAILS)],
  ]);
  const res = fakeRes();
  await availability.default({ method: 'GET', url: '/api/availability?band=%2410M%20-%20%2420M&email=jane%40example.com' }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json.calendar, 'michael');
  assert.equal(res.json.band, '$10M - $20M');
  assert.equal(res.json.bandSource, 'request');
  assert.ok(calls.some((c) => isContactSearch(c.url)));
});

globalThis.fetch = realFetch;
Object.assign(console, quiet);
log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
