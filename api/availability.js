/* ==========================================================================
   IBO Advisors - GET /api/availability

   Open 30-minute slots and the booking questions for the public booking
   page /book. A thin, read-only proxy over HubSpot's scheduler API, so the
   private app token never reaches the browser.

     GET /api/availability?timezone=America/Chicago&monthOffset=0&band=%2410M%20-%20%2420M&email=jane%40example.com
       -> 200 { timezone, monthOffset, calendar: 'michael' | 'team',
                band: <band used> | null, bandSource: 'contact' | 'request' | 'none',
                slots: [{ start, end }], hasMore,
                questions: [{ name, label, required, type, options }],
                increment: <minutes> | null, questionsUnavailable?: true }
          start / end are epoch milliseconds (UTC), sorted, future only, and
          start only at :00 or :30 (HubSpot otherwise offers :15/:45 starts
          after a meeting that ends at :15).
          questions are the link's custom booking questions (first name,
          last name and email are left out); type is 'text' | 'phone' |
          'select', options is [{ label, value }] (empty unless select).
          increment is the link's customParams.startTimeIncrementMinutes
          (HubSpot's start-time increment setting), for checking that
          setting from the API; null when HubSpot does not report it.
          If HubSpot's link details cannot be read, questions is [],
          increment is null and questionsUnavailable is true; the slots are
          still returned. The link-details call carries ?timezone= (HubSpot
          answers 400 without it).

   Query parameters (all optional):
     timezone     IANA zone, checked with Intl. Default America/New_York.
                  HubSpot uses it to decide which calendar month
                  monthOffset counts from.
     monthOffset  Integer 0..6 (0 = the current month in that zone).
     band         EBITDA band, one of the nine CONTACT_BANDS (the five link
                  options plus the site forms' coarse '$0 - $3M' /
                  '$3M - $10M' / '$10M+' and legacy values). '$10M - $20M',
                  '$20M+' and '$10M+' read Michael Chasen's own link
                  ('michael'); anything else,
                  including an unknown or missing band, reads the round robin
                  ('team', where HubSpot picks Michael or Darren). An unknown
                  band is not an error.
     email        The visitor's email, when the page knows it. If valid, the
                  band stored on that HubSpot contact (findContactBand; needs
                  the optional crm.objects.contacts.read scope, null without
                  it or on any failure) wins over `band`, exactly as in
                  /api/book, so both endpoints read the same link and the
                  booking re-check cannot 409 for routing reasons. An invalid
                  email is ignored. Without email, routing uses `band` only.

   The slugs (LINKS, with env overrides IBO_BOOK_SLUG_MICHAEL and
   IBO_BOOK_SLUG_TEAM), the routing (linkForBand) and the HubSpot calls live
   in ./_scheduler.js, shared with /api/book and the partner endpoints. The
   client never names a calendar.

   Errors: 400 invalid_timezone / invalid_month_offset, 405, 503
   not_configured, 504 upstream_timeout, 502 upstream_error (with HubSpot's
   status). Same shapes as /api/partner-availability.

   Environment: IBO_HUBSPOT_SERVICE_KEY (HubSpot private app token with
   scheduler.meetings.meeting-link.read). Missing -> 503, never a token echo.
   Every response is JSON with Cache-Control: no-store.
   ========================================================================== */

import {
  fetchAvailability, fetchLinkDetails, findContactBand, cleanEmail, isValidTimeZone, isTimeout, linkForBand, LINKS, EBITDA_BANDS,
  MAX_MONTH_OFFSET, send, queryParam,
} from './_scheduler.js';

const DEFAULT_TIMEZONE = 'America/New_York';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'method_not_allowed', message: 'Use GET.' });
  }

  const rawTz = queryParam(req, 'timezone');
  const timezone = rawTz === undefined || rawTz === '' ? DEFAULT_TIMEZONE : rawTz;
  if (!isValidTimeZone(timezone)) {
    return send(res, 400, { error: 'invalid_timezone', message: 'timezone must be an IANA time zone, e.g. America/New_York.' });
  }

  const rawOffset = queryParam(req, 'monthOffset');
  let monthOffset = 0;
  if (rawOffset !== undefined && rawOffset !== '') {
    if (!/^\d{1,2}$/.test(rawOffset) || Number(rawOffset) > MAX_MONTH_OFFSET) {
      return send(res, 400, { error: 'invalid_month_offset', message: `monthOffset must be an integer from 0 to ${MAX_MONTH_OFFSET}.` });
    }
    monthOffset = Number(rawOffset);
  }

  const rawBand = queryParam(req, 'band');
  const urlBand = EBITDA_BANDS.includes(rawBand) ? rawBand : null;
  const rawEmail = queryParam(req, 'email');
  const email = rawEmail ? cleanEmail(rawEmail) : null; // invalid -> ignored

  const token = process.env.IBO_HUBSPOT_SERVICE_KEY;
  if (!token) {
    console.error('[availability] IBO_HUBSPOT_SERVICE_KEY is not set');
    return send(res, 503, { error: 'not_configured', message: 'The scheduler is not configured on this deployment.' });
  }

  // Same precedence as /api/book: a known contact's stored band wins.
  const contactBand = email ? await findContactBand(token, email) : null;
  const band = contactBand || urlBand || null;
  const bandSource = contactBand ? 'contact' : urlBand ? 'request' : 'none';
  const calendar = linkForBand(band);
  const slug = LINKS[calendar].slug;

  // Link details are a nice-to-have: their failure never fails the response.
  const detailsPromise = fetchLinkDetails(token, slug, timezone).catch((err) => {
    console.warn('[availability] link details failed', {
      calendar,
      status: err && err.upstreamStatus ? err.upstreamStatus : null,
      timedOut: isTimeout(err),
    });
    return null;
  });

  try {
    const [{ slots, hasMore }, details] = await Promise.all([
      fetchAvailability(token, timezone, monthOffset, { slug, halfHourOnly: true }),
      detailsPromise,
    ]);
    const body = {
      timezone, monthOffset, calendar, band, bandSource, slots, hasMore,
      questions: details ? details.questions : [],
      increment: details ? details.startTimeIncrementMinutes : null,
    };
    if (!details) body.questionsUnavailable = true;
    return send(res, 200, body);
  } catch (err) {
    const timedOut = isTimeout(err);
    console.warn('[availability] upstream failure', {
      calendar,
      status: err && err.upstreamStatus ? err.upstreamStatus : null,
      timedOut,
      monthOffset,
    });
    if (timedOut) return send(res, 504, { error: 'upstream_timeout', message: 'HubSpot did not answer in time.' });
    return send(res, 502, {
      error: 'upstream_error',
      message: 'Could not load availability from HubSpot.',
      status: err && err.upstreamStatus ? err.upstreamStatus : null,
    });
  }
}
