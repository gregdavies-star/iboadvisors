/* ==========================================================================
   IBO Advisors - POST /api/partner-book

   Books a 30-minute "IBO Discussion" on Michael Chasen's calendar for a
   referral partner's client, from /partnerschedule. The client is the
   booker (the HubSpot contact the meeting is logged against); the partner is
   added as a guest. HubSpot then sends the calendar invitation, confirmation
   and reminders to both.

     POST /api/partner-book   Content-Type: application/json
       { startTime, timezone,
         client:  { firstName, lastName, email, phone? },
         partner: { name, email, cell? },
         industry?, ebitdaBand }
       phone, cell and industry are optional (omit, null or ""); each is
       validated only when present. ebitdaBand is required.

     Michael's "IBO Discussion" link asks three booking questions. Since
     Nov 2026 only the EBITDA band is required there (Greg made mobile phone
     and industry optional), and /partnerschedule no longer asks for the
     client's cell or industry. The mobilephone and
     what_is_your_companys_industry form fields are sent only when a value
     was given; the EBITDA band is always sent.
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

   Shared code: slugs (LINKS.partner here, which no env var overrides),
   availability re-check, input cleaning, origin check and the HubSpot
   response subset live in ./_scheduler.js, shared with /api/book (the
   public /book2 page). This endpoint always books Michael's personal link
   and, like /api/book, accepts only :00 and :30 starts (halfHourOnly): a
   :15/:45 start is refused with 409 slot_unavailable.

   Environment: IBO_HUBSPOT_SERVICE_KEY (HubSpot private app token).
   Every response is JSON with Cache-Control: no-store.
   ========================================================================== */

import {
  findSlot, isValidTimeZone, hubspotSubset, LINK_BANDS, CONFLICT_RE, LINKS, DURATION_MS, SCHEDULER_BASE,
  send, clean, cleanEmail, cleanPhone, header, sameOrigin, readBody,
} from './_scheduler.js';

const MAX_LEAD_MS = 90 * 24 * 3600 * 1000; // ~90 days ahead
const BOOK_TIMEOUT_MS = 20000;
const BOOK_URL = SCHEDULER_BASE;
const SLUG = LINKS.partner.slug;

// The options on the scheduling page's (now optional) industry question,
// verbatim. Still exported for compatibility.
export const INDUSTRIES = [
  'Construction', 'Manufacturing', 'Healthcare', 'Recruiting', 'Technology / Software',
  'Consulting / Professional Services', 'Financial Services', 'Education', 'Real Estate', 'Other',
];
// The five options on the link's EBITDA question (LINK_BANDS in
// ./_scheduler.js), exported under the old name for compatibility.
export const EBITDA_BANDS = LINK_BANDS;
export { hubspotSubset };

function fail(res, status, error, message, upstreamStatus) {
  const body = { ok: false, error, message };
  if (upstreamStatus) body.status = upstreamStatus;
  return send(res, status, body);
}

function present(v) {
  return v !== undefined && v !== null && v !== '';
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
  let clientPhone = '';
  if (present(client.phone)) {
    clientPhone = cleanPhone(client.phone);
    if (!clientPhone) errors.push('client.phone must be a phone number with 10-15 digits, or empty');
  }

  const partnerName = clean(partner.name, 200);
  if (!partnerName) errors.push('partner.name is required (max 200 chars)');
  const partnerEmail = cleanEmail(partner.email);
  if (!partnerEmail) errors.push('partner.email must be a valid email');
  else if (clientEmail && partnerEmail === clientEmail) errors.push('partner.email must differ from client.email');
  let partnerCell = '';
  if (present(partner.cell)) {
    partnerCell = cleanPhone(partner.cell);
    if (!partnerCell) errors.push('partner.cell must be a phone number with 10-15 digits, or empty');
  }

  const industry = present(body.industry) ? body.industry : '';
  if (industry && !INDUSTRIES.includes(industry)) errors.push('industry must be one of the scheduling page options, or empty');
  if (!EBITDA_BANDS.includes(body.ebitdaBand)) errors.push('ebitdaBand must be one of the scheduling page options');

  if (errors.length) return { errors };
  return {
    errors: [],
    value: {
      startTime,
      timezone,
      client: { firstName, lastName, email: clientEmail, phone: clientPhone },
      partner: { name: partnerName, email: partnerEmail, cell: partnerCell },
      industry,
      ebitdaBand: body.ebitdaBand,
    },
  };
}

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
    slot = await findSlot(token, value.timezone, value.startTime, now, { slug: SLUG, halfHourOnly: true });
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
      ...(value.client.phone ? [{ name: 'mobilephone', value: value.client.phone }] : []),
      ...(value.industry ? [{ name: 'what_is_your_companys_industry', value: value.industry }] : []),
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
