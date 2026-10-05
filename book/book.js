/* ==========================================================================
   IBO Advisors - /book on-site scheduler

   The page embeds the HubSpot meetings scheduler (State 1). When the iframe
   reports a booking through postMessage, the page hides the scheduler and
   shows its own confirmation (State 2): the time in the visitor's timezone,
   then the steps before the call (booked, accept the invitation with
   calendar fallbacks, and an optional note for the host).

   The scheduling page is a round robin between two partners. HubSpot's
   booking message names the organizer the meeting landed on
   (meetingsPayload.bookingResponse.postResponse.organizer); resolveHost()
   matches it against HOSTS below and every host-specific string on the
   confirmation comes from the matched entry.

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
  var PRECALL_NOTE_FORM_GUID = '';

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
      title: 'General Partner', // standing rule: General Partner only
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
      title: 'General Partner', // ASSUMED, to be confirmed by Greg
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

  var HUBSPOT_ORIGIN = 'https://meetings-na2.hubspot.com';
  var STORAGE_KEY = 'ibo_booking';
  var DEFAULT_MINUTES = 30;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (email && !EMAIL_RE.test(email)) email = '';

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
     Steps card: heading and progress follow the steps actually shown
     (2 without the note, 3 with it) and how many are done.
     ------------------------------------------------------------------ */
  var COUNT_WORDS = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four' };

  function updateProgress() {
    var steps = document.querySelectorAll('#book-steps-card .bk-step');
    var total = 0;
    var done = 0;
    var last = null;
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('is-last');
      if (steps[i].hidden) continue;
      total++;
      last = steps[i];
      if (steps[i].classList.contains('is-done')) done++;
    }
    if (last) last.classList.add('is-last'); // no rule under the last shown step
    if (!total) return;
    var title = $('book-steps-title');
    if (title) title.textContent = (COUNT_WORDS[total] || String(total)) + ' small ' + (total === 1 ? 'thing' : 'things') + ' before your call';
    var label = $('book-progress-label');
    if (label) label.textContent = done + ' of ' + total + ' done';
    var fill = $('book-progress-fill');
    if (fill) fill.style.width = (100 * done / total).toFixed(3) + '%';
    var bar = $('book-progress');
    if (bar) {
      bar.setAttribute('aria-valuemax', String(total));
      bar.setAttribute('aria-valuenow', String(done));
    }
  }

  /* ------------------------------------------------------------------
     "Accept the invitation" (no network, GA4 only). Marks step 2 done.
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
      btn.textContent = done ? 'Marked as accepted' : label;
      updateProgress();
      if (done) track('invite_accept_click', { src: SRC });
    });
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
        card.classList.add('is-done');
        updateProgress();
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

  // Name (a data-host node), "{title}.", the IBO Advisors wordmark, then the
  // credential lines. No title or no lines: that part is hidden.
  function renderCaption(host) {
    var title = $('book-host-title');
    if (title) {
      title.textContent = host.title ? host.title + '.' : '';
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

    try { wireAccept(); } catch (e) {}
    try { wireCalendarLinks(booking, host); } catch (e) {}
    try { wireNote(booking, host); } catch (e) {}
    try { updateProgress(); } catch (e) {}

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

    // The round-robin organizer. Logged once so the first real booking shows
    // which fields HubSpot actually sends.
    var organizer = pick(data, ['meetingsPayload', 'bookingResponse', 'postResponse', 'organizer']);
    try { if (window.console && console.debug) console.debug('[book] organizer', organizer); } catch (e) {}
    booking.host = resolveHost(organizer);

    var leadDays = isNum(booking.start) ? Math.max(0, Math.round((booking.start - Date.now()) / 86400000)) : null;
    var params = { src: SRC, host: booking.host.first ? booking.host.first.toLowerCase() : 'unknown' };
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
