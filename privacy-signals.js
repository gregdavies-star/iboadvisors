/* IBO Advisors - Global Privacy Control handling.
 *
 * Loaded synchronously as the FIRST script in <head>, ahead of gtag.js, so it
 * can set Google Consent Mode defaults before the first hit fires and decide
 * whether the visitor-identification tags load at all. Do not add async or
 * defer to the tag that loads this file, and do not move it below the Google
 * tag - either one lets the first hit escape before consent state is set.
 *
 * This implements the commitment in /privacy section 8. Twelve states
 * (CA, CO, CT, DE, MD, MN, MT, NE, NH, NJ, OR, TX) require businesses subject
 * to their privacy laws to detect and act on this signal; a "Do Not Sell" link
 * on its own no longer satisfies them.
 *
 * Under GPC:
 *   IDPixel      visitor de-anonymization      not loaded at all
 *   Vaudit       marketing attribution pixel   not loaded at all
 *   Google Ads   ad storage / user data /
 *                personalization              denied (modeled conversions remain)
 *
 * Unaffected either way, because none of it is a "sale" or "share":
 *   GA4          first-party analytics
 *   HubSpot      tracking code, hubspotutk cookie, form attribution
 *   Every form on the site - a GPC visitor who submits one is still a lead,
 *   still lands in HubSpot, and can still be called, emailed and texted.
 */
(function () {
  'use strict';

  // Some implementations expose a string rather than a boolean, and very old
  // browsers have no navigator at all in odd embedding contexts. Absence of a
  // signal is not an opt-out, so anything other than a clear yes means no.
  var gpc = false;
  try {
    gpc = navigator.globalPrivacyControl === true ||
          navigator.globalPrivacyControl === 'true' ||
          navigator.globalPrivacyControl === '1';
  } catch (e) {
    gpc = false;
  }

  window.IBO_GPC = gpc;

  /* Google Consent Mode v2.
     gtag() must push the live `arguments` object, not an array - Google's
     library reads it by shape, and a plain array is silently ignored. The
     page's own gtag block redefines this function later over the same
     dataLayer, which is fine: the queue is what carries the state. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag('consent', 'default', {
    ad_storage: gpc ? 'denied' : 'granted',
    ad_user_data: gpc ? 'denied' : 'granted',
    ad_personalization: gpc ? 'denied' : 'granted',
    analytics_storage: 'granted'
  });

  // Everything below this line is opt-out scoped. Leave now and the
  // identification tags are never inserted into the document.
  if (gpc) return;

  function load(src, attrs) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) s.setAttribute(k, attrs[k]);
      }
    }
    document.head.appendChild(s);
  }

  // Vaudit - traffic quality and campaign measurement. The site's privacy
  // policy lists this under "Marketing and attribution" rather than security,
  // so it is suppressed under GPC to match what we published. If it is
  // reclassified as fraud prevention (a permitted business purpose that
  // survives an opt-out), move these two lines above the early return AND
  // update the table in /privacy section 2.
  window.vauditTracker = window.vauditTracker || {};
  window.vauditTracker['siteIdentifier'] = '1f19f6f1-7748-66ee-bc8d-77feb2d0bf32';
  load('https://pixel.vaudit.com/static/js/pixel.js');

  // IDPixel - resolves anonymous visits against a business identity graph.
  // This is the tag GPC most directly speaks to; it never loads for an
  // opted-out visitor.
  load('https://cdn.idpixel.app/v1/idp-analytics-6a7b58e4b22d8971ebdc12d0.min.js');
})();
