/* ==========================================================================
   TEMPORARY DIAGNOSTIC, delete before merging.

   GET /api/debug-busy?key=<nonce>&link=team|michael&timezone=America/New_York

   Why: the round robin link offers times when Michael is booked, while his
   own link blocks them. HubSpot's availability-page response carries
   allUsersBusyTimes (per member: meetingsUser + busyTimes), which
   ./_scheduler.js drops. This returns a compact view of it so we can see
   which members HubSpot thinks are busy, and when, on 2026-11-05 and
   2026-11-06.

   Guarded by `key`, a fixed one-off nonce (DEBUG_KEY below), compared in
   constant time; wrong or missing -> 404, so the route looks absent. Output never includes the token, and the user
   copy keeps only identity / calendar / offline-looking scalar fields
   (nothing whose name looks like a token, secret or key).
   ========================================================================== */

import { timingSafeEqual } from 'node:crypto';
import { LINKS, SCHEDULER_BASE, isValidTimeZone, send, queryParam } from './_scheduler.js';

const DAYS = { busyNov5: '2026-11-05', busyNov6: '2026-11-06' };
const DEBUG_KEY = '19a987ff91b1c345b7766eccc71ebbbd';
const KEEP_RE = /email|name|userid|^id$|calendar|offline|connect|provider|status|timezone|avail|active|sync|type|owner|team/i;
const DROP_RE = /token|secret|key|password|auth|credential/i;

function keyOk(given) {
  const want = Buffer.from(DEBUG_KEY);
  const got = Buffer.from(String(given || ''));
  return got.length === want.length && timingSafeEqual(got, want);
}

function compact(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (DROP_RE.test(k)) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (depth < 2) {
        const inner = compact(v, depth + 1);
        if (inner && Object.keys(inner).length) out[k] = inner;
      }
      continue;
    }
    if (Array.isArray(v)) {
      if (KEEP_RE.test(k) && v.every((x) => x === null || typeof x !== 'object')) out[k] = v.slice(0, 20);
      continue;
    }
    if (KEEP_RE.test(k)) out[k] = v;
  }
  return out;
}

function ms(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

function localParts(t, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' || !keyOk(queryParam(req, 'key'))) {
    return send(res, 404, { error: 'not_found' });
  }
  const link = queryParam(req, 'link') === 'michael' ? 'michael' : 'team';
  const rawTz = queryParam(req, 'timezone');
  const timezone = rawTz && isValidTimeZone(rawTz) ? rawTz : 'America/New_York';
  const slug = LINKS[link].slug;
  const token = process.env.IBO_HUBSPOT_SERVICE_KEY;
  if (!token) return send(res, 503, { error: 'not_configured' });

  let response;
  try {
    response = await globalThis.fetch(
      `${SCHEDULER_BASE}/availability-page/${encodeURIComponent(slug)}?timezone=${encodeURIComponent(timezone)}&monthOffset=0`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) },
    );
  } catch (err) {
    return send(res, 504, { error: 'upstream_failed', name: err && err.name });
  }
  let data = null;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok || !data || typeof data !== 'object') {
    return send(res, 502, { error: 'upstream_error', status: response.status });
  }

  const cp = data.customParams && typeof data.customParams === 'object' ? data.customParams : {};
  const customParams = {};
  for (const k of ['availability', 'weeksToAdvertise', 'startTimeIncrementMinutes', 'meetingBufferTime', 'durations', 'ownerPrioritized']) {
    if (cp[k] !== undefined) customParams[k] = cp[k];
  }

  const entries = Array.isArray(data.allUsersBusyTimes) ? data.allUsersBusyTimes : [];
  const allUsersBusyTimes = entries.map((entry) => {
    const e = entry && typeof entry === 'object' ? entry : {};
    const busy = Array.isArray(e.busyTimes) ? e.busyTimes : [];
    const byDay = Object.fromEntries(Object.keys(DAYS).map((k) => [k, []]));
    for (const b of busy) {
      const s = ms(b && (b.start ?? b.startMillisUtc));
      const en = ms(b && (b.end ?? b.endMillisUtc));
      if (s === null || en === null) continue;
      const a = localParts(s, timezone);
      const z = localParts(en, timezone);
      for (const [k, day] of Object.entries(DAYS)) {
        if (a.date === day || z.date === day) byDay[k].push(`${a.date === day ? a.hm : a.date + ' ' + a.hm}-${z.date === day ? z.hm : z.date + ' ' + z.hm}`);
      }
    }
    return {
      meetingsUserKeys: Object.keys(e.meetingsUser || {}),
      user: compact(e.meetingsUser),
      entryKeys: Object.keys(e),
      isOffline: e.isOffline,
      busyCount: busy.length,
      busyNov5: byDay.busyNov5,
      busyNov6: byDay.busyNov6,
    };
  });

  return send(res, 200, {
    link,
    slug,
    timezone,
    topLevelKeys: Object.keys(data),
    linkType: data.linkType,
    customParams,
    availability: cp.availability !== undefined ? cp.availability : null, // in full
    allUsersBusyTimes,
  });
}
