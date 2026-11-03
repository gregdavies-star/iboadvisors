/* ==========================================================================
   IBO Advisors - shared HubSpot scheduler helpers for /api/partner-*

   Not an endpoint. Vercel turns every file under /api into a serverless
   function EXCEPT files (and folders) whose name starts with an underscore,
   so this module is bundled into the functions that import it and is never
   deployed as a route of its own. Keep the underscore.

   Used by:
     /api/partner-availability  proxies the open slots to the page
     /api/partner-book          re-reads the open slots before it books, so a
                                hand-made request cannot book outside them

   The scheduling-page slug and the meeting length live here and nowhere
   else. Neither handler ever takes them from the client.

   HubSpot facts (verified 3 Nov 2026):
     - Portal 245308986 (NA2); api.hubapi.com serves it.
     - Link michael-chasen/ibo-discussion (linkId 134005352) is Michael's
       personal link: 30 minutes, Zoom.
     - availability-page returns
         { linkAvailability: { linkAvailabilityByDuration: { "1800000":
             { meetingDurationMillis, availabilities: [{ startMillisUtc,
               endMillisUtc }] } }, hasMore }, allUsersBusyTimes }
       allUsersBusyTimes (Michael's busy blocks) is dropped here, so it is
       never returned to the browser.
     - The page advertises about two weeks ahead, so monthOffset 1+ is usually
       empty with hasMore false.

   fetch is read from globalThis at call time, so tests can substitute a fake.
   ========================================================================== */

export const SLUG = 'michael-chasen/ibo-discussion';
export const DURATION_MS = 1800000; // 30 minutes
export const MAX_MONTH_OFFSET = 6;
export const SCHEDULER_BASE = 'https://api.hubapi.com/scheduler/v3/meetings/meeting-links/book';
const AVAILABILITY_TIMEOUT_MS = 10000;

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

// The 30-minute entry only; every slot checked, sorted, de-duplicated and
// limited to times that have not started yet.
export function extractSlots(data, now = Date.now()) {
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
    seen.add(start);
    slots.push({ start, end });
  }
  slots.sort((x, y) => x.start - y.start);
  return slots;
}

// GET the availability page for one month (0 = the current month in
// `timezone`). Throws on a non-2xx with err.upstreamStatus set, and with a
// TimeoutError after 10s.
export async function fetchAvailability(token, timezone, monthOffset) {
  const url = `${SCHEDULER_BASE}/availability-page/${encodeURIComponent(SLUG)}` +
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
    slots: extractSlots(data),
    hasMore: !!(data && data.linkAvailability && data.linkAvailability.hasMore),
  };
}
