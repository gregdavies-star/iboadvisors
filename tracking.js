/* ==========================================================================
   IBO Advisors — shared attribution tracking (window.iboTracking)

   Loaded on every page ahead of /modal.js, /ibo-exit/exit.js and
   /business-valuation-calculator/calculator.js, all of which submit leads to
   the same HubSpot form. It exists because campaign attribution was being
   lost in two places:

     1. utm_* params were only ever read from window.location.search at the
        instant of submit. A visitor who landed on
        /?utm_source=linkedin&utm_medium=paid_social and then clicked through
        to /approach or a blog post before opening the modal submitted with
        no campaign data at all — HubSpot recorded them as Direct Traffic.
     2. The utm_* params were never sent to HubSpot as field values. Only
        pageUri + hutk went across, so HubSpot had to infer the source.

   What this module does:
     - Captures utm_* params and ad-platform click IDs on the first page of
       the visit and persists them (localStorage, cookie fallback), so every
       form on the site submits the campaign the visitor actually arrived on,
       no matter how many pages later they convert.
     - Keeps first touch and last touch separately. A visitor who arrives on
       a LinkedIn ad today and a Meta ad next week has both recorded; the
       HubSpot fields carry last touch, which is the campaign that produced
       the conversion.
     - Maps those values onto HubSpot contact properties for the Forms API,
       and submits with a fail-soft retry (see submitForm below).
     - Copies the params onto the meeting scheduler URL so the booking
       carries the same campaign as the form submission.

   Privacy: utm_* params and the stored blob are first-party campaign
   attribution — the same category as the HubSpot form attribution that
   /privacy section 2 lists as unaffected by an opt-out, and that
   privacy-signals.js deliberately leaves running under GPC. Nothing here is
   a "sale" or "share", nothing is sent to a third party, and no identity
   graph is involved, so this runs for GPC visitors too.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     HubSpot field mapping — THE ONE THING TO KEEP IN SYNC.

     Keys are URL parameters, values are the *internal name* of the HubSpot
     contact property they are written to. Each property must exist on the
     contact object AND be present as a field on every HubSpot form this site
     submits to (HUBSPOT_FORM_GUID in modal.js / exit.js / calculator.js, and
     the message form in modal.js), or HubSpot rejects the field.

     Setting a value to null (or removing the entry) stops that parameter
     being sent while still capturing and persisting it — use that for a
     parameter that has no HubSpot property yet.

     hs_google_click_id / hs_facebook_click_id / hs_linkedin_click_id exist in
     the portal but are HubSpot-managed and not writable through a form, which
     is why the click IDs below are captured but not mapped. Map them to
     writable custom properties here if they are ever wanted on the contact.
     ------------------------------------------------------------------ */
  var HUBSPOT_FIELDS = {
    utm_source: 'utm_source',
    utm_medium: 'utm_medium',
    utm_campaign: 'utm_campaign',
    utm_term: 'utm_term',
    utm_content: 'utm_content'
  };

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  // The identifiers the ad platforms append in place of, or alongside, utm_*.
  // Captured and carried to the scheduler; not written to HubSpot by default.
  var CLICK_ID_KEYS = [
    'gclid', 'wbraid', 'gbraid',   // Google Ads
    'fbclid',                      // Meta (Facebook / Instagram)
    'li_fat_id',                   // LinkedIn
    'msclkid',                     // Microsoft Ads
    'ttclid',                      // TikTok
    'twclid',                      // X / Twitter
    'epik',                        // Pinterest
    'rdt_cid'                      // Reddit
  ];

  var TRACKED_KEYS = UTM_KEYS.concat(CLICK_ID_KEYS);

  var STORAGE_KEY = 'ibo_attribution';
  var COOKIE_NAME = 'ibo_attribution';
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

  /* ---- storage: localStorage first, first-party cookie as the fallback ---- */

  function readStore() {
    var raw = null;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!raw) {
      var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
      if (m) {
        try { raw = decodeURIComponent(m[1]); } catch (e) { raw = null; }
      }
    }
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function writeStore(store) {
    var raw;
    try { raw = JSON.stringify(store); } catch (e) { return; }
    try { window.localStorage.setItem(STORAGE_KEY, raw); } catch (e) {}
    try {
      document.cookie = COOKIE_NAME + '=' + encodeURIComponent(raw) +
        ';path=/;max-age=' + COOKIE_MAX_AGE + ';SameSite=Lax' +
        (window.location.protocol === 'https:' ? ';Secure' : '');
    } catch (e) {}
  }

  /* ---- capture ---- */

  // Trim to something a HubSpot single-line text property will accept, and
  // strip control characters rather than pass them through to the CRM.
  function clean(value) {
    return String(value).replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 255);
  }

  function paramsFromUrl() {
    var found = {};
    try {
      var qs = new URLSearchParams(window.location.search);
      TRACKED_KEYS.forEach(function (key) {
        var value = qs.get(key);
        if (value) {
          value = clean(value);
          if (value) found[key] = value;
        }
      });
    } catch (e) {}
    return found;
  }

  function isEmpty(obj) {
    for (var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) return false; }
    return true;
  }

  function touchFrom(params) {
    return {
      params: params,
      landing_page: window.location.origin + window.location.pathname,
      referrer: document.referrer ? clean(document.referrer) : '',
      timestamp: new Date().toISOString()
    };
  }

  // A page load carrying campaign params is a new touch: it becomes last
  // touch always, and first touch only if we have never seen one. A load with
  // no params leaves the stored attribution alone — that is the whole point,
  // it is what survives the visitor browsing to another page before
  // converting.
  var store = readStore() || {};
  var current = paramsFromUrl();

  if (!isEmpty(current)) {
    var touch = touchFrom(current);
    store.last = touch;
    if (!store.first) store.first = touch;
    writeStore(store);
  }

  function lastTouch() { return store.last || null; }
  function firstTouch() { return store.first || null; }

  // The campaign params that should be attached to a conversion: whatever is
  // on this URL right now, else the stored last touch.
  function utmParams() {
    if (!isEmpty(current)) return current;
    var last = lastTouch();
    return last && last.params ? last.params : {};
  }

  /* ---- HubSpot ---- */

  function hutk() {
    var m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function formContext() {
    var ctx = { pageUri: window.location.href, pageName: document.title };
    var token = hutk();
    if (token) ctx.hutk = token;
    return ctx;
  }

  // The utm_* params as HubSpot Forms API field entries.
  function utmFields() {
    var params = utmParams();
    var fields = [];
    Object.keys(HUBSPOT_FIELDS).forEach(function (key) {
      var property = HUBSPOT_FIELDS[key];
      if (property && params[key]) fields.push({ name: property, value: params[key] });
    });
    return fields;
  }

  /* Submit to the HubSpot Forms API with the campaign fields attached.

     Fail-soft by design: HubSpot rejects an entire submission with a 400 if
     any field name is not on the form, so a mapping in HUBSPOT_FIELDS that
     has not been added to the form yet would otherwise drop the lead itself.
     On a 400 with campaign fields attached we retry once with the original
     fields only — attribution is lost for that submission, the lead is not.
     A failure that is not about our extra fields still rejects, so the
     calling form keeps showing its own error message. */
  function submitForm(portalId, formGuid, fields, options) {
    var url = 'https://api.hsforms.com/submissions/v3/integration/submit/' + portalId + '/' + formGuid;
    var context = (options && options.context) || formContext();
    var extras = utmFields();

    function post(body) {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: body, context: context })
      });
    }

    return post(fields.concat(extras)).then(function (res) {
      if (res.ok) return res.json().catch(function () { return {}; });
      if (res.status === 400 && extras.length) {
        return post(fields).then(function (retry) {
          if (!retry.ok) throw new Error('Submission failed');
          return retry.json().catch(function () { return {}; });
        });
      }
      throw new Error('Submission failed');
    });
  }

  /* ---- Scheduler hand-off ---- */

  // Copy the campaign params onto the HubSpot meeting scheduler URL so the
  // booking is attributed to the same campaign as the form submission
  // (HubSpot reads them into the "… of last booking in meetings tool"
  // properties). Stored params are used when the current URL has none.
  function withUtms(url) {
    var params = utmParams();
    Object.keys(params).forEach(function (key) { url.searchParams.set(key, params[key]); });
    return url;
  }

  window.iboTracking = {
    hutk: hutk,
    utmParams: utmParams,
    utmFields: utmFields,
    firstTouch: firstTouch,
    lastTouch: lastTouch,
    withUtms: withUtms,
    formContext: formContext,
    submitForm: submitForm
  };
})();
