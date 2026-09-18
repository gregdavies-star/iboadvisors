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
     - Writes last touch to the IBO Form * contact properties on every form
       submission, through the Forms API, with a fail-soft retry (see
       submitForm below).
     - Puts the same values on the meeting scheduler URL, as raw utm_* params
       and as the parallel IBO Meeting * properties, so the booking carries
       the campaign that produced it. Both sets share one IBO * UUID, so a
       form submission and the meeting it led to can be joined.

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

     Keys are this module's normalised attribution slots (see attribution()
     below), values are the *internal name* of the HubSpot contact property
     each one is written to. Every property here must exist on the contact
     object AND be present as a field on each HubSpot form the site submits to
     (HUBSPOT_FORM_GUID in modal.js / exit.js / calculator.js, and the message
     form in modal.js), or HubSpot rejects the field.

     Setting a slot to null stops it being sent while it is still captured and
     persisted — which is what `term` is: the portal has no "IBO Form Term"
     property, so utm_term is collected and carried to the scheduler but has
     nowhere to land on the contact. Create one and name it here if wanted.

     The two families are parallel by design. IBO Form * records the campaign
     that produced the form submission; IBO Meeting * records the campaign on
     the meeting booking that follows it, and is populated from the query
     string this module puts on the scheduler URL (see schedulerUrl). uuid is
     the same value in both, so a form submission and the meeting it led to
     can be joined.
     ------------------------------------------------------------------ */
  var HUBSPOT_FIELDS = {
    source: 'ibo_form_source',
    medium: 'ibo_form_medium',
    campaign: 'ibo_form_campaign',
    content: 'ibo_form_content',
    term: null,                          // no "IBO Form Term" property exists
    ad_id: 'ibo_form_ad_id',
    platform_id: 'ibo_form_platform_id',
    uuid: 'ibo_form_uuid',
    landing_url: 'ibo_form_landing_url',
    timestamp: 'ibo_form_timestamp'
  };

  var MEETING_FIELDS = {
    source: 'ibo_meeting_source',
    medium: 'ibo_meeting_medium',
    campaign: 'ibo_meeting_campaign',
    content: 'ibo_meeting_content',
    ad_id: 'ibo_meeting_ad_id',
    platform_id: 'ibo_meeting_platform_id',
    uuid: 'ibo_meeting_uuid',
    landing_url: 'ibo_meeting_landing_url',
    timestamp: 'ibo_meeting_timestamp'
  };

  // Properties HubSpot stores as a date rather than text. A HubSpot date
  // property takes a UNIX timestamp in milliseconds at *midnight UTC*; a full
  // ISO datetime is rejected, so toHubSpotDate below floors it.
  var DATE_SLOTS = { timestamp: true };

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  /* IBO Form Ad ID holds the shortened link the visitor clicked — one short
     link per ad, so the field says which ad produced the lead.

     The short link has to name itself in its own destination URL. There is no
     way to recover it afterwards: a shortener redirects with a 301, which
     drops the short URL from the address bar, and the referrer is no help
     either — the default referrer policy sends only the origin across an
     origin boundary, so document.referrer reads "https://bit.ly/" with the
     slug already stripped. That identifies the shortener, not the ad, so it
     is deliberately not used.

     So: give each short link a destination that carries its own slug in one
     of these params. First one present wins.

         https://bit.ly/ibo-q3-carousel
           -> https://www.iboadvisors.com/?utm_source=linkedin&...&sl=ibo-q3-carousel

     Add the param you actually use to this list if it is not one of these. */
  var AD_ID_KEYS = ['sl', 'short_link', 'shortlink', 'utm_ad_id', 'ad_id', 'utm_id'];

  /* IBO Form Platform ID holds the normalised name of the platform the click
     came from — "linkedin", "meta", "google" — not a raw identifier, so the
     field groups cleanly in HubSpot reports however the ad URLs were tagged.

     Resolved in order: the utm_source spelling, then the click ID the platform
     stamped on the URL, then the referring domain. A visitor from a LinkedIn
     ad reads "linkedin" whether the ad tagged utm_source=linkedin, li, or
     nothing at all. */
  var PLATFORM_BY_SOURCE = {
    linkedin: 'linkedin', 'linked-in': 'linkedin', li: 'linkedin', lnkd: 'linkedin',
    facebook: 'meta', fb: 'meta', instagram: 'meta', ig: 'meta', meta: 'meta',
    google: 'google', adwords: 'google', googleads: 'google', 'google-ads': 'google', youtube: 'google',
    bing: 'microsoft', microsoft: 'microsoft', msn: 'microsoft',
    tiktok: 'tiktok',
    twitter: 'x', x: 'x',
    reddit: 'reddit',
    pinterest: 'pinterest',
    email: 'email', newsletter: 'email'
  };

  // The identifiers the ad platforms stamp on a click, in place of or
  // alongside utm_*. Each one also identifies the platform it came from.
  var CLICK_ID_PLATFORMS = [
    { key: 'gclid', platform: 'google' },
    { key: 'wbraid', platform: 'google' },
    { key: 'gbraid', platform: 'google' },
    { key: 'fbclid', platform: 'meta' },
    { key: 'li_fat_id', platform: 'linkedin' },
    { key: 'msclkid', platform: 'microsoft' },
    { key: 'ttclid', platform: 'tiktok' },
    { key: 'twclid', platform: 'x' },
    { key: 'epik', platform: 'pinterest' },
    { key: 'rdt_cid', platform: 'reddit' }
  ];

  var PLATFORM_BY_REFERRER = {
    'linkedin.com': 'linkedin', 'lnkd.in': 'linkedin',
    'facebook.com': 'meta', 'instagram.com': 'meta', 'fb.com': 'meta',
    'google.com': 'google', 'youtube.com': 'google',
    'bing.com': 'microsoft',
    'tiktok.com': 'tiktok',
    'twitter.com': 'x', 'x.com': 'x', 't.co': 'x',
    'reddit.com': 'reddit',
    'pinterest.com': 'pinterest'
  };

  var CLICK_ID_KEYS = CLICK_ID_PLATFORMS.map(function (c) { return c.key; });

  var TRACKED_KEYS = UTM_KEYS.concat(AD_ID_KEYS, CLICK_ID_KEYS);

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
  function clean(value, limit) {
    return String(value).replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, limit || 255);
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

  // One id per campaign touch, written to IBO Form UUID on the submission and
  // to IBO Meeting UUID on the booking that follows, so the two rows join.
  function newUuid() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        var bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        var hex = [];
        for (var i = 0; i < 16; i++) hex.push((bytes[i] + 0x100).toString(16).slice(1));
        return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' +
          hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' + hex.slice(10).join('');
      }
    } catch (e) {}
    return 'ibo-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2, 10);
  }

  function touchFrom(params) {
    return {
      params: params,
      uuid: newUuid(),
      // The full landing URL, query string included — that is where the
      // campaign params were, so it is the row that explains the rest.
      landing_url: clean(window.location.href, 1000),
      referrer: document.referrer ? clean(document.referrer, 1000) : '',
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
  var currentTouch = null;

  if (!isEmpty(current)) {
    currentTouch = touchFrom(current);
    store.last = currentTouch;
    if (!store.first) store.first = currentTouch;
    writeStore(store);
  }

  function lastTouch() { return store.last || null; }
  function firstTouch() { return store.first || null; }

  // The touch a conversion should be attributed to: this page load if it
  // carries campaign params, else the stored last touch.
  function activeTouch() {
    return currentTouch || lastTouch();
  }

  // The raw campaign params for that touch.
  function utmParams() {
    var touch = activeTouch();
    return touch && touch.params ? touch.params : {};
  }

  function firstPresent(params, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (params[keys[i]]) return params[keys[i]];
    }
    return '';
  }

  // The host of a referrer URL, without "www.". '' when there isn't one.
  function referrerHost(referrer) {
    if (!referrer) return '';
    try {
      return new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  // The short link the visitor clicked, from the param its destination
  // carries. See AD_ID_KEYS for why there is no referrer fallback.
  function adIdFor(params) {
    return firstPresent(params, AD_ID_KEYS);
  }

  // The platform the click came from, normalised: utm_source spelling first,
  // then the click ID the platform stamped, then the referring domain.
  function platformFor(params, referrer) {
    var source = (params.utm_source || '').toLowerCase().replace(/[\s_]+/g, '');
    if (PLATFORM_BY_SOURCE[source]) return PLATFORM_BY_SOURCE[source];

    for (var i = 0; i < CLICK_ID_PLATFORMS.length; i++) {
      if (params[CLICK_ID_PLATFORMS[i].key]) return CLICK_ID_PLATFORMS[i].platform;
    }

    var host = referrerHost(referrer);
    if (PLATFORM_BY_REFERRER[host]) return PLATFORM_BY_REFERRER[host];
    // A source we have no mapping for is still better than nothing.
    return params.utm_source ? clean(params.utm_source).toLowerCase() : '';
  }

  /* The touch flattened into the slots the HubSpot properties expect.

     source / medium / campaign / content / term come straight from the
     matching utm_* param. ad_id is the short link that brought the visitor
     and platform_id the normalised platform name — see AD_ID_KEYS and
     PLATFORM_BY_SOURCE above for how each is resolved. uuid, landing_url and
     timestamp come from the touch itself. */
  function attribution() {
    var touch = activeTouch();
    if (!touch) return null;
    var p = touch.params || {};
    return {
      source: p.utm_source || '',
      medium: p.utm_medium || '',
      campaign: p.utm_campaign || '',
      content: p.utm_content || '',
      term: p.utm_term || '',
      ad_id: adIdFor(p),
      platform_id: platformFor(p, touch.referrer),
      uuid: touch.uuid || '',
      landing_url: touch.landing_url || '',
      timestamp: touch.timestamp || ''
    };
  }

  // HubSpot date properties take epoch milliseconds at midnight UTC. Anything
  // with a time component is rejected, so floor the day.
  function toHubSpotDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return String(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  // Flatten the attribution onto a {slot: property} map, as {name, value}
  // entries. Empty slots and unmapped slots are left out entirely rather than
  // written as blanks, so a direct visit never overwrites a contact's
  // existing campaign data with nothing.
  function fieldsFor(mapping) {
    var attr = attribution();
    var fields = [];
    if (!attr) return fields;
    Object.keys(mapping).forEach(function (slot) {
      var property = mapping[slot];
      if (!property) return;
      var value = attr[slot];
      if (!value) return;
      if (DATE_SLOTS[slot]) {
        value = toHubSpotDate(value);
        if (!value) return;
      }
      fields.push({ name: property, value: value });
    });
    return fields;
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

  // The attribution as HubSpot Forms API field entries (the IBO Form * set).
  function utmFields() {
    return fieldsFor(HUBSPOT_FIELDS);
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

  /* Put the attribution on the HubSpot meeting scheduler URL so the booking
     carries the same campaign as the form submission that produced it.

     Two things ride along, because HubSpot populates them by two different
     mechanisms:
       - the raw utm_* params, which HubSpot reads into its own built-in
         "… of last booking in meetings tool" properties with no configuration;
       - the ibo_meeting_* params, which prefill the matching custom questions
         on the scheduling page. Those only land if the property has been added
         as a field on the meeting's booking form in HubSpot — a param with no
         matching field is ignored, so this is safe either way.

     Stored params are used when the current URL has none, which is the normal
     case by the time someone reaches the scheduler. */
  function withUtms(url) {
    var params = utmParams();
    Object.keys(params).forEach(function (key) { url.searchParams.set(key, params[key]); });
    fieldsFor(MEETING_FIELDS).forEach(function (field) {
      url.searchParams.set(field.name, field.value);
    });
    return url;
  }

  window.iboTracking = {
    hutk: hutk,
    attribution: attribution,
    utmParams: utmParams,
    utmFields: utmFields,
    meetingFields: function () { return fieldsFor(MEETING_FIELDS); },
    firstTouch: firstTouch,
    lastTouch: lastTouch,
    withUtms: withUtms,
    formContext: formContext,
    submitForm: submitForm
  };
})();
