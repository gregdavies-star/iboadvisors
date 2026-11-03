/* ==========================================================================
   IBO Advisors - POST /api/partner-book

   Books a 30-minute "IBO Discussion" on Michael Chasen's calendar for a
   referral partner's client, from /partnerschedule. The client is the
   booker (the HubSpot contact the meeting is logged against); the partner is
   added as a guest. HubSpot then sends the calendar invitation, confirmation
   and reminders to both.

     POST /api/partner-book   Content-Type: application/json
       { startTime, timezone,
         client:  { firstName, lastName, email, phone },
         partner: { name, email, cell },
         industry, ebitdaBand }
       -> 200 { ok: true, start, end, hubspot: { organizer, contact, guestEmails, start, end } }
       -> 4xx/5xx { ok: false, error, message, status }

   Errors (error code -> HTTP status):
     invalid_request 400, unsupported_media_type 415, forbidden_origin 403,
     slot_unavailable 409 (the time is not open, or HubSpot reports a
     conflict), not_configured 503, rate_limited 503, upstream_timeout 504
     (the booking MAY have gone through: the page tells the partner to check
     their inbox before trying again), upstream_error 502.
     `status` is HubSpot's own HTTP status where there was one.

   Safety:
     - The slug and duration are fixed server-side (./_scheduler.js); nothing
       from the client chooses the calendar or the meeting length.
     - The requested start must be one of the open slots HubSpot reports right
       now (re-read through ./_scheduler.js, the same code that serves
       /api/partner-availability), so a hand-made request cannot put a
       meeting outside Michael's bookable hours.
     - Cross-origin browser POSTs are refused (Origin must match Host), and the
       body must be JSON, which forces a CORS preflight that this endpoint
       never grants.
     - Logs carry status codes and HubSpot's error category only: no names,
       emails, phone numbers or token.

   Environment: IBO_HUBSPOT_SERVICE_KEY (HubSpot private app token).
   Every response is JSON with Cache-Control: no-store.
   ========================================================================== */

import { fetchAvailability, isValidTimeZone, SLUG, DURATION_MS, MAX_MONTH_OFFSET, SCHEDULER_BASE } from './_scheduler.js';

const MAX_LEAD_MS = 90 * 24 * 3600 * 1000; // ~90 days ahead
const MAX_BODY_BYTES = 16 * 1024;
const BOOK_TIMEOUT_MS = 20000;
const BOOK_URL = SCHEDULER_BASE;

// The options on the scheduling page's required questions, verbatim.
export const INDUSTRIES = [
  'Construction', 'Manufacturing', 'Healthcare', 'Recruiting', 'Technology / Software',
  'Consulting / Professional Services', 'Financial Services', 'Education', 'Real Estate', 'Other',
];
export const EBITDA_BANDS = ['$0 - $3M', '$3M - $5M', '$5M - $10M', '$10M - $20M', '$20M+'];

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE_CHARS_RE = /^\+?[0-9\s().\-]+$/;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function fail(res, status, error, message, upstreamStatus) {
  const body = { ok: false, error, message };
  if (upstreamStatus) body.status = upstreamStatus;
  return send(res, status, body);
}

/* ---- input cleaning ---- */

// Control characters out, whitespace collapsed, trimmed; null if too long.
function clean(value, max) {
  if (typeof value !== 'string') return '';
  const s = value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? null : s;
}

function cleanEmail(value) {
  const s = clean(value, 254);
  if (!s || !EMAIL_RE.test(s)) return null;
  return s.toLowerCase();
}

// 10-15 digits, made of digits, spaces, ( ) . - and an optional leading +.
function cleanPhone(value) {
  const s = clean(value, 30);
  if (!s || !PHONE_CHARS_RE.test(s)) return null;
  const digits = s.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 15 ? s : null;
}

export function validate(body, now = Date.now()) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['body must be a JSON object'] };
  const client = body.client && typeof body.client === 'object' ? body.client : {};
  const partner = body.partner && typeof body.partner === 'object' ? body.partner : {};

  const startTime = body.startTime;
  if (!Number.isSafeInteger(startTime)) errors.push('startTime must be an integer (epoch ms)');
  else if (startTime <= now) errors.push('startTime must be in the future');
  else if (startTime > now + MAX_LEAD_MS) errors.push('startTime must be within 90 days');

  const timezone = typeof body.timezone === 'string' ? body.timezone : '';
  if (!isValidTimeZone(timezone)) errors.push('timezone must be an IANA time zone');

  const firstName = clean(client.firstName, 100);
  const lastName = clean(client.lastName, 100);
  if (!firstName) errors.push('client.firstName is required (max 100 chars)');
  if (!lastName) errors.push('client.lastName is required (max 100 chars)');
  const clientEmail = cleanEmail(client.email);
  if (!clientEmail) errors.push('client.email must be a valid email');
  const clientPhone = cleanPhone(client.phone);
  if (!clientPhone) errors.push('client.phone must be a phone number with 10-15 digits');

  const partnerName = clean(partner.name, 200);
  if (!partnerName) errors.push('partner.name is required (max 200 chars)');
  const partnerEmail = cleanEmail(partner.email);
  if (!partnerEmail) errors.push('partner.email must be a valid email');
  else if (clientEmail && partnerEmail === clientEmail) errors.push('partner.email must differ from client.email');
  let partnerCell = '';
  if (partner.cell !== undefined && partner.cell !== null && partner.cell !== '') {
    partnerCell = cleanPhone(partner.cell);
    if (!partnerCell) errors.push('partner.cell must be a phone number with 10-15 digits, or empty');
  }

  if (!INDUSTRIES.includes(body.industry)) errors.push('industry must be one of the scheduling page options');
  if (!EBITDA_BANDS.includes(body.ebitdaBand)) errors.push('ebitdaBand must be one of the scheduling page options');

  if (errors.length) return { errors };
  return {
    errors: [],
    value: {
      startTime,
      timezone,
      client: { firstName, lastName, email: clientEmail, phone: clientPhone },
      partner: { name: partnerName, email: partnerEmail, cell: partnerCell },
      industry: body.industry,
      ebitdaBand: body.ebitdaBand,
    },
  };
}

/* ---- request plumbing ---- */

function header(req, name) {
  const h = req.headers && req.headers[name];
  return Array.isArray(h) ? h[0] : (h || '');
}

// Browsers always send Origin on a POST; it must name this host. Requests
// without one (curl, server-to-server) are allowed through to validation.
function sameOrigin(req) {
  const origin = header(req, 'origin');
  if (!origin) return true;
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  try {
    return !!host && new URL(origin).host.toLowerCase() === String(host).split(',')[0].trim().toLowerCase();
  } catch {
    return false;
  }
}

async function readBody(req) {
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

/* ---- availability re-check ---- */

function monthIndex(ms, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric' }).formatToParts(new Date(ms));
  const year = Number(parts.find((p) => p.type === 'year').value);
  const month = Number(parts.find((p) => p.type === 'month').value);
  return year * 12 + month - 1;
}

// The calendar month (in the booker's zone) the slot belongs to, then the
// month before as a fallback in case HubSpot lists a spill-over day there.
async function findSlot(token, timezone, startTime, now) {
  const offset = Math.max(0, monthIndex(startTime, timezone) - monthIndex(now, timezone));
  const offsets = offset > 0 ? [offset, offset - 1] : [0];
  for (const o of offsets) {
    if (o > MAX_MONTH_OFFSET) continue;
    const { slots } = await fetchAvailability(token, timezone, o);
    const slot = slots.find((s) => s.start === startTime);
    if (slot) return slot;
  }
  return null;
}

/* ---- HubSpot response ---- */

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

const CONFLICT_RE = /(not\s+available|unavailable|no longer available|conflict|already\s+booked|busy|taken|time\s*slot|availability)/i;

/* ---- handler ---- */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'method_not_allowed', 'Use POST.');
  }
  if (!sameOrigin(req)) return fail(res, 403, 'forbidden_origin', 'Cross-origin requests are not accepted.');
  if (!/^application\/json\b/i.test(header(req, 'content-type'))) {
    return fail(res, 415, 'unsupported_media_type', 'Send the body as application/json.');
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return fail(res, 400, 'invalid_request', err instanceof RangeError ? 'Body too large.' : 'Body must be valid JSON.');
  }

  const now = Date.now();
  const { errors, value } = validate(body, now);
  if (errors.length) return send(res, 400, { ok: false, error: 'invalid_request', message: 'Invalid booking request.', details: errors });

  const token = process.env.IBO_HUBSPOT_SERVICE_KEY;
  if (!token) {
    console.error('[partner-book] IBO_HUBSPOT_SERVICE_KEY is not set');
    return fail(res, 503, 'not_configured', 'The scheduler is not configured on this deployment.');
  }

  // 1. The slot must be open right now.
  let slot;
  try {
    slot = await findSlot(token, value.timezone, value.startTime, now);
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    console.warn('[partner-book] availability check failed', { status: err && err.upstreamStatus ? err.upstreamStatus : null, timedOut });
    return fail(res, timedOut ? 504 : 502, timedOut ? 'upstream_timeout' : 'upstream_error',
      'Could not check availability with HubSpot.', err && err.upstreamStatus);
  }
  if (!slot) {
    console.info('[partner-book] requested time is not an open slot');
    return fail(res, 409, 'slot_unavailable', 'That time is no longer available.');
  }

  // 2. Book it: the client books, the partner is a guest.
  const payload = {
    slug: SLUG,
    duration: DURATION_MS,
    startTime: value.startTime,
    email: value.client.email,
    firstName: value.client.firstName,
    lastName: value.client.lastName,
    guestEmails: [value.partner.email],
    timezone: value.timezone,
    locale: 'en-us',
    formFields: [
      { name: 'mobilephone', value: value.client.phone },
      { name: 'what_is_your_companys_industry', value: value.industry },
      { name: 'what_is_your_approximate_annual_ebitda_profit', value: value.ebitdaBand },
    ],
  };

  let response;
  try {
    response = await globalThis.fetch(`${BOOK_URL}?timezone=${encodeURIComponent(value.timezone)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(BOOK_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    console.warn('[partner-book] book request failed', { timedOut });
    if (timedOut) return fail(res, 504, 'upstream_timeout', 'HubSpot did not confirm in time. The meeting may still have been booked.');
    return fail(res, 502, 'upstream_error', 'Could not reach HubSpot.');
  }

  let text = '';
  try { text = await response.text(); } catch { text = ''; }
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!response.ok) {
    const status = response.status;
    const category = data && typeof data.category === 'string' ? data.category : null;
    const message = data && typeof data.message === 'string' ? data.message : '';
    console.warn('[partner-book] HubSpot rejected the booking', { status, category });
    if (status === 409 || (status === 400 && (CONFLICT_RE.test(message) || category === 'CONFLICT'))) {
      return fail(res, 409, 'slot_unavailable', 'That time is no longer available.', status);
    }
    if (status === 400) return fail(res, 400, 'invalid_request', 'HubSpot rejected the booking details.', status);
    if (status === 429) return fail(res, 503, 'rate_limited', 'HubSpot is busy. Try again in a minute.', status);
    return fail(res, 502, 'upstream_error', 'HubSpot could not book the meeting.', status);
  }

  const hubspot = hubspotSubset(data);
  const start = hubspot.start ?? slot.start;
  const end = hubspot.end && hubspot.end > start ? hubspot.end : start + DURATION_MS;
  if (hubspot.start === undefined && hubspot.end === undefined) {
    console.info('[partner-book] HubSpot response had no start/end; using the requested slot');
  }
  console.info('[partner-book] booked', { status: response.status });
  return send(res, 200, { ok: true, start, end, hubspot });
}
