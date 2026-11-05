/* ==========================================================================
   IBO Advisors - GET /api/partner-availability

   Open 30-minute slots on Michael Chasen's "IBO Discussion" scheduling page,
   for the referral-partner page at /partnerschedule. A thin, read-only proxy
   over HubSpot's scheduler API, so the private app token never reaches the
   browser.

     GET /api/partner-availability?timezone=America/Chicago&monthOffset=0
       -> 200 { timezone, monthOffset, slots: [{ start, end }], hasMore }
          start / end are epoch milliseconds (UTC), sorted, future only.

   Query parameters (both optional):
     timezone     IANA zone, checked with Intl. Default America/New_York.
                  HubSpot uses it to decide which calendar month
                  monthOffset counts from.
     monthOffset  Integer 0..6 (0 = the current month in that zone).

   This file holds only the handler and its query parsing. The slug, the
   meeting length, the HubSpot call and the slot clean-up (Michael's busy
   blocks are dropped, never returned) live in ./_scheduler.js, shared with
   /api/partner-book (and with the public /book2 endpoints /api/availability
   and /api/book). This endpoint always reads LINKS.partner, Michael's
   personal link, which no env var overrides, and offers only :00 and :30
   starts (halfHourOnly; HubSpot otherwise offers :15/:45 starts after a
   meeting that ends at :15). The client never chooses which calendar it
   reads.

   Environment: IBO_HUBSPOT_SERVICE_KEY (HubSpot private app token with
   scheduler.meetings.meeting-link.read). Missing -> 503, never a token echo.
   Every response is JSON with Cache-Control: no-store.
   ========================================================================== */

import { fetchAvailability, isValidTimeZone, MAX_MONTH_OFFSET, LINKS, send, queryParam } from './_scheduler.js';

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

  const token = process.env.IBO_HUBSPOT_SERVICE_KEY;
  if (!token) {
    console.error('[partner-availability] IBO_HUBSPOT_SERVICE_KEY is not set');
    return send(res, 503, { error: 'not_configured', message: 'The scheduler is not configured on this deployment.' });
  }

  try {
    const { slots, hasMore } = await fetchAvailability(token, timezone, monthOffset, { slug: LINKS.partner.slug, halfHourOnly: true });
    return send(res, 200, { timezone, monthOffset, slots, hasMore });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    console.warn('[partner-availability] upstream failure', {
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
