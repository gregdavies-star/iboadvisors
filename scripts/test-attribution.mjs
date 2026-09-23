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
  await page.check('input[name="respondentRole"][value="CEO/Founder/Owner"]');
  await page.selectOption('#ibo-ebitdaBand', '$3M - $10M');
  await page.click('#ibo-modal-submit');
}

const UTM = 'utm_source=linkedin&utm_medium=paid_social&utm_campaign=ibo_q3&utm_content=carousel_a&utm_term=exit%20planning&sl=ibo-q3-carousel&li_fat_id=abc123';

/* ---- 1. Modal on the landing page itself ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('modal on landing page sends utm fields', f.ibo_form_source === 'linkedin' && f.ibo_form_medium === 'paid_social' && f.ibo_form_campaign === 'ibo_q3' && f.ibo_form_content === 'carousel_a' && !('ibo_form_ad_id' in f) && !('ibo_form_platform_id' in f) && !!f.ibo_form_uuid && !!f.ibo_form_landing_url && /^\d+$/.test(f.ibo_form_timestamp || ''), JSON.stringify(f));
  check('modal redirects to scheduler with utms', page.url().includes('utm_source=linkedin') && page.url().includes('li_fat_id=abc123'), page.url().slice(0, 130));
  check('modal sends the phone number when it is filled in', f.phone === '555-0100', `phone=${f.phone}`);
  check('modal sends the $3M - $10M band and no company', f.what_is_your_approximate_annual_ebitda_profit === '$3M - $10M' && f.ibo_qualified === 'True' && !('company' in f), JSON.stringify(f));
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
  check('/ibo-exit derives $3M - $10M for $8M EBITDA', f.what_is_your_approximate_annual_ebitda_profit === '$3M - $10M', f.what_is_your_approximate_annual_ebitda_profit);
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
  check('fail-soft: falls all the way back to identity fields when every attribution field is rejected',
    attempts.length === 3 &&
    attempts[0].some((n) => n === 'ibo_form_source') &&
    !attempts[2].some((n) => n.startsWith('ibo_form_')) &&
    attempts[2].includes('email'),
    JSON.stringify(attempts.map((a) => a.length)));
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
    q.get('ibo_meeting_ad_id') === null && q.get('ibo_meeting_platform_id') === null &&
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

/* ---- 14. platform_id normalises however the ad tagged utm_source ---- */
{
  const { ctx } = await newCtx();
  const page = await ctx.newPage();
  const cases = [
    ['utm_source=LinkedIn&utm_campaign=a', 'linkedin', 'utm_source spelling, mixed case'],
    ['utm_source=li&utm_campaign=a', 'linkedin', 'utm_source abbreviation'],
    ['utm_source=fb&utm_campaign=a', 'meta', 'facebook abbreviation -> meta'],
    ['utm_source=instagram&utm_campaign=a', 'meta', 'instagram -> meta'],
    ['utm_source=adwords&utm_campaign=a', 'google', 'adwords -> google'],
    ['utm_campaign=a&li_fat_id=xyz', 'linkedin', 'click id, no utm_source'],
    ['utm_campaign=a&fbclid=xyz', 'meta', 'fbclid, no utm_source'],
    ['utm_campaign=a&gclid=xyz', 'google', 'gclid, no utm_source'],
    ['utm_source=some_newsletter_tool&utm_campaign=a', 'some_newsletter_tool', 'unmapped source falls through to itself']
  ];
  let ok = true;
  const seen = [];
  for (const [qs, expected, why] of cases) {
    await page.goto(`${BASE}/?${qs}`);
    const got = await page.evaluate(() => window.iboTracking.attribution().platform_id);
    seen.push(`${why}: ${got}`);
    if (got !== expected) { ok = false; seen[seen.length - 1] += ` (expected ${expected})`; }
  }
  check('platform_id normalises across taggings', ok, seen.join(' | '));
  await ctx.close();
}

/* ---- 15. ad_id: short-link param, and the referrer fallback ---- */
{
  const { ctx } = await newCtx();
  const page = await ctx.newPage();

  for (const key of ['sl', 'short_link', 'utm_ad_id', 'ad_id']) {
    await page.goto(`${BASE}/?utm_source=linkedin&${key}=ibo-q3-carousel`);
    const got = await page.evaluate(() => window.iboTracking.attribution().ad_id);
    check(`ad_id read from ?${key}`, got === 'ibo-q3-carousel', got);
  }

  // A shortener cannot be recovered from the referrer: the default referrer
  // policy strips the path at an origin boundary, so document.referrer reads
  // "https://bit.ly/" with the slug gone. Ad ID must stay empty rather than
  // record the shortener's bare origin.
  await ctx.route('**://bit.ly/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html',
      body: `<html><body><a id="go" href="${BASE}/?utm_source=linkedin&utm_campaign=ibo_q3">go</a></body></html>` }));
  await page.goto('https://bit.ly/ibo-q3-carousel');
  await Promise.all([page.waitForURL(`${BASE}/**`), page.click('#go')]);
  const viaReferrer = await page.evaluate(() => ({
    ad_id: window.iboTracking.attribution().ad_id,
    referrer: document.referrer
  }));
  check('ad_id stays empty when only a shortener referrer is available',
    viaReferrer.ad_id === '' && !viaReferrer.referrer.includes('ibo-q3-carousel'),
    JSON.stringify(viaReferrer));
  await ctx.close();
}


/* ---- 16. the two HubSpot field bugs: role, and the EBITDA band value ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();

  // The qualify modal sends `role`, not the non-existent `respondent_role`.
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(600);
  const owner = fieldMap(submissions[0]);
  check('modal sends role (not respondent_role)',
    owner.role === 'CEO/Founder/Owner' && !('respondent_role' in owner),
    `role=${owner.role}`);
  await ctx.close();
}

{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  // An advisor answer must reach HubSpot too - it was being dropped entirely.
  await page.goto(`${BASE}/`);
  await page.click('[data-ibo-open-modal]');
  await page.fill('#ibo-fullName', 'Ada Lovelace');
  await page.fill('#ibo-email', 'ada@example.com');
  await page.fill('#ibo-cellNumber', '555-0100');
  await page.check('input[name="respondentRole"][value="Business Advisor"]');
  await page.click('#ibo-modal-submit');
  await page.waitForTimeout(600);
  const advisor = fieldMap(submissions[0]);
  check('modal sends the advisor answer', advisor.role === 'Business Advisor', `role=${advisor.role}`);
  await ctx.close();
}

{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  // Under $3M must submit "$0 - $3M" - the option the HubSpot property has.
  // "Less than $3M" was not one, so every such submission was rejected.
  await page.goto(`${BASE}/`);
  await page.click('[data-ibo-open-modal]');
  await page.fill('#ibo-fullName', 'Ada Lovelace');
  await page.fill('#ibo-email', 'ada@example.com');
  await page.fill('#ibo-cellNumber', '555-0100');
  await page.check('input[name="respondentRole"][value="CEO/Founder/Owner"]');
  await page.selectOption('#ibo-ebitdaBand', { label: 'Less than $3M' });
  await page.click('#ibo-modal-submit');
  await page.waitForTimeout(600);
  const f = fieldMap(submissions[0]);
  check('modal submits $0 - $3M for the under-$3M band',
    f.what_is_your_approximate_annual_ebitda_profit === '$0 - $3M' && f.ibo_qualified === 'False',
    f.what_is_your_approximate_annual_ebitda_profit);
  check('the option still reads "Less than $3M" to the visitor',
    (await page.evaluate(() => {
      const o = [...document.getElementById('ibo-ebitdaBand').options].find((x) => x.value === '$0 - $3M');
      return o && o.textContent.trim();
    })) === 'Less than $3M');
  await ctx.close();
}

{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  // Only Name, Email and the role are required; phone is optional and a
  // blank phone is not sent. There is no company field any more.
  await page.goto(`${BASE}/`);
  await page.click('[data-ibo-open-modal]');
  await page.fill('#ibo-fullName', 'Ada Lovelace');
  await page.fill('#ibo-email', 'ada@example.com');
  await page.check('input[name="respondentRole"][value="CEO/Founder/Owner"]');
  await page.selectOption('#ibo-ebitdaBand', { label: 'Over $10M' });
  await page.click('#ibo-modal-submit');
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('modal submits $10M+ for "Over $10M" and qualifies',
    f.what_is_your_approximate_annual_ebitda_profit === '$10M+' && f.ibo_qualified === 'True',
    JSON.stringify(f));
  check('a blank phone is not sent, and no company is sent',
    submissions.length === 1 && !('phone' in f) && !('company' in f),
    JSON.stringify(Object.keys(f)));
  check('submits without a phone and redirects to the scheduler with no company param',
    page.url().includes('meetings-na2.hubspot.com') && !page.url().includes('company='),
    page.url().slice(0, 130));
  await ctx.close();
}

{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  // /ibo-exit and the calculator derive the band; they must agree.
  await page.goto(`${BASE}/ibo-exit`);
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
  const f = fieldMap(submissions[0]);
  check('/ibo-exit derives $0 - $3M below the threshold',
    f.what_is_your_approximate_annual_ebitda_profit === '$0 - $3M',
    f.what_is_your_approximate_annual_ebitda_profit);
  await ctx.close();
}

{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  // $10M and above is the top band; the >= $3M path books via the book form.
  await page.goto(`${BASE}/ibo-exit`);
  await page.selectOption('#xc-industry', { index: 1 });
  await page.fill('#xc-revenue', '40000000');
  await page.fill('#xc-ebitda', '12000000');
  await page.click('#xc-form button[type="submit"]');
  await page.waitForTimeout(400);
  await page.fill('#xc-lead-name', 'Ada Lovelace');
  await page.fill('#xc-lead-email', 'ada@example.com');
  await page.fill('#xc-lead-phone', '555-0100');
  await page.fill('#xc-lead-company', 'Analytical Engines');
  await page.click('#xc-book-submit');
  await page.waitForTimeout(600);
  const f = submissions.length ? fieldMap(submissions[0]) : {};
  check('/ibo-exit derives $10M+ for $12M EBITDA',
    f.what_is_your_approximate_annual_ebitda_profit === '$10M+',
    f.what_is_your_approximate_annual_ebitda_profit);
  await ctx.close();
}

/* ---- 17. a rejected field never costs the lead ---- */
{
  const ctx = await browser.newContext();
  const attempts = [];
  // HubSpot rejects one named field; everything else must still land.
  await ctx.route('**://api.hsforms.com/**', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const names = body.fields.map((f) => f.name);
    attempts.push(names);
    if (names.includes('role')) {
      return route.fulfill({ status: 400, contentType: 'application/json',
        body: '{"status":"error","message":"Error in \'fields.role\'. \'Business Advisor\' is not one of the allowed options"}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"inlineMessage":"ok"}' });
  });
  await ctx.route('**meetings-na2.hubspot.com**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>scheduler stub</body></html>' }));
  for (const pat of ['**googletagmanager.com**', '**hs-scripts.com**', '**vaudit.com**', '**idpixel.app**'])
    await ctx.route(pat, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(800);
  const second = attempts[1] || [];
  check('a blamed field is dropped, the rest of the payload survives',
    attempts.length === 2 && !second.includes('role') &&
    second.includes('email') && second.includes('ibo_form_source') &&
    second.includes('what_is_your_approximate_annual_ebitda_profit'),
    JSON.stringify(second));
  check('the lead still converts after a field is dropped',
    page.url().includes('meetings-na2.hubspot.com'), page.url().slice(0, 70));
  await ctx.close();
}

{
  const ctx = await browser.newContext();
  const attempts = [];
  // An error that blames nothing droppable: fall back to identity only.
  await ctx.route('**://api.hsforms.com/**', async (route) => {
    const names = JSON.parse(route.request().postData() || '{}').fields.map((f) => f.name);
    attempts.push(names);
    if (names.length > 5) {
      return route.fulfill({ status: 400, contentType: 'application/json',
        body: '{"status":"error","message":"something went wrong"}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"inlineMessage":"ok"}' });
  });
  await ctx.route('**meetings-na2.hubspot.com**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>scheduler stub</body></html>' }));
  for (const pat of ['**googletagmanager.com**', '**hs-scripts.com**', '**vaudit.com**', '**idpixel.app**'])
    await ctx.route(pat, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);
  await fillModal(page);
  await page.waitForTimeout(800);
  const second = attempts[1] || [];
  check('an unattributable 400 falls back to the identity fields',
    attempts.length === 2 && second.every((n) =>
      ['firstname', 'lastname', 'email', 'phone', 'company', 'message'].includes(n)) &&
    second.includes('email'),
    JSON.stringify(second));
  check('the lead still converts on the identity-only retry',
    page.url().includes('meetings-na2.hubspot.com'), page.url().slice(0, 70));
  await ctx.close();
}

/* ---- 18. ad_id / platform_id are resolved but never written to HubSpot ----
   Those two properties belong to the LinkedIn lead-gen sync, which puts its
   own numeric identifiers in them. The site must stay out of both columns
   while still capturing the values for its own use. ---- */
{
  const { ctx, submissions } = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?${UTM}`);

  // Still resolved and readable — only the HubSpot mapping is off.
  const attr = await page.evaluate(() => window.iboTracking.attribution());
  check('ad_id and platform_id are still resolved in attribution()',
    attr.ad_id === 'ibo-q3-carousel' && attr.platform_id === 'linkedin',
    `ad_id=${attr.ad_id} platform_id=${attr.platform_id}`);

  await fillModal(page);
  await page.waitForTimeout(600);
  const names = submissions[0].body.fields.map((f) => f.name);
  check('no ad_id / platform_id property is submitted',
    !names.some((n) => n.endsWith('_ad_id') || n.endsWith('_platform_id')),
    names.filter((n) => n.startsWith('ibo_')).join(','));

  // The rest of the attribution is untouched by the change.
  check('the other attribution fields still submit',
    ['ibo_form_source', 'ibo_form_medium', 'ibo_form_campaign', 'ibo_form_content',
     'ibo_form_uuid', 'ibo_form_landing_url', 'ibo_form_timestamp']
      .every((n) => names.includes(n)));

  const q = new URL(page.url()).searchParams;
  check('scheduler url carries no ad_id / platform_id either',
    q.get('ibo_meeting_ad_id') === null && q.get('ibo_meeting_platform_id') === null &&
    q.get('ibo_meeting_source') === 'linkedin',
    [...q].filter(([k]) => k.startsWith('ibo_meeting_')).map(([k]) => k).join(' '));

  // The raw params still reach the scheduler, so nothing is lost upstream.
  check('raw sl / click-id params still reach the scheduler',
    q.get('sl') === 'ibo-q3-carousel' && q.get('li_fat_id') === 'abc123');
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
