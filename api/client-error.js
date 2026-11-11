/* ==========================================================================
   IBO Advisors - POST /api/client-error

   Receives error reports from the visitor's browser (see reportError in
   /tracking.js): a lead-form submission HubSpot rejected or could not be
   reached for, a /book failure, an uncaught script error on our own code.
   Each report is written to the function log as "[client-error] ..." and
   raised through sendAlert (api/_alert.js), so the team hears about a broken
   form before a prospect has to write in.

     POST /api/client-error   Content-Type: application/json
       { kind, message?, status?, detail?, form?, fields?, page?, ua?, online? }
       -> 204

   Public and unauthenticated by nature, so: same-origin only, JSON only,
   small body, every string clipped, emails and phone-like numbers scrubbed
   from free text, and a per-IP cap. Reports carry field NAMES, never values.
   ========================================================================== */

import { sendAlert } from './_alert.js';
import { send, clean, header, sameOrigin, readBody } from './_scheduler.js';

const KINDS = new Set(['hubspot_form', 'book_failed', 'availability_failed', 'script_error', 'unhandled_rejection']);
const MAX_PER_IP = 20;
const IP_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();

export function scrub(value, max) {
  const s = clean(typeof value === 'string' ? value : value == null ? '' : String(value), 100000) || '';
  return s
    .replace(/[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g, '[email]')
    .replace(/\+?\d[\d\s().\-]{6,}\d/g, '[number]')
    .slice(0, max);
}

export function normalise(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (!KINDS.has(body.kind)) return null;
  const status = Number.isInteger(body.status) ? body.status : null;
  return {
    kind: body.kind,
    message: scrub(body.message, 300),
    status,
    detail: scrub(body.detail, 600),
    form: scrub(body.form, 60),
    fields: Array.isArray(body.fields) ? body.fields.slice(0, 30).map((f) => scrub(f, 60)).join(', ') : '',
    page: scrub(body.page, 120),
    ua: scrub(body.ua, 200),
    online: typeof body.online === 'boolean' ? String(body.online) : '',
  };
}

function overLimit(ip, now) {
  const entry = hits.get(ip);
  if (!entry || now - entry.start > IP_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    if (hits.size > 500) hits.delete(hits.keys().next().value);
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_IP;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'forbidden_origin' });
  if (!/^application\/json\b/i.test(header(req, 'content-type'))) {
    return send(res, 415, { ok: false, error: 'unsupported_media_type' });
  }

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { ok: false, error: 'invalid_request' }); }
  const report = normalise(body);
  if (!report) return send(res, 400, { ok: false, error: 'invalid_request' });

  const ip = String(header(req, 'x-forwarded-for')).split(',')[0].trim() || 'unknown';
  if (overLimit(ip, Date.now())) return send(res, 429, { ok: false, error: 'rate_limited' });

  console.error('[client-error]', report);
  await sendAlert({
    title: `Site error: ${report.kind}${report.status !== null ? ` (HTTP ${report.status})` : ''}`,
    signature: `${report.kind}|${report.status}|${report.form}|${report.detail.slice(0, 80)}`,
    fields: {
      page: report.page,
      form: report.form,
      message: report.message,
      detail: report.detail,
      'fields sent': report.fields,
      browser: report.ua,
      online: report.online,
    },
  });
  res.statusCode = 204;
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}
