/* ==========================================================================
   IBO Advisors - alerting helper (not a route: the underscore keeps Vercel
   from deploying it).

   sendAlert({ title, fields }) posts a short message to the webhook in
   IBO_ALERT_WEBHOOK_URL (a Slack incoming webhook; Teams/Discord-style
   endpoints that accept {"text": "..."} work too). Without the variable the
   alert is only logged (console.error "[alert] ..."), which Vercel keeps in
   Runtime Logs, so nothing breaks before the webhook is configured.

   Throttle: the same title+signature alerts at most once per ALERT_WINDOW_MS
   per warm function instance, so one broken form does not flood the channel.
   Never put names, emails, phone numbers or tokens in `fields`.
   ========================================================================== */

const ALERT_WINDOW_MS = 10 * 60 * 1000;
const WEBHOOK_TIMEOUT_MS = 3000;
const recent = new Map();

export function resetAlertThrottle() { recent.clear(); }

export async function sendAlert({ title, fields = {}, signature = '' }) {
  const key = `${title}|${signature}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < ALERT_WINDOW_MS) return { sent: false, throttled: true };
  recent.set(key, now);
  if (recent.size > 200) recent.delete(recent.keys().next().value);

  console.error('[alert]', title, fields);

  const url = process.env.IBO_ALERT_WEBHOOK_URL;
  if (!url) return { sent: false, throttled: false };

  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `*${k}:* ${String(v).slice(0, 500)}`);
  const text = `:rotating_light: *${title}*\n${lines.join('\n')}`;
  try {
    const res = await globalThis.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    return { sent: res.ok, throttled: false };
  } catch (err) {
    console.warn('[alert] webhook failed', err && err.name);
    return { sent: false, throttled: false };
  }
}
