/* ==========================================================================
   IBO Advisors - /book on-site scheduler

   The page embeds the HubSpot meetings scheduler (State 1). When the iframe
   reports a booking through postMessage, the page hides the scheduler and
   shows its own confirmation (State 2): the time in the visitor's timezone,
   the one thing to do (accept the invitation), calendar fallbacks, and an
   optional note for Michael.

   HubSpot facts this relies on (verified in the build spike):
     - The portal is on NA2, so every message comes from
       https://meetings-na2.hubspot.com. Most published samples check
       meetings.hubspot.com and would never fire here.
     - HubSpot's embed script only auto-resizes the iframe for its own list of
       hosts, which does not include the NA2 host. The iframe does post
       {height: <px>} messages, so this script applies them itself.
     - HubSpot's "redirect after booking" setting must stay OFF: inside an
       embed it would navigate the whole page away from this confirmation.

   Every read of the HubSpot payload is guarded. If HubSpot changes its
   message format the page still confirms, with "Your time is in the
   invitation" in place of the date.
   ========================================================================== */
(function () {
  'use strict';

  // Google Ads "Meeting booked" conversion. Empty until the conversion action
  // exists in Google Ads; the GA4 meeting_booked event fires regardless.
  // Accepts the bare label or the full send_to ("AW-18411360561/<label>").
  var MEETING_BOOKED_CONVERSION_LABEL = '';
  var GOOGLE_ADS_ID = 'AW-18411360561';

  // Pre-call note. The note card is only rendered once the GUID is set: it is
  // the "Pre-call note" HubSpot form (fields: email, pre_call_note), which a
  // workflow forwards to Michael as an internal email and a task.
  var HUBSPOT_PORTAL_ID = '245308986';
  var PRECALL_NOTE_FORM_GUID = '';

  var HUBSPOT_ORIGIN = 'https://meetings-na2.hubspot.com';
  var STORAGE_KEY = 'ibo_booking';
  var CONTACT_EMAIL = 'michael@iboadvisors.com';
  var EVENT_TITLE = 'Call with Michael Chasen';
  var EVENT_DETAILS = 'Zoom link is in the invitation from ' + CONTACT_EMAIL + '.';
  var DEFAULT_MINUTES = 30;
  var MIN_FRAME_HEIGHT = 400;
  var MAX_FRAME_HEIGHT = 3000;

  var tracking = window.iboTracking || null;

  // GA4 / Google Ads helpers: the shared ones from /tracking.js, with a direct
  // gtag call only if /tracking.js failed to load.
  function track(name, params) {
    try {
      if (tracking && typeof tracking.track === 'function') tracking.track(name, params);
      else if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (e) {}
  }

  function fireConversion(sendTo) {
    try {
      if (tracking && typeof tracking.fireConversion === 'function') tracking.fireConversion(sendTo);
      else if (typeof window.gtag === 'function') window.gtag('event', 'conversion', { send_to: sendTo });
    } catch (e) {}
  }

  function $(id) { return document.getElementById(id); }

  var stateSchedule = $('book-state-schedule');
  var stateConfirmed = $('book-state-confirmed');
  if (!stateSchedule || !stateConfirmed) return;

  /* ------------------------------------------------------------------
     Entry source (modal, ibo-exit, calculator, pdf, email, direct)
     ------------------------------------------------------------------ */
  function entrySource() {
    try {
      var src = new URLSearchParams(window.location.search).get('src');
      if (src) {
        src = String(src).replace(/[^a-z0-9_.-]/gi, '').slice(0, 40).toLowerCase();
        if (src) return src;
      }
    } catch (e) {}
    return 'direct';
  }
  var SRC = entrySource();

  /* ------------------------------------------------------------------
     Session storage (a reload after booking shows the confirmation again)
     ------------------------------------------------------------------ */
  function saveBooking(booking) {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking)); } catch (e) {}
  }

  function loadBooking() {
    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var booking = JSON.parse(raw);
      if (!booking || typeof booking !== 'object') return null;
      // A tab left open long after the call should offer the scheduler again.
      if (isNum(booking.end) && booking.end < Date.now() - 12 * 3600000) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return booking;
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------
     Payload parsing. Reads only the fields it needs, every step guarded.
     ------------------------------------------------------------------ */
  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  function toMs(value) {
    if (isNum(value)) return value;
    if (typeof value === 'string' && /^\d{10,}$/.test(value)) return Number(value);
    if (typeof value === 'string' && value) {
      var t = Date.parse(value);
      if (isFinite(t)) return t;
    }
    return null;
  }

  function pick(obj, path) {
    var cur = obj;
    for (var i = 0; i < path.length; i++) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[path[i]];
    }
    return cur;
  }

  function str(value, limit) {
    return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, limit || 200) : '';
  }

  function parseBooking(data) {
    var response = pick(data, ['meetingsPayload', 'bookingResponse']) || {};
    var post = pick(response, ['postResponse']) || {};

    var start = toMs(pick(post, ['timerange', 'start']));
    var end = toMs(pick(post, ['timerange', 'end']));

    if (start === null) start = toMs(pick(response, ['event', 'dateTime']));
    if (start !== null && (end === null || end <= start)) {
      var duration = pick(response, ['event', 'duration']);
      // HubSpot sends the duration in milliseconds; tolerate minutes too.
      if (isNum(duration) && duration > 0) end = start + (duration <= 600 ? duration * 60000 : duration);
      else end = null;
    }

    var minutes = (start !== null && end !== null && end > start) ? Math.round((end - start) / 60000) : DEFAULT_MINUTES;
    if (start !== null && end === null) end = start + minutes * 60000;

    var contact = pick(post, ['contact']) || {};
    var email = str(contact.email, 254);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = '';

    return {
      start: start,
      end: end,
      minutes: minutes,
      firstName: str(contact.firstName, 100),
      lastName: str(contact.lastName, 100),
      email: email,
      bookedAt: Date.now()
    };
  }

  /* ------------------------------------------------------------------
     Formatting
     ------------------------------------------------------------------ */
  function formatWhen(booking) {
    if (!booking || !isNum(booking.start)) return null;
    try {
      if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return null;
      var d = new Date(booking.start);
      if (isNaN(d.getTime())) return null;
      var date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(d);
      var time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d);
      if (!date || !time) return null;
      return { date: date, time: time };
    } catch (e) {
      return null;
    }
  }

  /* ------------------------------------------------------------------
     Calendar fallbacks, all built from the parsed start/end
     ------------------------------------------------------------------ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // 20261009T200000Z
  function utcStamp(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }

  // 2026-10-09T20:00:00Z
  function isoNoMs(ms) {
    return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  function googleUrl(b) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(EVENT_TITLE).replace(/%20/g, '+') +
      '&dates=' + utcStamp(b.start) + '/' + utcStamp(b.end) +
      '&details=' + encodeURIComponent(EVENT_DETAILS);
  }

  function outlookUrl(host, b) {
    return 'https://' + host + '/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
      '&subject=' + encodeURIComponent(EVENT_TITLE) +
      '&startdt=' + encodeURIComponent(isoNoMs(b.start)) +
      '&enddt=' + encodeURIComponent(isoNoMs(b.end)) +
      '&body=' + encodeURIComponent(EVENT_DETAILS);
  }

  // RFC 5545 TEXT escaping.
  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function icsBody(b) {
    var uid = utcStamp(b.start) + '-' + Math.random().toString(36).slice(2, 10) + '@iboadvisors.com';
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IBO Advisors//Book//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + utcStamp(Date.now()),
      'DTSTART:' + utcStamp(b.start),
      'DTEND:' + utcStamp(b.end),
      'SUMMARY:' + icsText(EVENT_TITLE),
      'DESCRIPTION:' + icsText('Zoom link is in the invitation from ' + CONTACT_EMAIL),
      'END:VEVENT',
      'END:VCALENDAR',
      ''
    ].join('\r\n');
  }

  var icsUrl = null;

  function wireCalendarLinks(booking) {
    var google = $('book-cal-google');
    var outlook = $('book-cal-outlook');
    var outlookCom = $('book-cal-outlookcom');
    var ics = $('book-cal-ics');
    var links = [google, outlook, outlookCom, ics];
    var ok = booking && isNum(booking.start) && isNum(booking.end) && booking.end > booking.start;

    if (!ok) {
      // No time to put on a calendar: the invitation is the only source.
      var wrap = google && google.parentNode;
      if (wrap) wrap.hidden = true;
      var caption = document.querySelector('.bk-cal-caption');
      if (caption) caption.hidden = true;
      return;
    }

    try {
      google.href = googleUrl(booking);
      outlook.href = outlookUrl('outlook.office.com', booking);
      outlookCom.href = outlookUrl('outlook.live.com', booking);
      if (icsUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(icsUrl);
      icsUrl = URL.createObjectURL(new Blob([icsBody(booking)], { type: 'text/calendar;charset=utf-8' }));
      ics.href = icsUrl;
    } catch (e) {}

    links.forEach(function (a) {
      if (!a || a.getAttribute('data-wired')) return;
      a.setAttribute('data-wired', '1');
      a.addEventListener('click', function () {
        track('calendar_fallback_click', { provider: a.getAttribute('data-provider') || '' });
      });
    });
  }

  /* ------------------------------------------------------------------
     "I've accepted the invitation" (no network, GA4 only)
     ------------------------------------------------------------------ */
  function wireAccept() {
    var btn = $('book-accept');
    var card = $('book-accept-card');
    if (!btn || !card || btn.getAttribute('data-wired')) return;
    btn.setAttribute('data-wired', '1');
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var done = !card.classList.contains('is-done');
      card.classList.toggle('is-done', done);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      btn.textContent = done ? '\u2713 Accepted. See you on the call.' : label;
      if (done) track('invite_accept_click', { src: SRC });
    });
  }

  /* ------------------------------------------------------------------
     Pre-call note
     ------------------------------------------------------------------ */
  function wireNote(booking) {
    var card = $('book-note');
    if (!card) return;
    var canSend = !!PRECALL_NOTE_FORM_GUID && !!tracking && typeof tracking.submitForm === 'function';
    if (!canSend) { card.hidden = true; return; }
    card.hidden = false;
    if (card.getAttribute('data-wired')) return;
    card.setAttribute('data-wired', '1');

    var form = $('book-note-form');
    var text = $('book-note-text');
    var emailInput = $('book-note-email');
    var submit = $('book-note-submit');
    var errorEl = $('book-note-error');
    var sentEl = $('book-note-sent');

    // No email in the payload (should not happen): ask for it before sending.
    if (!booking.email) {
      emailInput.hidden = false;
      emailInput.required = true;
    }

    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      var note = String(text.value || '').trim().slice(0, 1000);
      var email = booking.email || String(emailInput.value || '').trim();
      if (!note) { showError('Write a note first, or skip this step.'); text.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Add your email so Michael knows who the note is from.');
        emailInput.hidden = false;
        emailInput.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Sending\u2026';
      var sending;
      try {
        sending = tracking.submitForm(HUBSPOT_PORTAL_ID, PRECALL_NOTE_FORM_GUID, [
          { name: 'email', value: email },
          { name: 'pre_call_note', value: note }
        ]);
      } catch (err) {
        sending = Promise.reject(err);
      }
      sending.then(function () {
        form.hidden = true;
        sentEl.hidden = false;
        track('precall_note_sent', { src: SRC, length: note.length });
      }).catch(function () {
        // Keep the text; give them a direct route.
        showError('Couldn\u2019t send. Email Michael directly at ' + CONTACT_EMAIL + '.');
        submit.disabled = false;
        submit.textContent = 'Send to Michael';
        track('precall_note_failed', { src: SRC });
      });
    });
  }

  /* ------------------------------------------------------------------
     State swap
     ------------------------------------------------------------------ */
  var confirmed = false;

  function renderConfirmation(booking, moveFocus) {
    confirmed = true;
    booking = booking || {};

    try {
      var when = formatWhen(booking);
      var dateEl = $('book-when-date');
      var timeEl = $('book-when-time');
      if (when) {
        dateEl.textContent = when.date;
        timeEl.textContent = when.time + '  \u00b7  ' + (booking.minutes || DEFAULT_MINUTES) + ' minutes';
        timeEl.hidden = false;
      } else {
        dateEl.textContent = 'Your time is in the invitation.';
        timeEl.hidden = true;
      }
      if (booking.email) $('book-email').textContent = booking.email;
    } catch (e) {}

    try { wireAccept(); } catch (e) {}
    try { wireCalendarLinks(booking); } catch (e) {}
    try { wireNote(booking); } catch (e) {}

    stateSchedule.hidden = true;
    stateConfirmed.hidden = false;

    if (moveFocus) {
      try { window.scrollTo(0, 0); } catch (e) {}
      var h1 = $('book-confirmed-title');
      if (h1) { try { h1.focus({ preventScroll: true }); } catch (e) { h1.focus(); } }
    }
  }

  function onBooked(data) {
    if (confirmed) return; // HubSpot may repeat the message; count the booking once.
    var booking;
    try { booking = parseBooking(data); } catch (e) { booking = { minutes: DEFAULT_MINUTES, bookedAt: Date.now() }; }

    var leadDays = isNum(booking.start) ? Math.max(0, Math.round((booking.start - Date.now()) / 86400000)) : null;
    var params = { src: SRC };
    if (leadDays !== null) params.lead_days = leadDays;
    track('meeting_booked', params);
    if (MEETING_BOOKED_CONVERSION_LABEL) {
      fireConversion(MEETING_BOOKED_CONVERSION_LABEL.indexOf('/') === -1
        ? GOOGLE_ADS_ID + '/' + MEETING_BOOKED_CONVERSION_LABEL
        : MEETING_BOOKED_CONVERSION_LABEL);
    }

    saveBooking(booking);
    renderConfirmation(booking, true);
  }

  function onFailed() {
    track('meeting_book_failed', { src: SRC });
    var alert = $('book-failed');
    if (alert) alert.hidden = false;
  }

  function resizeFrame(height) {
    if (!isNum(height)) return;
    var frame = document.querySelector('#book-scheduler iframe');
    if (!frame) return;
    var h = Math.max(MIN_FRAME_HEIGHT, Math.min(MAX_FRAME_HEIGHT, Math.round(height)));
    frame.style.height = h + 'px';
    // The container's reserved height only covers the wait for the iframe;
    // once HubSpot reports its own height, let the container follow it.
    var box = $('book-scheduler');
    if (box) box.style.minHeight = '0';
  }

  window.addEventListener('message', function (event) {
    try {
      if (!event || event.origin !== HUBSPOT_ORIGIN) return;
      var data = event.data;
      if (!data || typeof data !== 'object') return; // e.g. the "readyForConsentListener" string
      if (data.meetingBookSucceeded) { onBooked(data); return; }
      if (data.meetingBookFailed) { onFailed(); return; }
      if (typeof data.height === 'number') resizeFrame(data.height);
    } catch (e) {}
  });

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  var stored = loadBooking();
  if (stored) {
    renderConfirmation(stored, false);
  } else {
    track('scheduler_view', { src: SRC });
  }
})();
