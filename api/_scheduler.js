/* ==========================================================================
   IBO Advisors - shared HubSpot scheduler helpers for the /api endpoints

   Not an endpoint. Vercel turns every file under /api into a serverless
   function EXCEPT files (and folders) whose name starts with an underscore,
   so this module is bundled into the functions that import it and is never
   deployed as a route of its own. Keep the underscore.

   Used by:
     /api/partner-availability  open :00/:30 slots for /partnerschedule
                                (partner link)
     /api/partner-book          books a referral partner's client (partner link,
                                :00/:30 starts only)
     /api/availability          open :00/:30 slots + booking questions for
                                /book2, on the link the EBITDA band routes to
     /api/book                  books a /book2 visitor on that link

   The scheduling-page slugs and the meeting length live here and nowhere
   else. No handler ever takes them from the client: the client can only send
   an EBITDA band, and linkForBand() turns that into one of the LINKS keys.

   Links (LINKS):
     partner  michael-chasen/ibo-discussion. Michael's personal link, used by
              /partnerschedule. Fixed; never overridden.
     michael  Michael only, for bands $10M - $20M, $20M+ and $10M+. Default
              michael-chasen/ibo-discussion; env IBO_BOOK_SLUG_MICHAEL
              overrides it.
     team     The round robin (HubSpot picks Michael Chasen or Darren
              Gleeman), for every other band and for an unknown band. Default
              michael-chasen/discussing-the-ibo; env IBO_BOOK_SLUG_TEAM
              overrides it.
   The env overrides let a preview deployment point /book2 at cloned test
   scheduling pages without a code change. They are read once, at module load.

   HubSpot facts (verified 3 Nov 2026):
     - Portal 245308986 (NA2); api.hubapi.com serves it.
     - Link michael-chasen/ibo-discussion (linkId 134005352) is Michael's
       personal link: 30 minutes, Zoom.
     - availability-page returns
         { linkAvailability: { linkAvailabilityByDuration: { "1800000":
             { meetingDurationMillis, availabilities: [{ startMillisUtc,
               endMillisUtc }] } }, hasMore }, allUsersBusyTimes }
       allUsersBusyTimes (the hosts' busy blocks) is dropped here, so it is
       never returned to the browser.
     - The page advertises about two weeks ahead, so monthOffset 1+ is usually
       empty with hasMore false.
     - The link-details call (GET .../book/{slug}) needs ?timezone=; it
       answers 400 without it. Its customParams carry formFields (the
       booking questions) and startTimeIncrementMinutes.
     - HubSpot offers :15/:45 starts after a meeting that ends at :15. Every
       endpoint (/book2's and the partner ones) passes halfHourOnly, so only
       :00 and :30 starts are offered or bookable.

   Token scopes (IBO_HUBSPOT_SERVICE_KEY):
     scheduler.meetings.meeting-link.read   required (availability, link
                                            details, booking)
     crm.objects.contacts.read              optional; findContactBand() uses
                                            it to prefer a known contact's
                                            stored EBITDA band. Without it the
                                            lookup returns null and /api/book
                                            routes on the band the page sent.

   Logging: status codes, link keys and timing flags only. Never names,
   emails, phone numbers, answers or the token.

   fetch is read from globalThis at call time, so tests can substitute a fake.
   ========================================================================== */

export const SLUG = 'michael-chasen/ibo-discussion';
export const DURATION_MS = 1800000; // 30 minutes
export const HALF_HOUR_MS = 1800000;
export const MAX_MONTH_OFFSET = 6;
export const SCHEDULER_BASE = 'https://api.hubapi.com/scheduler/v3/meetings/meeting-links/book';
export const CONTACT_SEARCH_URL = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
export const EBITDA_PROPERTY = 'what_is_your_approximate_annual_ebitda_profit';
const AVAILABILITY_TIMEOUT_MS = 10000;
const LINK_DETAILS_TIMEOUT_MS = 10000;
const CONTACT_SEARCH_TIMEOUT_MS = 8000;

export const LINKS = {
  partner: { slug: SLUG },
  michael: { slug: process.env.IBO_BOOK_SLUG_MICHAEL || 'michael-chasen/ibo-discussion' },
  team: { slug: process.env.IBO_BOOK_SLUG_TEAM || 'michael-chasen/discussing-the-ibo' },
};

// EBITDA bands. The contact property
// what_is_your_approximate_annual_ebitda_profit has nine options (verified
// live): the scheduling links' EBITDA question uses the five finer ones
// (LINK_BANDS); the Learn More modal, /ibo-exit and the calculator send the
// coarse '$0 - $3M' | '$3M - $10M' | '$10M+'; two more are legacy values.
// CONTACT_BANDS (all nine) is what /api/book and /api/availability accept
// and what findContactBand returns. EBITDA_BANDS is an alias of it.
// /api/partner-book validates against LINK_BANDS only.
export const LINK_BANDS = ['$0 - $3M', '$3M - $5M', '$5M - $10M', '$10M - $20M', '$20M+'];
export const CONTACT_BANDS = [
  '$0 - $1M', '$1M - $3M', '$0 - $3M', '$3M - $5M', '$5M - $10M', '$3M - $10M', '$10M - $20M', '$20M+', '$10M+',
];
export const EBITDA_BANDS = CONTACT_BANDS;
const MICHAEL_BANDS = new Set(['$10M - $20M', '$20M+', '$10M+']);

// '$10M - $20M', '$20M+' and the coarse '$10M+' book Michael's own link;
// everything else (smaller bands, unknown, missing) books the round robin.
export function linkForBand(band) {
  return MICHAEL_BANDS.has(band) ? 'michael' : 'team';
}

// IANA zone names only (e.g. America/New_York), confirmed by Intl.
export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  if (!/^[A-Za-z][A-Za-z0-9_+\-/]*$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isMs(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export function isTimeout(err) {
  return !!err && (err.name === 'TimeoutError' || err.name === 'AbortError');
}

// The 30-minute entry only; every slot checked, sorted, de-duplicated and
// limited to times that have not started yet. options.halfHourOnly keeps
// only starts on a UTC half-hour boundary, which is :00 or :30 in every
// whole-hour and half-hour zone.
export function extractSlots(data, now = Date.now(), options = {}) {
  const halfHourOnly = !!(options && options.halfHourOnly);
  const byDuration = data && data.linkAvailability && data.linkAvailability.linkAvailabilityByDuration;
  if (!byDuration || typeof byDuration !== 'object') return [];
  let entry = byDuration[String(DURATION_MS)];
  if (!entry) entry = Object.values(byDuration).find((e) => e && e.meetingDurationMillis === DURATION_MS);
  const list = entry && Array.isArray(entry.availabilities) ? entry.availabilities : [];
  const seen = new Set();
  const slots = [];
  for (const a of list) {
    if (!a || typeof a !== 'object') continue;
    const start = Number(a.startMillisUtc);
    const end = Number(a.endMillisUtc);
    if (!isMs(start) || !isMs(end) || end <= start || start <= now || seen.has(start)) continue;
    if (halfHourOnly && start % HALF_HOUR_MS !== 0) continue;
    seen.add(start);
    slots.push({ start, end });
  }
  slots.sort((x, y) => x.start - y.start);
  return slots;
}

// GET the availability page for one month (0 = the current month in
// `timezone`). options.slug defaults to the partner link; options.halfHourOnly
// is passed to extractSlots. Throws on a non-2xx with err.upstreamStatus set,
// and with a TimeoutError after 10s.
export async function fetchAvailability(token, timezone, monthOffset, options = {}) {
  const slug = (options && options.slug) || SLUG;
  const url = `${SCHEDULER_BASE}/availability-page/${encodeURIComponent(slug)}` +
    `?timezone=${encodeURIComponent(timezone)}&monthOffset=${monthOffset}`;
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(AVAILABILITY_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error('HubSpot availability request failed');
    error.upstreamStatus = response.status;
    throw error;
  }
  const data = await response.json();
  return {
    slots: extractSlots(data, Date.now(), { halfHourOnly: !!(options && options.halfHourOnly) }),
    hasMore: !!(data && data.linkAvailability && data.linkAvailability.hasMore),
  };
}

/* ---- availability re-check before booking ---- */

export function monthIndex(ms, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric' }).formatToParts(new Date(ms));
  const year = Number(parts.find((p) => p.type === 'year').value);
  const month = Number(parts.find((p) => p.type === 'month').value);
  return year * 12 + month - 1;
}

// The calendar month (in the booker's zone) the slot belongs to, then the
// month before as a fallback in case HubSpot lists a spill-over day there.
// options (slug, halfHourOnly) go to fetchAvailability.
export async function findSlot(token, timezone, startTime, now, options = {}) {
  const offset = Math.max(0, monthIndex(startTime, timezone) - monthIndex(now, timezone));
  const offsets = offset > 0 ? [offset, offset - 1] : [0];
  for (const o of offsets) {
    if (o > MAX_MONTH_OFFSET) continue;
    const { slots } = await fetchAvailability(token, timezone, o, options);
    const slot = slots.find((s) => s.start === startTime);
    if (slot) return slot;
  }
  return null;
}

/* ---- booking questions on a link ---- */

const STANDARD_FIELDS = new Set(['firstname', 'lastname', 'email']);

function optionList(field) {
  const raw = [field.options, field.enumeratedValues, field.choices].find((v) => Array.isArray(v)) || [];
  const out = [];
  for (const o of raw) {
    if (typeof o === 'string' || typeof o === 'number') {
      const s = String(o);
      if (s) out.push({ label: s, value: s });
    } else if (o && typeof o === 'object') {
      if (o.hidden === true) continue;
      const value = o.value ?? o.name ?? o.label;
      const label = o.label ?? o.displayValue ?? o.value ?? o.name;
      if (value === undefined || value === null || value === '') continue;
      out.push({ label: String(label), value: String(value) });
    }
  }
  return out;
}

function questionType(name, field, options) {
  if (options.length) return 'select';
  const hint = `${name} ${field.fieldType || ''} ${field.type || ''}`.toLowerCase();
  if (hint.includes('phone')) return 'phone';
  return 'text';
}

function startIncrement(data) {
  const params = data && typeof data === 'object' && data.customParams && typeof data.customParams === 'object' ? data.customParams : {};
  const n = Number(params.startTimeIncrementMinutes);
  return params.startTimeIncrementMinutes !== null && params.startTimeIncrementMinutes !== undefined &&
    params.startTimeIncrementMinutes !== '' && Number.isFinite(n) ? n : null;
}

// Maps a "meeting link details" response to the custom booking questions.
// Exported for tests; pure.
export function linkQuestions(data) {
  const params = data && typeof data === 'object' && data.customParams && typeof data.customParams === 'object' ? data.customParams : {};
  const fields = Array.isArray(params.formFields) ? params.formFields : [];
  const questions = [];
  const seen = new Set();
  for (const f of fields) {
    if (!f || typeof f !== 'object') continue;
    const name = typeof f.name === 'string' ? f.name.trim() : '';
    if (!name || STANDARD_FIELDS.has(name.toLowerCase()) || seen.has(name)) continue;
    seen.add(name);
    const options = optionList(f);
    questions.push({
      name,
      label: typeof f.label === 'string' && f.label.trim() ? f.label.trim() : name,
      required: f.isRequired === true || f.required === true,
      type: questionType(name, f, options),
      options,
    });
  }
  return questions;
}

// GET the link's details by slug. HubSpot requires ?timezone= on this call
// (400 without it). Returns { linkId, questions, startTimeIncrementMinutes },
// where questions are the custom form fields (first name, last name and
// email are left out: the page always asks for those) and
// startTimeIncrementMinutes is customParams.startTimeIncrementMinutes (number
// or null). Throws like fetchAvailability.
export async function fetchLinkDetails(token, slug, timezone = 'America/New_York') {
  const url = `${SCHEDULER_BASE}/${encodeURIComponent(slug)}?timezone=${encodeURIComponent(timezone)}`;
  const response = await globalThis.fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(LINK_DETAILS_TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error('HubSpot link details request failed');
    error.upstreamStatus = response.status;
    throw error;
  }
  const data = await response.json();
  const rawId = data && typeof data === 'object' ? (data.linkId ?? data.id ?? null) : null;
  return {
    linkId: rawId === null || rawId === undefined ? null : String(rawId),
    questions: linkQuestions(data),
    startTimeIncrementMinutes: startIncrement(data),
  };
}

/* ---- known contact's EBITDA band ---- */

// The EBITDA band stored on the HubSpot contact with this email, or null.
// Needs crm.objects.contacts.read; any failure (missing scope, timeout,
// non-2xx, bad JSON, no contact, value not a known band) returns null.
export async function findContactBand(token, email) {
  try {
    const response = await globalThis.fetch(CONTACT_SEARCH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
        properties: [EBITDA_PROPERTY],
        limit: 1,
      }),
      signal: AbortSignal.timeout(CONTACT_SEARCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn('[scheduler] contact band lookup failed', { status: response.status });
      return null;
    }
    const data = await response.json();
    const first = data && Array.isArray(data.results) ? data.results[0] : null;
    const band = first && first.properties ? first.properties[EBITDA_PROPERTY] : null;
    return EBITDA_BANDS.includes(band) ? band : null;
  } catch (err) {
    console.warn('[scheduler] contact band lookup failed', { status: null, timedOut: isTimeout(err) });
    return null;
  }
}

/* ---- HubSpot booking response ---- */

function toMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d{10,}$/.test(value)) return Number(value);
  if (typeof value === 'string' && value) {
    const t = Date.parse(value);
    if (Number.isFinite(t)) return t;
  }
  return null;
}

function person(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  for (const key of ['email', 'firstName', 'lastName', 'fullName', 'userId', 'id', 'contactId']) {
    if (typeof p[key] === 'string' || typeof p[key] === 'number') out[key] = p[key];
  }
  return Object.keys(out).length ? out : null;
}

// Only the fields the page can use; HubSpot's response is not passed through.
// organizer (email / userId / name) tells the page which Managing Partner
// the meeting landed on.
export function hubspotSubset(data) {
  if (!data || typeof data !== 'object') return {};
  const post = data.postResponse && typeof data.postResponse === 'object' ? data.postResponse : data;
  const range = post.timerange && typeof post.timerange === 'object' ? post.timerange : {};
  const out = {};
  const organizer = person(post.organizer || data.organizer);
  if (organizer) out.organizer = organizer;
  const contact = person(post.contact || data.contact) ||
    (data.contactId ? { contactId: String(data.contactId) } : null);
  if (contact) out.contact = contact;
  const guests = post.guestEmails || data.guestEmails;
  if (Array.isArray(guests)) out.guestEmails = guests.filter((g) => typeof g === 'string').slice(0, 10);
  const start = toMs(range.start ?? post.start ?? data.start ?? data.startTime);
  const end = toMs(range.end ?? post.end ?? data.end ?? data.endTime);
  if (start !== null) out.start = start;
  if (end !== null) out.end = end;
  if (typeof data.calendarEventId === 'string') out.calendarEventId = data.calendarEventId;
  return out;
}

export const CONFLICT_RE = /(not\s+available|unavailable|no longer available|conflict|already\s+booked|busy|taken|time\s*slot|availability)/i;

/* ---- request plumbing and input cleaning (shared by the handlers) ---- */

export const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE_CHARS_RE = /^\+?[0-9\s().\-]+$/;

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

// Control characters out, whitespace collapsed, trimmed; null if too long.
export function clean(value, max) {
  if (typeof value !== 'string') return '';
  const s = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? null : s;
}

export function cleanEmail(value) {
  const s = clean(value, 254);
  if (!s || !EMAIL_RE.test(s)) return null;
  return s.toLowerCase();
}

// 10-15 digits, made of digits, spaces, ( ) . - and an optional leading +.
export function cleanPhone(value) {
  const s = clean(value, 30);
  if (!s || !PHONE_CHARS_RE.test(s)) return null;
  const digits = s.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 15 ? s : null;
}

export function header(req, name) {
  const h = req.headers && req.headers[name];
  return Array.isArray(h) ? h[0] : (h || '');
}

// Browsers always send Origin on a POST; it must name this host. Requests
// without one (curl, server-to-server) are allowed through to validation.
export function sameOrigin(req) {
  const origin = header(req, 'origin');
  if (!origin) return true;
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  try {
    return !!host && new URL(origin).host.toLowerCase() === String(host).split(',')[0].trim().toLowerCase();
  } catch {
    return false;
  }
}

export async function readBody(req) {
  // Vercel parses JSON bodies onto req.body (a getter that throws on bad JSON).
  let body;
  try { body = req.body; } catch { throw new SyntaxError('Invalid JSON'); }
  if (body !== undefined && body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  let raw;
  if (typeof body === 'string') raw = body;
  else if (Buffer.isBuffer(body)) raw = body.toString('utf8');
  else {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) throw new RangeError('Body too large');
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (raw.length > MAX_BODY_BYTES) throw new RangeError('Body too large');
  return JSON.parse(raw);
}

export function queryParam(req, name) {
  let value;
  if (req.query && typeof req.query === 'object') value = req.query[name];
  if (value === undefined) {
    try { value = new URL(req.url || '/', 'http://localhost').searchParams.get(name); } catch { value = undefined; }
  }
  if (Array.isArray(value)) value = value[0];
  return value === null || value === undefined ? undefined : String(value);
}
