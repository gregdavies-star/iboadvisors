/* ==========================================================================
   IBO Advisors - /book on-site scheduler

   Every scheduler hand-off on the site (the Learn More modal, /ibo-exit, the
   valuation calculator) and in the nurture emails lands here. There is no
   HubSpot iframe: the visitor books through our own picker over the HubSpot
   Scheduler API, so meeting starts are only ever on :00 or :30 and
   prospects over $10M EBITDA are offered Michael's calendar only:

     State 1   Pick a time, first, always: the same picker as
               /partnerschedule (time zone, days, times,
               month navigation), fed by
               GET /api/availability?timezone=&monthOffset=&band=&email=
               At Confirm, the time is booked straight away when first
               name, last name and email came with the hand-off and every
               required booking question is answered. Otherwise a compact
               "Your details" block opens under the chosen time (name,
               email, and only the required questions still unanswered),
               with a "Confirm booking" button. "Change" opens the same block.
     State 2   Confirmation, rendered from the POST /api/book response:
               the time in the visitor's time zone, then the steps before
               the call (booked, the calendar invitation with calendar
               fallbacks, and an optional note for the host).

   URL params: firstName, lastName, email (prefill); phone (the Learn More
   modal's cell number; answers a phone question); ebitda (the band
   submitted to HubSpot as what_is_your_approximate_annual_ebitda_profit,
   sent to both endpoints as `band`; it answers the EBITDA question when it
   is one of that question's options); src (modal, ibo-exit, calculator,
   pdf, email; else direct) for tracking.

   Availability is asked for with the visitor's email once it is known, so
   the server can route on the band stored on their HubSpot contact. A new
   email or EBITDA answer at Confirm re-checks the chosen time against the
   slots for those details before booking.

   The booking lands on Michael or Darren (round robin, or Michael only for
   the top bands). /api/book returns HubSpot's organizer; resolveHost()
   matches it against HOSTS below and every host-specific string on the
   confirmation comes from the matched entry.
   ========================================================================== */
(function () {
  'use strict';

  // The title of the calendar invitation HubSpot sends, as the visitor sees it
  // in their inbox. Shown in step 2 so they can find the right email.
  var MEETING_TITLE = 'Independent Buyout (IBO) Discussion';

  // Google Ads "Meeting booked" conversion. Empty until the conversion action
  // exists in Google Ads; the GA4 meeting_booked event fires regardless.
  // Accepts the bare label or the full send_to ("AW-18411360561/<label>").
  var MEETING_BOOKED_CONVERSION_LABEL = '';
  var GOOGLE_ADS_ID = 'AW-18411360561';

  // Pre-call note. The note card is only rendered once the GUID is set: it is
  // the "Pre-call note" HubSpot form (fields: email, pre_call_note,
  // pre_call_note_host), which a workflow forwards to the host as an internal
  // email and a task.
  var HUBSPOT_PORTAL_ID = '245308986';
  var PRECALL_NOTE_FORM_GUID = 'a86c0176-58e8-437b-9474-f38bddd0a0a0';

  // The round-robin hosts, keyed by lower-case email. userId is the HubSpot
  // owner/user id. Every host-specific string on the confirmation (name,
  // title, email, portrait, credentials) comes from here. An empty `lines`
  // array renders the caption without credentials; a missing portrait file
  // hides the image.
  var HOSTS = {
    'michael@iboadvisors.com': {
      userId: '88777593',
      name: 'Michael Chasen',
      first: 'Michael',
      title: 'Managing Partner', // standing rule: Managing Partner, never Founder
      email: 'michael@iboadvisors.com',
      portraitWebp: '/assets/founder-portrait.webp',
      portraitJpg: '/assets/founder-portrait.jpg',
      lines: [
        '25+ years building and selling companies.',
        '100+ M&A transactions.'
      ]
    },
    'darren@iboadvisors.com': {
      userId: '162759897',
      name: 'Darren Gleeman',
      first: 'Darren',
      title: 'Managing Partner', // standing rule: Managing Partner, never Founder
      email: 'darren@iboadvisors.com',
      portraitWebp: '/assets/darren-gleeman-portrait.webp',
      portraitJpg: '/assets/darren-gleeman-portrait.jpg',
      // Drawn from his MBO Ventures bio; awaiting Greg's confirmation.
      lines: [
        'Wharton-trained quant who built an early automated hedge fund.',
        'Advises owners on succession, buyouts and employee ownership.'
      ]
    }
  };
  var DEFAULT_HOST_EMAIL = 'michael@iboadvisors.com';

  // The key the old iframe /book used too. loadBooking() only accepts the
  // current shape (BOOKING_VERSION), so a booking an earlier version of this
  // page left in the tab is discarded rather than rendered.
  var STORAGE_KEY = 'ibo_booking';
  var BOOKING_VERSION = 2;
  var DEFAULT_MINUTES = 30;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var AVAILABILITY_URL = '/api/availability';
  var BOOK_URL = '/api/book';
  var MAX_MONTH_OFFSET = 6;

  // Every option of the HubSpot EBITDA property, which /api/availability and
  // /api/book accept as `band` ('$10M+', '$10M - $20M' and '$20M+' book
  // Michael only). The site's lead forms send the coarse '$0 - $3M',
  // '$3M - $10M' and '$10M+'; the scheduling link asks the finer FINE_BANDS.
  // Any other `ebitda` URL value is treated as unknown.
  var BANDS = ['$0 - $1M', '$1M - $3M', '$0 - $3M', '$3M - $5M', '$5M - $10M', '$3M - $10M', '$10M - $20M', '$20M+', '$10M+'];
  var FINE_BANDS = ['$0 - $3M', '$3M - $5M', '$5M - $10M', '$10M - $20M', '$20M+'];
  // The scheduling link's EBITDA question. The server answers it from the
  // band, so it is hidden when the known band is one of its options; a coarse
  // band ('$3M - $10M') asks it so the visitor picks the finer one.
  var EBITDA_QUESTION = 'what_is_your_approximate_annual_ebitda_profit';

  // US / Canada / Europe, plus the browser's own zone if it is not here.
  // Same list as /partnerschedule.
  var TIME_ZONES = [
    ['America/New_York', 'Eastern Time (New York)'],
    ['America/Chicago', 'Central Time (Chicago)'],
    ['America/Denver', 'Mountain Time (Denver)'],
    ['America/Phoenix', 'Arizona (Phoenix)'],
    ['America/Los_Angeles', 'Pacific Time (Los Angeles)'],
    ['America/Anchorage', 'Alaska (Anchorage)'],
    ['Pacific/Honolulu', 'Hawaii (Honolulu)'],
    ['America/Halifax', 'Atlantic Time (Halifax)'],
    ['America/St_Johns', 'Newfoundland (St. John’s)'],
    ['America/Toronto', 'Eastern Time (Toronto)'],
    ['America/Winnipeg', 'Central Time (Winnipeg)'],
    ['America/Edmonton', 'Mountain Time (Edmonton)'],
    ['America/Vancouver', 'Pacific Time (Vancouver)'],
    ['Europe/London', 'United Kingdom (London)'],
    ['Europe/Dublin', 'Ireland (Dublin)'],
    ['Europe/Lisbon', 'Portugal (Lisbon)'],
    ['Europe/Paris', 'Central Europe (Paris)'],
    ['Europe/Berlin', 'Central Europe (Berlin)'],
    ['Europe/Amsterdam', 'Central Europe (Amsterdam)'],
    ['Europe/Madrid', 'Central Europe (Madrid)'],
    ['Europe/Zurich', 'Central Europe (Zurich)'],
    ['Europe/Stockholm', 'Central Europe (Stockholm)'],
    ['Europe/Athens', 'Eastern Europe (Athens)'],
    ['Europe/Helsinki', 'Eastern Europe (Helsinki)']
  ];
  var DEFAULT_TZ = 'America/New_York';

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
      // Only a booking this version saved: a numeric start and end, and a host
      // with a name and an email. Anything else (the old iframe page's shape,
      // a hand-edited value) is dropped and the picker shows instead. So is a
      // tab left open long after the call.
      var valid = booking && typeof booking === 'object' &&
        booking.v === BOOKING_VERSION &&
        isNum(booking.start) && isNum(booking.end) && booking.end > booking.start &&
        booking.host && typeof booking.host === 'object' &&
        typeof booking.host.name === 'string' && booking.host.name &&
        typeof booking.host.email === 'string' && EMAIL_RE.test(booking.host.email) &&
        booking.end >= Date.now() - 12 * 3600000;
      if (!valid) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return booking;
    } catch (e) {
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (e2) {}
      return null;
    }
  }

  /* ------------------------------------------------------------------
     Value helpers. Every read of an API response is guarded.
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

  function str(value, limit) {
    return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, limit || 200) : '';
  }

  /* ------------------------------------------------------------------
     Host. Matches the organizer by email, then user id, then name; an
     organizer that matches no entry becomes a generic host built from the
     payload; no organizer at all means the default host. Never throws.
     ------------------------------------------------------------------ */
  function copyHost(h) {
    return {
      userId: h.userId || '',
      name: h.name,
      first: h.first,
      title: h.title || '',
      email: h.email,
      portraitWebp: h.portraitWebp || '',
      portraitJpg: h.portraitJpg || '',
      lines: (h.lines || []).slice()
    };
  }

  function defaultHost() { return copyHost(HOSTS[DEFAULT_HOST_EMAIL]); }

  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function resolveHost(organizer) {
    try {
      if (!organizer || typeof organizer !== 'object') return defaultHost();
      var key;

      var email = str(organizer.email, 254).toLowerCase();
      if (email && Object.prototype.hasOwnProperty.call(HOSTS, email)) return copyHost(HOSTS[email]);

      var userId = organizer.userId;
      if ((typeof userId === 'number' && isFinite(userId)) || (typeof userId === 'string' && userId)) {
        for (key in HOSTS) {
          if (Object.prototype.hasOwnProperty.call(HOSTS, key) && String(userId) === HOSTS[key].userId) return copyHost(HOSTS[key]);
        }
      }

      var firstName = str(organizer.firstName, 100);
      var lastName = str(organizer.lastName, 100);
      var fullName = str(organizer.fullName, 200);
      var joined = (firstName + ' ' + lastName).replace(/\s+/g, ' ').trim();
      var names = [joined.toLowerCase(), fullName.replace(/\s+/g, ' ').toLowerCase()];
      for (key in HOSTS) {
        if (!Object.prototype.hasOwnProperty.call(HOSTS, key)) continue;
        var hostName = HOSTS[key].name.toLowerCase();
        if ((names[0] && names[0] === hostName) || (names[1] && names[1] === hostName)) return copyHost(HOSTS[key]);
      }

      var validEmail = EMAIL_RE.test(email) ? email : '';
      var name = fullName || joined;
      if (!name && !validEmail) return defaultHost();
      // Only an email: use its local part ("pat" -> "Pat") so the copy still reads.
      if (!name) name = capitalise(validEmail.split('@')[0].split(/[._+-]/)[0]);
      return {
        userId: '',
        name: name,
        first: firstName || name.split(' ')[0],
        title: '',
        email: validEmail || DEFAULT_HOST_EMAIL,
        portraitWebp: '',
        portraitJpg: '',
        lines: []
      };
    } catch (e) {
      return defaultHost();
    }
  }

  // A host read back from sessionStorage. A known host is refreshed from HOSTS
  // (so an edit to the table applies on reload); anything else is re-cleaned.
  function storedHost(h) {
    try {
      if (!h || typeof h !== 'object') return defaultHost();
      var email = str(h.email, 254).toLowerCase();
      if (email && Object.prototype.hasOwnProperty.call(HOSTS, email)) return copyHost(HOSTS[email]);
      var name = str(h.name, 200);
      if (!name || !EMAIL_RE.test(email)) return defaultHost();
      return {
        userId: '',
        name: name,
        first: str(h.first, 100) || name.split(' ')[0],
        title: str(h.title, 100),
        email: email,
        portraitWebp: '',
        portraitJpg: '',
        lines: []
      };
    } catch (e) {
      return defaultHost();
    }
  }

  function eventTitle(host) { return 'Call with ' + host.name; }
  function eventDetails(host) { return 'Zoom link is in the invitation from ' + host.email + '.'; }
  function icsFilename(host) {
    var slug = String(host.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return 'call-with-' + (slug || 'ibo-advisors') + '.ics';
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
      // Calendar tile: "OCT" over "9".
      var month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d).replace(/\.$/, '').toUpperCase();
      var day = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(d);
      return { date: date, time: time, month: month, day: day };
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

  function googleUrl(b, host) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(eventTitle(host)).replace(/%20/g, '+') +
      '&dates=' + utcStamp(b.start) + '/' + utcStamp(b.end) +
      '&details=' + encodeURIComponent(eventDetails(host));
  }

  function outlookUrl(domain, b, host) {
    return 'https://' + domain + '/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
      '&subject=' + encodeURIComponent(eventTitle(host)) +
      '&startdt=' + encodeURIComponent(isoNoMs(b.start)) +
      '&enddt=' + encodeURIComponent(isoNoMs(b.end)) +
      '&body=' + encodeURIComponent(eventDetails(host));
  }

  // RFC 5545 TEXT escaping.
  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function icsBody(b, host) {
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
      'SUMMARY:' + icsText(eventTitle(host)),
      'DESCRIPTION:' + icsText('Zoom link is in the invitation from ' + host.email),
      'END:VEVENT',
      'END:VCALENDAR',
      ''
    ].join('\r\n');
  }

  var icsUrl = null;

  function wireCalendarLinks(booking, host) {
    var google = $('book-cal-google');
    var outlook = $('book-cal-outlook');
    var ics = $('book-cal-ics');
    var links = [google, outlook, ics];
    var ok = booking && isNum(booking.start) && isNum(booking.end) && booking.end > booking.start;

    if (!ok) {
      // No time to put on a calendar: the invitation is the only source.
      var wrap = $('book-cal');
      if (wrap) wrap.hidden = true;
      var caption = document.querySelector('.bk-cal-caption');
      if (caption) caption.hidden = true;
      return;
    }

    try {
      google.href = googleUrl(booking, host);
      outlook.href = outlookUrl('outlook.office.com', booking, host);
      ics.setAttribute('download', icsFilename(host));
      if (icsUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(icsUrl);
      icsUrl = URL.createObjectURL(new Blob([icsBody(booking, host)], { type: 'text/calendar;charset=utf-8' }));
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
     Steps card: the heading follows the steps actually shown
     (2 without the note, 3 with it).
     ------------------------------------------------------------------ */
  var COUNT_WORDS = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four' };

  function updateStepsHeading() {
    var steps = document.querySelectorAll('#book-steps-card .bk-step');
    var total = 0;
    var last = null;
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('is-last');
      if (steps[i].hidden) continue;
      total++;
      last = steps[i];
    }
    if (last) last.classList.add('is-last'); // no rule under the last shown step
    if (!total) return;
    var title = $('book-steps-title');
    if (title) title.textContent = (COUNT_WORDS[total] || String(total)) + ' small ' + (total === 1 ? 'thing' : 'things') + ' before your call';
  }

  /* ------------------------------------------------------------------
     Pre-call note
     ------------------------------------------------------------------ */
  function wireNote(booking, host) {
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
      if (!EMAIL_RE.test(email)) {
        showError('Add your email so ' + host.first + ' knows who the note is from.');
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
          { name: 'pre_call_note', value: note },
          { name: 'pre_call_note_host', value: host.email }
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
        showError('Couldn\u2019t send. Email ' + host.first + ' directly at ' + host.email + '.');
        submit.disabled = false;
        submit.textContent = 'Send to ' + host.first;
        track('precall_note_failed', { src: SRC });
      });
    });
  }

  /* ------------------------------------------------------------------
     State swap
     ------------------------------------------------------------------ */
  var confirmed = false;

  function setText(selector, text) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function hostLabel(host) {
    return host.name + (host.title ? ', ' + host.title : '') + ', IBO Advisors';
  }

  function renderPortrait(host) {
    var figure = $('book-host-figure');
    var picture = $('book-host-picture');
    var webp = $('book-host-webp');
    var img = $('book-host-img');
    var pair = figure && figure.parentNode;
    if (!figure || !picture || !img) return;

    // No portrait: drop the image and let the caption sit above the card.
    function noPortrait() {
      picture.hidden = true;
      if (pair && pair.classList) pair.classList.add('bk-pair--solo');
    }

    img.alt = hostLabel(host);
    var jpg = host.portraitJpg || host.portraitWebp;
    if (!jpg) { noPortrait(); return; }
    picture.hidden = false;
    if (pair && pair.classList) pair.classList.remove('bk-pair--solo');
    img.onerror = noPortrait; // a file that is not there yet
    if (webp) {
      if (host.portraitWebp) webp.setAttribute('srcset', host.portraitWebp);
      else webp.parentNode.removeChild(webp);
    }
    if (img.getAttribute('src') !== jpg) img.setAttribute('src', jpg);
  }

  // Name (a data-host node), the title, the IBO Advisors wordmark, then the
  // credential lines. No title or no lines: that part is hidden.
  function renderCaption(host) {
    var title = $('book-host-title');
    if (title) {
      title.textContent = host.title || '';
      title.hidden = !host.title;
    }
    var lines = $('book-host-lines');
    if (lines) {
      var text = host.lines && host.lines.length ? host.lines.join(' ') : '';
      lines.textContent = text;
      lines.hidden = !text;
    }
  }

  function renderHost(host) {
    setText('[data-host="name"]', host.name);
    setText('[data-host="first"]', host.first);
    setText('[data-host="email"]', host.email);
    setText('[data-host="title"]', host.title);
    setText('[data-meeting-title]', MEETING_TITLE);
    var links = document.querySelectorAll('[data-host-mailto]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', 'mailto:' + host.email);
      links[i].textContent = host.email;
    }
    var submit = $('book-note-submit');
    if (submit && !submit.disabled) submit.textContent = 'Send to ' + host.first;
    try { renderCaption(host); } catch (e) {}
    try { renderPortrait(host); } catch (e) {}
  }

  function renderConfirmation(booking, moveFocus) {
    confirmed = true;
    booking = booking || {};
    var host = storedHost(booking.host);

    try { renderHost(host); } catch (e) {}

    try {
      var when = formatWhen(booking);
      var tile = $('book-when-tile');
      var dateEl = $('book-when-date');
      var timeEl = $('book-when-time');
      var sepEl = $('book-when-sep');
      var bookedEl = $('book-booked-when');
      $('book-when-minutes').textContent = (booking.minutes || DEFAULT_MINUTES) + ' minutes';
      if (when) {
        $('book-when-month').textContent = when.month;
        $('book-when-day').textContent = when.day;
        tile.hidden = !(when.month && when.day);
        dateEl.textContent = when.date;
        timeEl.textContent = when.time;
        timeEl.hidden = false;
        sepEl.hidden = false;
        // "Thursday, October 9 at 4:00 PM EDT." with the time kept on one line.
        bookedEl.textContent = when.date + ' at ';
        var bookedTime = document.createElement('span');
        bookedTime.className = 'bk-nowrap';
        bookedTime.textContent = when.time + '.';
        bookedEl.appendChild(bookedTime);
      } else {
        tile.hidden = true;
        dateEl.textContent = 'Your time is in the invitation.';
        timeEl.hidden = true;
        sepEl.hidden = true;
        bookedEl.textContent = 'Your time is in the invitation.';
      }
    } catch (e) {}

    try { wireCalendarLinks(booking, host); } catch (e) {}
    try { wireNote(booking, host); } catch (e) {}
    try { updateStepsHeading(); } catch (e) {}

    stateSchedule.hidden = true;
    stateConfirmed.hidden = false;

    if (moveFocus) {
      try { window.scrollTo(0, 0); } catch (e) {}
      var h1 = $('book-confirmed-title');
      if (h1) { try { h1.focus({ preventScroll: true }); } catch (e) { h1.focus(); } }
    }
  }

  /* ------------------------------------------------------------------
     Visitor details, prefilled from the hand-off URL
     ------------------------------------------------------------------ */
  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ''; } catch (e) { return ''; }
  }
  function knownBand(b) { return BANDS.indexOf(b) !== -1 ? b : ''; }

  function validPhone(value) {
    if (!/^\+?[0-9\s().\-]+$/.test(value)) return false;
    var digits = value.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 15;
  }

  // The band from the hand-off. When the visitor answers the EBITDA question
  // (no band known, or a coarse one), that answer becomes the band.
  var URL_BAND = knownBand(str(param('ebitda'), 40));
  // The Learn More modal's cell number: answers the phone question.
  var URL_PHONE = (function () { var p = str(param('phone'), 30); return validPhone(p) ? p : ''; })();

  var details = {
    firstName: str(param('firstName'), 100),
    lastName: str(param('lastName'), 100),
    email: str(param('email'), 254),
    answers: {}
  };

  // The band /api/availability found on the HubSpot contact for this email
  // (bandSource 'contact'). It counts as known only for that email.
  var contactBand = { email: '', band: '' };
  function storedContactBand() {
    return contactBand.band && contactBand.email === details.email.toLowerCase() ? contactBand.band : '';
  }
  // A band the visitor does not need to be asked for.
  function givenBand() { return URL_BAND || storedContactBand(); }

  function currentBand() {
    return knownBand(details.answers[EBITDA_QUESTION] || '') || givenBand();
  }

  function detailsComplete() {
    return !!(details.firstName && details.lastName && EMAIL_RE.test(details.email));
  }

  function fieldError(input, message) {
    var el = $(input.id + '-error');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (el) { el.textContent = message; el.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (el) { el.textContent = ''; el.hidden = true; }
    }
  }

  /* ---- Booking questions ----
     `questions` stays null until the first availability response. Only the
     required ones count; the EBITDA one is answered by a known band that is
     one of its options, a phone question by the `phone` URL param.
     `forcedMissing` holds names /api/book reported missing (400
     missing_answers), asked even if availability did not list them. */
  var questions = null;
  var forcedMissing = [];
  var questionInputs = {}; // name -> input/select in the details block
  var asked = [];          // the questions the open details block shows

  function humanise(name) {
    var s = String(name || '').replace(/[_-]+/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Answer';
  }

  function cleanQuestion(q) {
    if (!q || typeof q !== 'object') return null;
    var name = str(q.name, 100);
    if (!name) return null;
    var type = q.type === 'phone' || q.type === 'select' ? q.type : 'text';
    // Options are { label, value }: show the label, send the value. A bare
    // string is tolerated as both.
    var options = [];
    if (Array.isArray(q.options)) {
      q.options.forEach(function (o) {
        var value = typeof o === 'string' ? str(o, 200) : o && typeof o === 'object' ? str(String(o.value == null ? '' : o.value), 200) : '';
        var label = typeof o === 'string' ? value : o && typeof o === 'object' ? str(o.label, 200) || value : '';
        if (value) options.push({ label: label, value: value });
      });
    }
    if (type === 'select' && !options.length) type = 'text';
    return { name: name, label: str(q.label, 200) || humanise(name), required: q.required !== false, type: type, options: options };
  }

  function isPhoneQuestion(q) {
    var n = q.name.toLowerCase();
    return q.type === 'phone' || n === 'mobilephone' || n === 'phone';
  }

  // URL prefill: the `phone` param answers any phone question.
  function applyPrefill() {
    if (!URL_PHONE) return;
    (questions || []).forEach(function (q) {
      if (isPhoneQuestion(q) && !details.answers[q.name] && forcedMissing.indexOf(q.name) === -1) details.answers[q.name] = URL_PHONE;
    });
  }

  // The server answers the EBITDA question from a known band that is one of
  // its options (or when it has no options), unless it has said otherwise
  // (400 missing_answers).
  function ebitdaAnsweredByBand(q) {
    var band = givenBand();
    if (!band || forcedMissing.indexOf(q.name) !== -1) return false;
    if (!q.options.length) return true;
    for (var i = 0; i < q.options.length; i++) if (q.options[i].value === band) return true;
    return false;
  }

  function neededQuestions() {
    var list = [];
    var seen = {};
    (questions || []).forEach(function (q) {
      if (!q.required || seen[q.name]) return;
      if (q.name === EBITDA_QUESTION && ebitdaAnsweredByBand(q)) return;
      seen[q.name] = true;
      list.push(q);
    });
    forcedMissing.forEach(function (name) {
      if (seen[name]) return;
      seen[name] = true;
      list.push(name === EBITDA_QUESTION
        ? { name: name, label: 'Approximate annual EBITDA (profit)', required: true, type: 'select', options: FINE_BANDS.map(function (b) { return { label: b, value: b }; }) }
        : { name: name, label: humanise(name), required: true, type: 'text', options: [] });
    });
    return list;
  }

  function unansweredQuestions() {
    return neededQuestions().filter(function (q) { return !str(details.answers[q.name] || '', 500); });
  }

  function needsDetails() { return !detailsComplete() || unansweredQuestions().length > 0; }

  /* ------------------------------------------------------------------
     Inline "Your details" block, under the chosen time. Shown at Confirm
     only when something is missing, or from "Change".
     ------------------------------------------------------------------ */
  var detailsForm = $('book-details-form');
  var detailsError = $('book-details-error');
  var detailsNotice = $('book-details-notice');
  var detailsSlot = $('book-details-slot');
  var questionsBox = $('book-questions');
  var F = { first: $('book-first'), last: $('book-last'), email: $('book-email') };

  function detailsOpen() { return !detailsForm.hidden; }

  // Keep what the visitor has typed before the inputs are rebuilt.
  function readDetailsInputs() {
    if (!detailsOpen()) return;
    details.firstName = str(F.first.value, 100);
    details.lastName = str(F.last.value, 100);
    details.email = str(F.email.value, 254);
    for (var name in questionInputs) {
      if (Object.prototype.hasOwnProperty.call(questionInputs, name)) {
        details.answers[name] = str(questionInputs[name].value, 500);
      }
    }
  }

  function renderQuestions() {
    questionsBox.innerHTML = '';
    questionInputs = {};
    asked.forEach(function (q, i) {
      var id = 'book-q-' + i;
      var wrap = document.createElement('div');
      wrap.className = 'ibo-field bk-details__full';
      var label = document.createElement('label');
      label.className = 'ibo-field__label';
      label.setAttribute('for', id);
      label.textContent = q.label;
      var input;
      if (q.type === 'select') {
        input = document.createElement('select');
        input.className = 'ibo-field__input ibo-field__select';
        var ph = document.createElement('option');
        ph.value = '';
        ph.textContent = 'Select…';
        ph.disabled = true;
        input.appendChild(ph);
        var current = details.answers[q.name] || '';
        var hasCurrent = false;
        q.options.forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = o.label;
          if (o.value === current) hasCurrent = true;
          input.appendChild(opt);
        });
        input.value = hasCurrent ? current : '';
      } else {
        input = document.createElement('input');
        input.className = 'ibo-field__input';
        input.type = q.type === 'phone' ? 'tel' : 'text';
        input.maxLength = q.type === 'phone' ? 30 : 500;
        if (q.type === 'phone') input.autocomplete = 'tel';
        input.value = details.answers[q.name] || '';
      }
      input.id = id;
      input.required = true;
      input.setAttribute('data-question', q.name);
      input.setAttribute('aria-describedby', id + '-error');
      var err = document.createElement('p');
      err.className = 'ibo-field__error bk-field-error';
      err.id = id + '-error';
      err.hidden = true;
      wrap.appendChild(label);
      wrap.appendChild(input);
      wrap.appendChild(err);
      questionsBox.appendChild(wrap);
      questionInputs[q.name] = input;
    });
  }

  // Opens the block with name, email and the required questions that are
  // still unanswered (a question answered inside the block stays shown).
  function openDetails(notice) {
    readDetailsInputs();
    var keep = {};
    asked.forEach(function (q) { keep[q.name] = true; });
    asked = neededQuestions().filter(function (q) {
      return keep[q.name] || !str(details.answers[q.name] || '', 500);
    });
    F.first.value = details.firstName;
    F.last.value = details.lastName;
    F.email.value = details.email;
    [F.first, F.last, F.email].forEach(function (input) { fieldError(input, ''); });
    renderQuestions();
    detailsError.hidden = true;
    if (notice) { detailsNotice.textContent = notice; detailsNotice.hidden = false; }
    else detailsNotice.hidden = true;
    detailsForm.hidden = false;
    renderWho();
    updateConfirm();
    // Focus the first field that needs something, else first name.
    var target = !details.firstName ? F.first : !details.lastName ? F.last : !EMAIL_RE.test(details.email) ? F.email : null;
    if (!target) {
      for (var i = 0; i < asked.length && !target; i++) {
        if (!str(details.answers[asked[i].name] || '', 500)) target = questionInputs[asked[i].name];
      }
    }
    target = target || F.first;
    try { target.focus({ preventScroll: true }); } catch (e) { try { target.focus(); } catch (e2) {} }
    try { detailsForm.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
  }

  function validateDetails() {
    var errors = [];
    function check(input, message) {
      fieldError(input, message || '');
      if (message) errors.push(input);
    }
    var first = str(F.first.value, 100);
    var last = str(F.last.value, 100);
    var email = str(F.email.value, 254);
    check(F.first, first ? '' : 'Enter your first name.');
    check(F.last, last ? '' : 'Enter your last name.');
    check(F.email, !email ? 'Enter your email address.' : !EMAIL_RE.test(email) ? 'That email address doesn’t look right.' : '');

    var answers = {};
    asked.forEach(function (q) {
      var input = questionInputs[q.name];
      if (!input) return;
      var value = str(input.value, 500);
      if (!value) check(input, q.type === 'select' ? 'Choose an option.' : 'Please answer this question.');
      else if (q.type === 'phone' && !validPhone(value)) check(input, 'That phone number doesn’t look right.');
      else check(input, '');
      answers[q.name] = value;
    });

    if (errors.length) {
      detailsError.textContent = errors.length === 1 ? 'Please fix the highlighted field.' : 'Please fix the highlighted fields.';
      detailsError.hidden = false;
      try { errors[0].focus(); } catch (e) {}
      return false;
    }
    detailsError.hidden = true;
    details.firstName = first;
    details.lastName = last;
    details.email = email;
    for (var k in answers) if (Object.prototype.hasOwnProperty.call(answers, k)) details.answers[k] = answers[k];
    return true;
  }

  // Enter in a field = the Confirm booking button.
  detailsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    onConfirm();
  });

  /* ------------------------------------------------------------------
     Pick a time (the /partnerschedule picker, bk-*): a month calendar on
     the left (open days clickable, closed days greyed, arrows page
     monthOffset, time zone select under it), start times on the right
     ------------------------------------------------------------------ */
  var tzSelect = $('book-tz');
  var picker = {
    tz: detectedTimeZone(),
    monthOffset: 0,
    slots: [],
    hasMore: false,
    days: [],
    dayKey: null,
    slot: null,
    req: 0,
    autoAdvanced: false,
    calendar: '',
    loadedKey: null, // tz|band|month of the slots on screen
    reqTz: null,     // zone, band and email of the request in flight
    reqBand: null,
    reqEmail: null,
    loading: false,
    // Slots by monthOffset for the current zone, band and email (loadedFor).
    // The calendar for a month draws from every loaded offset, so a day
    // HubSpot happens to list under a neighbouring offset is never lost.
    // Cleared when the zone, band or email changes.
    loaded: {},
    loadedFor: null
  };

  function validTimeZone(tz) {
    if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
  }

  function detectedTimeZone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (validTimeZone(tz)) return tz;
    } catch (e) {}
    return DEFAULT_TZ;
  }

  function tzShortName(tz, at) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(at || Date.now()));
      for (var i = 0; i < parts.length; i++) if (parts[i].type === 'timeZoneName') return parts[i].value;
    } catch (e) {}
    return '';
  }

  function buildTzSelect() {
    var detected = detectedTimeZone();
    var known = false;
    tzSelect.innerHTML = '';
    TIME_ZONES.forEach(function (z) { if (z[0] === detected) known = true; });
    var zones = known ? TIME_ZONES : [[detected, detected.replace(/_/g, ' ')]].concat(TIME_ZONES);
    zones.forEach(function (z) {
      var opt = document.createElement('option');
      opt.value = z[0];
      var abbr = tzShortName(z[0]);
      opt.textContent = z[1] + (abbr ? ' · ' + abbr : '') + (z[0] === detected ? ' \u00b7 yours' : '');
      tzSelect.appendChild(opt);
    });
    if (!validTimeZone(picker.tz)) picker.tz = detected;
    tzSelect.value = picker.tz;
    if (tzSelect.value !== picker.tz) { picker.tz = detected; tzSelect.value = detected; }
  }

  tzSelect.addEventListener('change', function () {
    if (!validTimeZone(tzSelect.value)) return;
    picker.tz = tzSelect.value;
    picker.monthOffset = 0;
    picker.autoAdvanced = false;
    picker.slot = null;
    picker.dayKey = null;
    picker.loaded = {};
    loadAvailability();
  });

  function fmt(ms, opts) {
    var o = { timeZone: picker.tz };
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    return new Intl.DateTimeFormat('en-US', o).format(new Date(ms));
  }

  function dayKey(ms) {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone: picker.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
  }

  function timeLabel(ms) { return fmt(ms, { hour: 'numeric', minute: '2-digit' }); }
  function longDate(ms) { return fmt(ms, { weekday: 'long', month: 'long', day: 'numeric' }); }

  function groupDays(slots) {
    var days = [];
    var byKey = {};
    slots.forEach(function (s) {
      var key = dayKey(s.start);
      if (!byKey[key]) {
        byKey[key] = { key: key, first: s.start, slots: [] };
        days.push(byKey[key]);
      }
      byKey[key].slots.push(s);
    });
    return days;
  }

  var statusBox = $('book-status');
  var statusText = $('book-status-text');
  var spinner = $('book-spinner');
  var retryBtn = $('book-retry');
  var timesWrap = $('book-times-wrap');
  var timesList = $('book-times');
  var timesDate = $('book-times-date');
  var calGrid = $('book-cal-grid');
  var calBody = $('book-cal-body');
  var calMonth = $('book-cal-month');
  var calNote = $('book-cal-note');
  var prevBtn = $('book-month-prev');
  var nextBtn = $('book-month-next');
  var confirmBtn = $('book-confirm');
  var bookError = $('book-failed');
  var pickerEl = $('book-picker');

  var MAIL_LINK = '<a href="mailto:michael@iboadvisors.com">michael@iboadvisors.com</a>';

  // The status replaces the times column only; the calendar stays put.
  function showStatus(kind, html) {
    statusBox.hidden = false;
    timesWrap.hidden = true;
    spinner.hidden = kind !== 'loading';
    retryBtn.hidden = kind !== 'error';
    statusText.innerHTML = html;
    pickerEl.setAttribute('aria-busy', kind === 'loading' ? 'true' : 'false');
  }

  function changeMonth(delta) {
    var next = picker.monthOffset + delta;
    if (next < 0 || next > MAX_MONTH_OFFSET) return;
    picker.monthOffset = next;
    picker.slot = null;
    picker.dayKey = null;
    loadAvailability();
  }
  prevBtn.addEventListener('click', function () { changeMonth(-1); });
  nextBtn.addEventListener('click', function () { changeMonth(1); });
  retryBtn.addEventListener('click', function () { loadAvailability(); });

  // Heading and lede follow whose calendar the slots are from. A team
  // (round-robin) calendar never names a host: HubSpot picks at booking time.
  function renderCalendarCopy() {
    var title = $('book-pick-title');
    var lede = $('book-pick-lede');
    if (picker.calendar === 'michael') {
      title.textContent = 'Pick a time on Michael’s calendar';
      lede.textContent = '30 minutes on Zoom with Michael Chasen, Managing Partner. Confidential. No preparation, no documents, no obligation.';
    } else {
      title.textContent = 'Pick a time for your call';
      lede.textContent = '30 minutes on Zoom with one of our partners. Confidential. No preparation, no documents, no obligation.';
    }
  }

  // The visitor's email once it is known: the server routes on the band
  // stored on their HubSpot contact, as /api/book does.
  function knownEmail() { return EMAIL_RE.test(details.email) ? details.email : ''; }

  function availabilityKey() { return picker.tz + '|' + currentBand() + '|' + knownEmail().toLowerCase() + '|' + picker.monthOffset; }

  // keepStart: re-select this start time if the new slots still have it.
  // after(found): called once the slots are on screen (found = that start
  // is still open). Neither is passed for an ordinary load.
  function loadAvailability(keepStart, after) {
    var req = ++picker.req;
    var band = currentBand();
    picker.slot = null;
    picker.loading = true;
    picker.loadedKey = null;
    picker.reqTz = picker.tz;
    picker.reqBand = band;
    var email = knownEmail();
    picker.reqEmail = email.toLowerCase();
    var offset = picker.monthOffset;
    var forKey = picker.tz + '|' + band + '|' + picker.reqEmail;
    if (picker.loadedFor !== forKey) { picker.loaded = {}; picker.loadedFor = forKey; }
    updateConfirm();
    renderCalendar(true);
    calNote.textContent = '';
    showStatus('loading', 'Loading open times&hellip;');
    var url = AVAILABILITY_URL + '?timezone=' + encodeURIComponent(picker.tz) + '&monthOffset=' + offset +
      (band ? '&band=' + encodeURIComponent(band) : '') +
      (email ? '&email=' + encodeURIComponent(email) : '');
    fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          if (!res.ok || !data || !Array.isArray(data.slots)) throw new Error('availability ' + res.status);
          return data;
        });
      })
      .then(function (data) {
        if (req !== picker.req) return; // a newer request (zone, month or band change) won
        picker.loading = false;
        picker.calendar = data.calendar === 'michael' ? 'michael' : 'team';
        renderCalendarCopy();
        // A band found on the contact means the EBITDA question is not asked.
        if (data.bandSource === 'contact' && knownBand(str(data.band, 40)) && email) {
          contactBand = { email: email.toLowerCase(), band: knownBand(str(data.band, 40)) };
        }

        // Required questions. questionsUnavailable means HubSpot did not say;
        // treat it as none (a missing answer comes back from /api/book).
        if (data.questionsUnavailable) {
          if (questions === null) questions = [];
        } else if (Array.isArray(data.questions)) {
          questions = data.questions.map(cleanQuestion).filter(Boolean);
        } else if (questions === null) {
          questions = [];
        }
        applyPrefill();

        var now = Date.now();
        picker.slots = data.slots.filter(function (s) {
          return s && isNum(s.start) && isNum(s.end) && s.end > s.start && s.start > now + 60000;
        });
        picker.loaded[offset] = picker.slots;
        picker.hasMore = !!data.hasMore;
        // An empty month with more to come: move on once, automatically.
        if (!picker.slots.length && picker.hasMore && picker.monthOffset < MAX_MONTH_OFFSET && !picker.autoAdvanced) {
          picker.autoAdvanced = true;
          picker.monthOffset++;
          loadAvailability(keepStart, after);
          return;
        }
        picker.loadedKey = availabilityKey();
        var found = null;
        if (isNum(keepStart)) {
          for (var i = 0; i < picker.slots.length; i++) if (picker.slots[i].start === keepStart) found = picker.slots[i];
          if (found) { picker.slot = found; picker.dayKey = dayKey(found.start); }
        }
        renderPicker();
        updateConfirm();
        if (after) after(!!found);
      })
      .catch(function () {
        if (req !== picker.req) return;
        picker.loading = false;
        if (after) { bookingInFlight = false; updateConfirm(); }
        renderCalendar(true);
        showStatus('error', 'Couldn&rsquo;t load the calendar. Try again, or write to ' + MAIL_LINK + ' and Michael will find a time with you.');
      });
  }

  /* ---- Month calendar ----
     monthOffset 0 is the current month in the chosen zone (as HubSpot counts
     it). Weekday and length of a calendar date do not depend on the zone, so
     the grid itself is laid out in UTC; only "which month is now" and the
     day each slot falls on (dayKey) use the zone. */
  function shownMonth() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: picker.tz, year: 'numeric', month: 'numeric' }).formatToParts(new Date());
    var y = 0, m = 0;
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'year') y = Number(parts[i].value);
      if (parts[i].type === 'month') m = Number(parts[i].value);
    }
    var index = y * 12 + (m - 1) + picker.monthOffset;
    return { year: Math.floor(index / 12), month: (index % 12) + 1 }; // month 1..12
  }

  function utcLabel(y, m, d, opts) {
    var o = { timeZone: 'UTC' };
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    return new Intl.DateTimeFormat('en-US', o).format(new Date(Date.UTC(y, m - 1, d)));
  }

  // Open days of the shown month, from every loaded offset: { key: day }.
  function daysForMonth(ym) {
    var prefix = ym.year + '-' + (ym.month < 10 ? '0' : '') + ym.month + '-';
    var seen = {};
    var slots = [];
    Object.keys(picker.loaded).forEach(function (off) {
      picker.loaded[off].forEach(function (s) {
        if (!seen[s.start]) { seen[s.start] = true; slots.push(s); }
      });
    });
    slots.sort(function (a, b) { return a.start - b.start; });
    var byKey = {};
    groupDays(slots).forEach(function (day) {
      if (day.key.indexOf(prefix) === 0) byKey[day.key] = day;
    });
    return byKey;
  }

  // Any loaded open day after the shown month (keeps the next arrow live
  // even if HubSpot's hasMore says otherwise).
  function hasLaterDays(ym) {
    var last = ym.year + '-' + (ym.month < 10 ? '0' : '') + ym.month + '-31';
    return Object.keys(picker.loaded).some(function (off) {
      return picker.loaded[off].some(function (s) { return dayKey(s.start) > last; });
    });
  }

  function renderCalendar(loading) {
    var ym = shownMonth();
    var open = loading ? {} : daysForMonth(ym);
    var monthName = utcLabel(ym.year, ym.month, 1, { month: 'long', year: 'numeric' });
    calMonth.textContent = monthName;
    calGrid.setAttribute('aria-label', monthName);
    prevBtn.disabled = picker.monthOffset <= 0;
    nextBtn.disabled = !(picker.monthOffset < MAX_MONTH_OFFSET && (picker.hasMore || hasLaterDays(ym)));

    var todayKey = dayKey(Date.now());
    var lead = new Date(Date.UTC(ym.year, ym.month - 1, 1)).getUTCDay();
    var length = new Date(Date.UTC(ym.year, ym.month, 0)).getUTCDate();
    calBody.innerHTML = '';
    var row = null;
    for (var cell = 0; cell < Math.ceil((lead + length) / 7) * 7; cell++) {
      if (cell % 7 === 0) { row = document.createElement('tr'); calBody.appendChild(row); }
      var td = document.createElement('td');
      row.appendChild(td);
      var d = cell - lead + 1;
      if (d < 1 || d > length) continue; // leading / trailing blank
      var key = ym.year + '-' + (ym.month < 10 ? '0' : '') + ym.month + '-' + (d < 10 ? '0' : '') + d;
      var day = open[key];
      var el;
      if (day) {
        el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('data-day', key);
        el.setAttribute('aria-pressed', key === picker.dayKey ? 'true' : 'false');
        el.setAttribute('aria-label', utcLabel(ym.year, ym.month, d, { weekday: 'long', month: 'long', day: 'numeric' }) +
          ', ' + day.slots.length + (day.slots.length === 1 ? ' time' : ' times') + ' open');
        el.addEventListener('click', onDayClick);
        el.addEventListener('keydown', onDayKey);
      } else {
        el = document.createElement('span');
        el.setAttribute('aria-label', utcLabel(ym.year, ym.month, d, { weekday: 'long', month: 'long', day: 'numeric' }) + ', no open times');
      }
      el.className = 'bk-calday' + (key === todayKey ? ' is-today' : '');
      if (key === todayKey) el.setAttribute('aria-current', 'date');
      el.textContent = String(d);
      td.appendChild(el);
    }
    return open;
  }

  function onDayClick(e) {
    var key = e.currentTarget.getAttribute('data-day');
    if (!key || key === picker.dayKey) return;
    picker.dayKey = key;
    picker.slot = null;
    renderPicker();
    updateConfirm();
    var again = calBody.querySelector('button[data-day="' + key + '"]');
    if (again) again.focus();
  }

  // Arrow keys move between open days (left/right one day, up/down a week,
  // skipping closed days in that direction).
  function onDayKey(e) {
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    var key = e.currentTarget.getAttribute('data-day');
    var d = Number(key.slice(8));
    var prefix = key.slice(0, 8);
    for (var n = d + step; n >= 1 && n <= 31; n += step) {
      var target = calBody.querySelector('button[data-day="' + prefix + (n < 10 ? '0' : '') + n + '"]');
      if (target) { target.focus(); return; }
    }
  }

  function renderPicker() {
    var open = renderCalendar(false);
    var keys = Object.keys(open).sort();
    picker.days = keys.map(function (k) { return open[k]; });
    if (!keys.length) {
      var monthName = calMonth.textContent;
      calNote.textContent = 'No open days in ' + monthName + '.';
      showStatus('empty', 'No open times ' + (picker.monthOffset ? 'in ' + monthName : 'in the next few weeks') +
        '. ' + (!nextBtn.disabled ? 'Try the next month, or w' : 'W') + 'rite to ' + MAIL_LINK + ' and Michael will find a time with you.');
      return;
    }
    calNote.textContent = '';
    // Keep the chosen day if it is still open, else the first open day.
    if (!open[picker.dayKey]) {
      picker.dayKey = keys[0];
      renderCalendar(false);
    }
    statusBox.hidden = true;
    pickerEl.setAttribute('aria-busy', 'false');
    timesWrap.hidden = false;
    renderTimes();
  }

  function renderTimes() {
    var day = null;
    for (var i = 0; i < picker.days.length; i++) if (picker.days[i].key === picker.dayKey) day = picker.days[i];
    timesList.innerHTML = '';
    if (!day) return;
    timesDate.textContent = longDate(day.first) + ' · ' + tzShortName(picker.tz, day.first);
    day.slots.forEach(function (s) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'bk-time';
      b.textContent = timeLabel(s.start);
      b.setAttribute('aria-pressed', picker.slot && picker.slot.start === s.start ? 'true' : 'false');
      b.addEventListener('click', function () {
        picker.slot = s;
        var buttons = timesList.querySelectorAll('.bk-time');
        for (var k = 0; k < buttons.length; k++) buttons[k].setAttribute('aria-pressed', buttons[k] === b ? 'true' : 'false');
        bookError.hidden = true;
        updateConfirm();
        // On a phone the Confirm button sits below the times: bring it into view.
        try {
          var r = confirmBtn.getBoundingClientRect();
          if (r.bottom > window.innerHeight) confirmBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } catch (e) {}
      });
      li.appendChild(b);
      timesList.appendChild(li);
    });
  }

  function slotLabel(ms) {
    return longDate(ms) + ' at ' + timeLabel(ms) + ' ' + tzShortName(picker.tz, ms);
  }

  var bookingInFlight = false;

  // One button: "Confirm <time>" while the details are known, "Confirm
  // booking" once the inline details block is open.
  function updateConfirm() {
    if (picker.slot) detailsSlot.textContent = 'Your time: ' + slotLabel(picker.slot.start) + '.';
    else detailsSlot.textContent = 'Choose a time above.';
    if (bookingInFlight || confirmed) return;
    if (picker.slot) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = detailsOpen() ? 'Confirm booking' : 'Confirm ' + slotLabel(picker.slot.start);
    } else {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Choose a time';
    }
  }

  // "Booking for Pat Owner · pat@example.com · Change", above the picker,
  // while the details are known and the block is closed.
  function renderWho() {
    $('book-who-name').textContent = (details.firstName + ' ' + details.lastName).trim();
    $('book-who-email').textContent = details.email;
    $('book-who').hidden = !detailsComplete() || detailsOpen();
  }

  $('book-change').addEventListener('click', function () {
    openDetails();
  });

  function showBookError(html) {
    bookError.innerHTML = html;
    bookError.hidden = false;
  }

  var FAILED_HTML = 'That booking didn&rsquo;t go through. Write to ' + MAIL_LINK + ' and Michael will find a time with you.';

  confirmBtn.addEventListener('click', function () { onConfirm(); });

  function onConfirm() {
    if (!picker.slot || bookingInFlight || confirmed) return;
    bookError.hidden = true;
    if (detailsOpen()) {
      if (!validateDetails()) return;
    } else if (needsDetails()) {
      openDetails();
      return;
    }
    // A new email or an EBITDA answer can move the visitor to another
    // calendar: check the chosen time against the slots for the new details
    // first, and book it straight away if it is still open.
    if (picker.loadedKey !== availabilityKey()) {
      var start = picker.slot.start;
      bookingInFlight = true;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Checking the time…';
      // Recheck the month on screen (the chosen time is in it); no auto-advance.
      picker.autoAdvanced = true;
      loadAvailability(start, function (found) {
        bookingInFlight = false;
        if (found && !needsDetails()) { book(); return; }
        updateConfirm();
        if (!found) {
          showBookError(picker.calendar === 'michael'
            ? 'That time isn&rsquo;t open on Michael&rsquo;s calendar. Pick another time above.'
            : 'That time is no longer open. Pick another time above.');
        } else {
          openDetails();
        }
      });
      return;
    }
    book();
  }

  function book() {
    var slot = picker.slot;
    var band = currentBand();
    bookingInFlight = true;
    bookError.hidden = true;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking…';

    var answers = {};
    neededQuestions().forEach(function (q) {
      if (details.answers[q.name]) answers[q.name] = details.answers[q.name];
    });
    var body = {
      startTime: slot.start,
      timezone: picker.tz,
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email
    };
    if (band) body.band = band;
    if (Object.keys(answers).length) body.answers = answers;

    fetch(BOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    }).then(function (r) {
      bookingInFlight = false;
      if (r.ok && r.data && r.data.ok) {
        onBooked(slot, r.data, band);
        return;
      }
      var code = r.data && r.data.error;
      track('meeting_book_failed', { src: SRC, reason: code || String(r.status) });
      if (r.status === 409 || code === 'slot_unavailable') {
        showBookError('That time was just taken. Here are the latest open times; pick another.');
        loadAvailability();
      } else if (r.status === 504 || code === 'upstream_timeout') {
        showBookError('We couldn&rsquo;t confirm the booking in time. It may still have gone through: check your inbox for the invitation before trying again, or write to ' + MAIL_LINK + '.');
        updateConfirm();
      } else if (code === 'missing_answers') {
        var missing = Array.isArray(r.data.missing) ? r.data.missing.map(function (n) { return str(n, 100); }).filter(Boolean) : [];
        missing.forEach(function (n) {
          if (forcedMissing.indexOf(n) === -1) forcedMissing.push(n);
          delete details.answers[n];
        });
        openDetails('One more detail before we can book ' + slotLabel(slot.start) + '.');
      } else {
        showBookError(FAILED_HTML);
        updateConfirm();
      }
    }).catch(function () {
      bookingInFlight = false;
      track('meeting_book_failed', { src: SRC, reason: 'network' });
      showBookError(FAILED_HTML);
      updateConfirm();
    });
  }

  function onBooked(slot, data, band) {
    var hs = data.hubspot && typeof data.hubspot === 'object' ? data.hubspot : {};
    var start = toMs(data.start);
    if (start === null) start = toMs(hs.start);
    if (start === null) start = slot.start;
    var end = toMs(data.end);
    if (end === null) end = toMs(hs.end);
    if (end === null || end <= start) end = isNum(slot.end) && slot.end > start ? slot.end : start + DEFAULT_MINUTES * 60000;

    var organizer = hs.organizer;
    try { if (window.console && console.debug) console.debug('[book] organizer', organizer); } catch (e) {}

    var booking = {
      v: BOOKING_VERSION,
      start: start,
      end: end,
      minutes: Math.round((end - start) / 60000) || DEFAULT_MINUTES,
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email,
      calendar: data.calendar === 'michael' || data.calendar === 'team' ? data.calendar : picker.calendar,
      band: knownBand(str(data.band, 40)) || band || '',
      host: resolveHost(organizer),
      bookedAt: Date.now()
    };

    var leadDays = Math.max(0, Math.round((start - Date.now()) / 86400000));
    track('meeting_booked', {
      src: SRC,
      host: booking.host.first ? booking.host.first.toLowerCase() : 'unknown',
      lead_days: leadDays,
      calendar: booking.calendar || 'unknown',
      band: booking.band || 'unknown'
    });
    if (MEETING_BOOKED_CONVERSION_LABEL) {
      fireConversion(MEETING_BOOKED_CONVERSION_LABEL.indexOf('/') === -1
        ? GOOGLE_ADS_ID + '/' + MEETING_BOOKED_CONVERSION_LABEL
        : MEETING_BOOKED_CONVERSION_LABEL);
    }

    forcedMissing = [];
    saveBooking(booking);
    renderConfirmation(booking, true);
  }

  /* ------------------------------------------------------------------
     Start: the picker first, always (the same flow the old HubSpot embed had).
     ------------------------------------------------------------------ */
  var stored = loadBooking();
  if (stored) {
    renderConfirmation(stored, false);
  } else {
    buildTzSelect();
    renderCalendarCopy();
    renderWho();
    track('scheduler_view', { src: SRC, band: currentBand() || 'unknown' });
    loadAvailability();
  }
})();


/* ==========================================================================
   Mobile navigation toggle
   /book shows the full site header but does not load modal.js (which also
   fires conversions on timers), so this reproduces modal.js's menu toggle:
   the ☰ button opens a dropdown panel with the nav links plus the Learn More
   CTA (moved into the links container while open, restored on close), keeps
   aria-expanded in step, and closes on a link tap, Escape, or a resize back
   to the desktop bar.
   ========================================================================== */
(function () {
  'use strict';
  var nav = document.querySelector('.site-header .nav');
  if (!nav) return;
  var toggle = nav.querySelector('.nav-toggle');
  var links = nav.querySelector('.nav__links');
  var cta = nav.querySelector('.nav__cta');
  if (!toggle || !links) return;

  if (!links.id) links.id = 'primary-nav';
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-expanded', 'false');

  function isOpen() { return nav.classList.contains('nav-open'); }

  function open() {
    if (cta) links.appendChild(cta);
    nav.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  }

  function close() {
    if (cta && cta.parentElement === links) nav.insertBefore(cta, toggle);
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) close(); else open();
  });

  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && isOpen()) close();
  });
})();
