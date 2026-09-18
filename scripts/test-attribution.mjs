/* ==========================================================================
   Campaign attribution regression suite.

   Drives a real browser over the site's five lead-capture forms and asserts
   that the visitor's utm_* parameters reach the HubSpot Forms API and the
   meeting scheduler URL. The HubSpot endpoint is intercepted, so nothing here
   touches the live portal.

     npm run test:attribution

   Covers the failure this suite was written for: a visitor who lands on a
   campaign URL, browses to another page, and only then converts.
   ========================================================================== */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  console.error('playwright is not installed - `npm i -D playwright` (or run with a global install) to run this suite.');
  process.exit(2);
}
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

// Static server mimicking Vercel cleanUrls.
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join(ROOT, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  else if (!existsSync(f) && existsSync(f + '/index.html')) f = f + '/index.html';
  else if (!existsSync(f) && existsSync(f + '.html')) f = f + '.html';
  if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(4173, r));
const BASE = 'http://localhost:4173';

// PLAYWRIGHT_CHROMIUM_PATH lets a preinstalled browser be used (CI images,
// Claude Code on the web) instead of a downloaded one.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

async function newCtx() {
  const ctx = await browser.newContext();
  const submissions = [];
  // Intercept HubSpot + block external tags.
  await ctx.route('**://api.hsforms.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    submissions.push({ url: route.request().url(), body });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"inlineMessage":"ok"}' });
  });
  await ctx.route('**meetings-na2.hubspot.com**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>scheduler stub</body></html>' }));
  for (const pat of ['**googletagmanager.com**', '**hs-scripts.com**', '**vaudit.com**', '**idpixel.app**'])
    await ctx.route(pat, (r) => r.abort());
  return { ctx, submissions };
}

function fieldMap(sub) {
  return Object.fromEntries(sub.body.fields.map((f) => [f.name, f.value]));
}

async function fillModal(page) {
  await page.click('[data-ibo-open-modal]');
  await page.fill('#ibo-fullName', 'Ada Lovelace');
  await page.fill('#ibo-email', 'ada@example.com');
  await page.fill('#ibo-cellNumber', '555-0100');
  await page.fill('#ibo-company', 'Analytical Engines');
  await page.check('input[name="respondentRole"][value="CEO/Founder/Owner"]');
  await page.selectOption('#ibo-ebitdaBand', '$5M - $10M');
  await page.click('#ibo-modal-submit');
}

const UTM = 'utm_source=linkedin&utm_medium=paid_social&utm_campaign=ibo_q3&utm_content=carousel_a&utm_term=exit%20planning&utm_ad_id=ad_789&li_fat_id=abc123';

/* ---- 1. Modal on the landing page itself ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('modal on landing page sends utm fields', f.ibo_form_source === 'linkedin' && f.ibo_form_medium === 'paid_social' && f.ibo_form_campaign === 'ibo_q3' && f.ibo_form_content === 'carousel_a' && f.ibo_form_ad_id === 'ad_789' && f.ibo_form_platform_id === 'abc123' && !!f.ibo_form_uuid && !!f.ibo_form_landing_url && /^\d+$/.test(f.ibo_form_timestamp || ''), JSON.stringify(f));
  check('modal redirects to scheduler with utms', page.url().includes('utm_source=linkedin') && page.url().includes('li_fat_id=abc123'), page.url().slice(0, 130));
  await ctx.close();
}

/* ---- 2. THE REGRESSION: land with utms, browse away, then convert ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await page.goto(`${BASE}/approach`);           // no utms on this URL
  await page.goto(`${BASE}/blog/restaurant-ma`); // still none
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('utms survive navigation to another page', f.ibo_form_source === 'linkedin' && f.ibo_form_campaign === 'ibo_q3', JSON.stringify(f));
  check('scheduler url carries utms after navigation', page.url().includes('utm_source=linkedin'), page.url().slice(0, 130));
  await ctx.close();
}

/* ---- 3. /ibo-exit book form ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ibo-exit?${UTM}`);
  await page.selectOption('#xc-industry', { index: 1 });
  await page.fill('#xc-revenue', '30000000');
  await page.fill('#xc-ebitda', '8000000');
  await page.click('#xc-form button[type="submit"]');
  await page.waitForTimeout(400);
  await page.fill('#xc-lead-name', 'Ada Lovelace');
  await page.fill('#xc-lead-email', 'ada@example.com');
  await page.fill('#xc-lead-phone', '555-0100');
  await page.fill('#xc-lead-company', 'Analytical Engines');
  await page.click('#xc-book-submit');
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('/ibo-exit book form sends utm fields', f.ibo_form_source === 'linkedin' && f.ibo_form_campaign === 'ibo_q3', JSON.stringify(f));
  await ctx.close();
}

/* ---- 4. /ibo-exit2 stay-in-touch form (sub-$3M), utms from a prior page ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ibo-exit2?${UTM}`);
  await page.selectOption('#xc-industry', { index: 1 });
  await page.fill('#xc-revenue', '6000000');
  await page.fill('#xc-ebitda', '1500000');
  await page.click('#xc-form button[type="submit"]');
  await page.waitForTimeout(400);
  await page.fill('#xc-touch-name', 'Ada Lovelace');
  await page.fill('#xc-touch-email', 'ada@example.com');
  await page.fill('#xc-touch-company', 'Analytical Engines');
  await page.click('#xc-touch-submit');
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('/ibo-exit2 stay-in-touch form sends utm fields', f.ibo_form_source === 'linkedin' && f.ibo_form_campaign === 'ibo_q3', JSON.stringify(f));
  await ctx.close();
}

/* ---- 5. valuation calculator gate ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/business-valuation-calculator?${UTM}`);
  await page.selectOption('#vc-industry', { index: 1 });
  await page.fill('#vc-revenue', '20000000');
  await page.fill('#vc-profit', '6000000');
  await page.fill('#vc-growth-rate', '10');
  await page.click('#vc-form button[type="submit"]');
  await page.waitForTimeout(400);
  await page.fill('#vc-lead-name', 'Ada Lovelace');
  await page.fill('#vc-lead-email', 'ada@example.com');
  await page.fill('#vc-lead-phone', '555-0100');
  await page.fill('#vc-lead-company', 'Analytical Engines');
  await page.click('#vc-gate-submit');
  await page.waitForTimeout(800);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('calculator gate sends utm fields', f.ibo_form_source === 'linkedin' && f.ibo_form_campaign === 'ibo_q3', JSON.stringify(f));
  await ctx.close();
}

/* ---- 6. contact message form ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await page.click('[data-ibo-open-contact]');
  await page.click('#ibo-contact-message');
  await page.fill('#ibo-msg-name', 'Ada Lovelace');
  await page.fill('#ibo-msg-email', 'ada@example.com');
  await page.fill('#ibo-msg-message', 'Hello');
  await page.click('#ibo-message-submit');
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('contact message form sends utm fields', f.ibo_form_source === 'linkedin', JSON.stringify(f));
  await ctx.close();
}

/* ---- 7. fail-soft: HubSpot 400s on the utm fields, lead must still land ---- */
{
  const ctx = await browser.newContext();
  const attempts = [];
  await ctx.route('**://api.hsforms.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    attempts.push(body.fields.map((f) => f.name));
    const hasUtm = body.fields.some((f) => f.name.startsWith('ibo_form_'));
    if (hasUtm) return route.fulfill({ status: 400, contentType: 'application/json', body: '{"status":"error","message":"Field ibo_form_source does not exist"}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"inlineMessage":"ok"}' });
  });
  await ctx.route('**meetings-na2.hubspot.com**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>scheduler stub</body></html>' }));
  for (const pat of ['**googletagmanager.com**', '**hs-scripts.com**', '**vaudit.com**', '**idpixel.app**'])
    await ctx.route(pat, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(800);
  check('fail-soft: retries without utm fields on 400', attempts.length === 2 && attempts[0].some((n) => n === 'ibo_form_source') && !attempts[1].some((n) => n.startsWith('ibo_form_')), JSON.stringify(attempts));
  check('fail-soft: lead still converts to scheduler', page.url().includes('meetings-na2.hubspot.com'), page.url().slice(0, 80));
  await ctx.close();
}

/* ---- 8. no utms anywhere: nothing extra is sent, nothing breaks ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('direct visit sends no attribution fields', submissions.length === 1 && !Object.keys(f).some((k) => k.startsWith('ibo_form_')), JSON.stringify(Object.keys(f)));
  await ctx.close();
}

/* ---- 9. last touch wins, first touch retained ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?utm_source=linkedin&utm_campaign=first`);
  await page.goto(`${BASE}/?utm_source=facebook&utm_campaign=second`);
  const touches = await page.evaluate(() => ({ first: window.iboTracking.firstTouch(), last: window.iboTracking.lastTouch() }));
  check('first touch retained', touches.first?.params?.utm_campaign === 'first', JSON.stringify(touches.first?.params));
  check('last touch overwritten', touches.last?.params?.utm_campaign === 'second', JSON.stringify(touches.last?.params));
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('submission carries last touch', f.ibo_form_campaign === 'second', JSON.stringify(f));
  await ctx.close();
}

/* ---- 10. localStorage unavailable -> cookie fallback still carries utms ---- */
{
  const { ctx, submissions } = await newCtx();
  await ctx.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await page.goto(`${BASE}/approach`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('cookie fallback when localStorage throws', f.ibo_form_source === 'linkedin', JSON.stringify(f));
  await ctx.close();
}

/* ---- 11. the scheduler URL carries the IBO Meeting * set, joined by uuid ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await page.goto(`${BASE}/approach`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  const q = new URL(page.url()).searchParams;
  check('scheduler url carries ibo_meeting_* params',
    q.get('ibo_meeting_source') === 'linkedin' && q.get('ibo_meeting_medium') === 'paid_social' &&
    q.get('ibo_meeting_campaign') === 'ibo_q3' && q.get('ibo_meeting_content') === 'carousel_a' &&
    q.get('ibo_meeting_ad_id') === 'ad_789' && q.get('ibo_meeting_platform_id') === 'abc123' &&
    !!q.get('ibo_meeting_landing_url') && /^\d+$/.test(q.get('ibo_meeting_timestamp') || ''),
    [...q].filter(([k]) => k.startsWith('ibo_meeting_')).map(([k, v]) => `${k}=${v}`).join(' '));
  check('scheduler url still carries raw utm_* for HubSpot built-ins',
    q.get('utm_source') === 'linkedin' && q.get('utm_campaign') === 'ibo_q3' && q.get('utm_term') === 'exit planning');
  check('form uuid and meeting uuid match (joinable)',
    !!f.ibo_form_uuid && f.ibo_form_uuid === q.get('ibo_meeting_uuid'),
    `${f.ibo_form_uuid} vs ${q.get('ibo_meeting_uuid')}`);
  await ctx.close();
}

/* ---- 12. IBO Form Timestamp is midnight-UTC epoch ms (HubSpot date type) ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const ts = Number(fieldMap(submissions[0]).ibo_form_timestamp);
  const d = new Date(ts);
  check('timestamp is midnight UTC epoch ms',
    Number.isInteger(ts) && d.getUTCHours() === 0 && d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0,
    `${ts} -> ${d.toISOString()}`);
  await ctx.close();
}

/* ---- 13. utm_term has no IBO property: captured, carried, never submitted ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const names = submissions[0].body.fields.map((f) => f.name);
  check('utm_term is not submitted (no IBO Form Term property)',
    !names.some((n) => n.includes('term')), names.filter((n) => n.startsWith('ibo_')).join(','));
  check('utm_term still reaches the scheduler', new URL(page.url()).searchParams.get('utm_term') === 'exit planning');
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
