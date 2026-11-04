/* ==========================================================================
   IBO Advisors - POST /api/book

   Books a 30-minute call with a Managing Partner from the public booking
   page /book2. The visitor is the booker (the HubSpot contact the meeting is
   logged against); HubSpot then sends the calendar invitation, confirmation
   and reminders.

     POST /api/book   Content-Type: application/json
       { startTime, timezone, band?,
         firstName, lastName, email,
         answers?: { <question name>: <string>, ... } }
       -> 200 { ok: true, start, end, calendar: 'michael' | 'team',
                band: <band> | null,
                hubspot: { organizer, contact, guestEmails, start, end } }
          hubspot.organizer (email / userId / names) is the Managing Partner
          the meeting landed on (on 'team', HubSpot's round robin picks).
       -> 400 { ok: false, error: 'missing_answers', message, missing: [names] }
       -> 4xx/5xx { ok: false, error, message, status?, details? }

   Routing: the EBITDA band is taken from the visitor's HubSpot contact when
   one exists (findContactBand; needs the optional crm.objects.contacts.read
   scope and degrades to null without it), else from `band` in the body, else
   from answers.what_is_your_approximate_annual_ebitda_profit, else none.
   /api/availability applies the same precedence when the page passes
   `email`, so the slots shown and the slots re-checked here come from the
   same link. `band` may be any of the nine CONTACT_BANDS (see
   ./_scheduler.js). linkForBand() then picks 'michael' ($10M - $20M,
   $20M+, $10M+: Michael Chasen's own link) or 'team' (everything else: the round robin). Slugs come from
   LINKS in ./_scheduler.js (env overrides IBO_BOOK_SLUG_MICHAEL and
   IBO_BOOK_SLUG_TEAM); nothing from the client names a calendar.

   Booking questions: the link's own questions are read from HubSpot. A
   required question missing from `answers` is a 400 missing_answers, except
   the EBITDA question, which is filled from the band when the band is one of
   that question's option values (or the question has no options). A coarse
   band such as '$3M - $10M' does not fit the link's five options, so the
   question stays unanswered and, if required, is reported in `missing` so
   the page can ask the finer question.
   Answers to questions the link does not ask are dropped. If the link's
   questions cannot be read, the given answers (plus the EBITDA band, when
   known and one of the link's five options) are sent as they are and
   HubSpot has the last word.

   Errors (error code -> HTTP status):
     invalid_request 400, missing_answers 400, unsupported_media_type 415,
     forbidden_origin 403, slot_unavailable 409 (the time is not an open
     :00/:30 slot on the routed link, or HubSpot reports a conflict),
     not_configured 503, rate_limited 503, upstream_timeout 504 (the booking
     MAY have gone through), upstream_error 502. `status` is HubSpot's own
     HTTP status where there was one.

   Safety:
     - Slug and duration are fixed server-side; the requested start must be
       one of the open half-hour slots HubSpot reports right now on the
       routed link (re-read with the code that serves /api/availability).
     - Cross-origin browser POSTs are refused (Origin must match Host), and
       the body must be JSON, which forces a CORS preflight that this
       endpoint never grants.
     - Logs carry status codes, the link key and timing flags only: no names,
       emails, phone numbers, answers or token.

   Environment: IBO_HUBSPOT_SERVICE_KEY (HubSpot private app token with
   scheduler.meetings.meeting-link.read; crm.objects.contacts.read optional).
   Every response is JSON with Cache-Control: no-store.
   ========================================================================== */

import {
  findSlot, fetchLinkDetails, findContactBand, linkForBand, isValidTimeZone, isTimeout, hubspotSubset,
  EBITDA_BANDS, LINK_BANDS, EBITDA_PROPERTY, CONFLICT_RE, LINKS, DURATION_MS, SCHEDULER_BASE,
  send, clean, cleanEmail, header, sameOrigin, readBody,
} from './_scheduler.js';

const MAX_LEAD_MS = 90 * 24 * 3600 * 1000; // ~90 days ahead
const BOOK_TIMEOUT_MS = 20000;
const MAX_ANSWERS = 20;
const MAX_ANSWER_CHARS = 500;
const ANSWER_KEY_RE = /^[a-z0-9_]{1,100}$/;

function fail(res, status, error, message, upstreamStatus) {
  const body = { ok: false, error, message };
  if (upstreamStatus) body.status = upstreamStatus;
  return send(res, status, body);
}

export function validate(body, now = Date.now()) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['body must be a JSON object'] };

  const startTime = body.startTime;
  if (!Number.isSafeInteger(startTime)) errors.push('startTime must be an integer (epoch ms)');
  else if (startTime <= now) errors.push('startTime must be in the future');
  else if (startTime > now + MAX_LEAD_MS) errors.push('startTime must be within 90 days');

  const timezone = typeof body.timezone === 'string' ? body.timezone : '';
  if (!isValidTimeZone(timezone)) errors.push('timezone must be an IANA time zone');

  const firstName = clean(body.firstName, 100);
  const lastName = clean(body.lastName, 100);
  if (!firstName) errors.push('firstName is required (max 100 chars)');
  if (!lastName) errors.push('lastName is required (max 100 chars)');
  const email = cleanEmail(body.email);
  if (!email) errors.push('email must be a valid email');

  let band = null;
  if (body.band !== undefined && body.band !== null && body.band !== '') {
    if (EBITDA_BANDS.includes(body.band)) band = body.band;
    else errors.push('band must be one of the scheduling page options, or empty');
  }

  const answers = {};
  if (body.answers !== undefined && body.answers !== null) {
    if (typeof body.answers !== 'object' || Array.isArray(body.answers)) {
      errors.push('answers must be an object of strings');
    } else {
      const entries = Object.entries(body.answers);
      if (entries.length > MAX_ANSWERS) errors.push(`answers may have at most ${MAX_ANSWERS} entries`);
      else {
        for (const [key, raw] of entries) {
          if (!ANSWER_KEY_RE.test(key)) { errors.push('answers keys must match ^[a-z0-9_]{1,100}$'); break; }
          if (typeof raw !== 'string') { errors.push(`answers.${key} must be a string`); continue; }
          const v = clean(raw, MAX_ANSWER_CHARS);
          if (v === null) { errors.push(`answers.${key} is too long (max ${MAX_ANSWER_CHARS} chars)`); continue; }
          if (v) answers[key] = v; // blank answers count as not given
        }
      }
    }
  }

  if (errors.length) return { errors };
  return { errors: [], value: { startTime, timezone, firstName, lastName, email, band, answers } };
}

// Which answers to send. `questions` null = the link's questions are unknown.
export function buildFormFields(questions, answers, band) {
  if (!questions) {
    const out = { ...answers };
    if (band && !out[EBITDA_PROPERTY] && LINK_BANDS.includes(band)) out[EBITDA_PROPERTY] = band;
    return { missing: [], formFields: Object.entries(out).map(([name, value]) => ({ name, value })) };
  }
  const missing = [];
  const formFields = [];
  for (const q of questions) {
    let value = answers[q.name];
    if (!value && q.name === EBITDA_PROPERTY && band &&
      (!q.options.length || q.options.some((o) => o.value === band))) value = band;
    if (value) formFields.push({ name: q.name, value });
    else if (q.required) missing.push(q.name);
  }
  return { missing, formFields };
}

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
    console.error('[book] IBO_HUBSPOT_SERVICE_KEY is not set');
    return fail(res, 503, 'not_configured', 'The scheduler is not configured on this deployment.');
  }

  // 1. Route: a known contact's stored band wins over what the page sent.
  const contactBand = await findContactBand(token, value.email);
  const answerBand = EBITDA_BANDS.includes(value.answers[EBITDA_PROPERTY]) ? value.answers[EBITDA_PROPERTY] : null;
  const band = contactBand || value.band || answerBand || null;
  const bandSource = contactBand ? 'contact' : value.band ? 'request' : answerBand ? 'answer' : 'none';
  const calendar = linkForBand(band);
  const slug = LINKS[calendar].slug;

  // 2. The slot must be open right now on that link (:00/:30 only); the
  //    link's questions are read at the same time.
  const detailsPromise = fetchLinkDetails(token, slug, value.timezone).catch((err) => {
    console.warn('[book] link details failed', {
      calendar,
      status: err && err.upstreamStatus ? err.upstreamStatus : null,
      timedOut: isTimeout(err),
    });
    return null;
  });
  let slot;
  try {
    slot = await findSlot(token, value.timezone, value.startTime, now, { slug, halfHourOnly: true });
  } catch (err) {
    const timedOut = isTimeout(err);
    console.warn('[book] availability check failed', { calendar, status: err && err.upstreamStatus ? err.upstreamStatus : null, timedOut });
    return fail(res, timedOut ? 504 : 502, timedOut ? 'upstream_timeout' : 'upstream_error',
      'Could not check availability with HubSpot.', err && err.upstreamStatus);
  }
  if (!slot) {
    console.info('[book] requested time is not an open slot', { calendar });
    return fail(res, 409, 'slot_unavailable', 'That time is no longer available.');
  }

  // 3. Required questions.
  const details = await detailsPromise;
  const { missing, formFields } = buildFormFields(details ? details.questions : null, value.answers, band);
  if (missing.length) {
    console.info('[book] required answers missing', { calendar, count: missing.length });
    return send(res, 400, {
      ok: false,
      error: 'missing_answers',
      message: 'Please answer every required question.',
      missing,
    });
  }

  // 4. Book it.
  const payload = {
    slug,
    duration: DURATION_MS,
    startTime: value.startTime,
    email: value.email,
    firstName: value.firstName,
    lastName: value.lastName,
    timezone: value.timezone,
    locale: 'en-us',
    formFields,
  };

  let response;
  try {
    response = await globalThis.fetch(`${SCHEDULER_BASE}?timezone=${encodeURIComponent(value.timezone)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(BOOK_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = isTimeout(err);
    console.warn('[book] book request failed', { calendar, timedOut });
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
    console.warn('[book] HubSpot rejected the booking', { calendar, status, category });
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
  console.info('[book] booked', {
    status: response.status,
    calendar,
    bandSource,
    questionsKnown: !!details,
    timesFromHubSpot: hubspot.start !== undefined,
  });
  return send(res, 200, { ok: true, start, end, calendar, band, hubspot });
}
