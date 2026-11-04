/* ==========================================================================
   IBO Advisors - /partnerschedule (referral partners book for a client)

   Michael emails this link to advisors, bankers and CPAs. The PARTNER fills
   it in for their client, so every line of copy talks to the partner about
   "your client". Three states:

     1. Form. The prospective client (name, email, revenue, EBITDA) and the
        partner (name, email, optional cell). The client's cell and industry
        are no longer asked: Greg made both optional on Michael's "IBO
        Discussion" scheduling page (Nov 2026), whose only required booking
        question is now the EBITDA band. On Next the lead
        goes to HubSpot through the Forms API (window.iboTracking.submitForm,
        which adds the IBO Form * attribution fields and retries without
        enrichment on a 400). A failed submission keeps the partner on the
        form with an error: the lead is never dropped silently. The client is
        the contact; the partner is stored on it as Referring Partner * and
        is NOT submitted as a contact of their own.
     2. Pick a time. Our own picker over /api/partner-availability (Michael's
        "IBO Discussion" page, 30 minutes), in a time zone the partner can
        change: a month calendar (open days clickable, the rest greyed; the
        arrows page HubSpot's monthOffset 0..6) beside the start times for
        the selected day. Confirm -> POST /api/partner-book, which books the
        client as the booker and the partner as a guest; HubSpot sends both
        the invitation and the reminders.
     3. Confirmation, modelled on /book: date block, Michael's portrait, the
        steps (booked, accept the invitation with calendar fallbacks, an
        optional note to Michael). Saved in sessionStorage so a reload shows
        it again.

   Standing rules that shape this page (CLAUDE.md): Michael is Managing
   Partner, never Founder; the call is 30 minutes; the confirmation never
   asks where the call will be taken or for a rescheduling commitment, and
   the optional note goes to Michael and the CRM, never to the client.

   EBITDA control: a text input with a listbox of $3M, $4M ... $50M and
   "Over $50M". Whatever the partner types is parsed by parseMoney() (shared
   with revenue) and snapped, live, to the nearest $1M option. Under $3M
   blocks Next. See the "Money" section below for the exact rules.

   No Google Ads conversions here; GA4 events only (partner_*), each with src.
   ========================================================================== */
(function () {
  'use strict';

  // "IBO Partner Referral Form (via API)" in HubSpot (portal 245308986).
  // If this is ever emptied the page still shows the form but will not
  // submit it: the partner is told the form is not live yet and to email
  // Michael (fails closed, like the message form in /modal.js).
  var HUBSPOT_FORM_GUID = '03c60df3-5ed8-4984-91bd-e4a4cf9dffba';
  var HUBSPOT_PORTAL_ID = '245308986';
  // "Pre-call note" form (fields email, pre_call_note, pre_call_note_host); a
  // workflow forwards each note to the host. Empty hides the note step.
  var PRECALL_NOTE_FORM_GUID = 'a86c0176-58e8-437b-9474-f38bddd0a0a0';

  // Michael only: this page books his personal "IBO Discussion" link, so
  // there is no round robin and no HOSTS table. Title per standing rule 1.
  var HOST = {
    name: 'Michael Chasen',
    first: 'Michael',
    title: 'Managing Partner',
    email: 'michael@iboadvisors.com'
  };
  // The calendar invitation's title, as it appears in the inbox (verified on
  // the first test booking, 3 Nov 2026: hs_meeting_title on the record).
  var MEETING_TITLE = 'Independent Buyout Discussion (IBO) with Michael Chasen';
  var MINUTES = 30;

  var AVAILABILITY_URL = '/api/partner-availability';
  var BOOK_URL = '/api/partner-book';
  var BOOKING_KEY = 'ibo_partner_booking';
  var LEAD_KEY = 'ibo_partner_lead';
  var MAX_MONTH_OFFSET = 6;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var BELOW_MIN_MESSAGE = 'The Independent Buyout works from about $3M in annual EBITDA. Enter $3M or more.';

  // US / Canada / Europe, plus the browser's own zone if it is not here.
  var TIME_ZONES = [
    ['America/New_York', 'Eastern Time (New York)'],
    ['America/Chicago', 'Central Time (Chicago)'],
    ['America/Denver', 'Mountain Time (Denver)'],
    ['America/Phoenix', 'Arizona (Phoenix)'],
    ['America/Los_Angeles', 'Pacific Time (Los Angeles)'],
    ['America/Anchorage', 'Alaska (Anchorage)'],
    ['Pacific/Honolulu', 'Hawaii (Honolulu)'],
    ['America/Halifax', 'Atlantic Time (Halifax)'],
    ['America/St_Johns', 'Newfoundland (St. John\u2019s)'],
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

  function $(id) { return document.getElementById(id); }

  var stateForm = $('ps-state-form');
  var statePick = $('ps-state-pick');
  var stateConfirmed = $('ps-state-confirmed');
  if (!stateForm || !statePick || !stateConfirmed) return;

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */
  function track(name, params) {
    try {
      var p = params || {};
      p.src = SRC;
      if (tracking && typeof tracking.track === 'function') tracking.track(name, p);
      else if (typeof window.gtag === 'function') window.gtag('event', name, p);
    } catch (e) {}
  }

  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  function str(value, limit) {
    return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit || 200) : '';
  }

  function setText(selector, text) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function storageGet(key) {
    try {
      var raw = window.sessionStorage.getItem(key);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && typeof v === 'object' ? v : null;
    } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function storageRemove(key) {
    try { window.sessionStorage.removeItem(key); } catch (e) {}
  }

  function entrySource() {
    try {
      var src = new URLSearchParams(window.location.search).get('src');
      if (src) {
        src = String(src).replace(/[^a-z0-9_.-]/gi, '').slice(0, 40).toLowerCase();
        if (src) return src;
      }
    } catch (e) {}
    return 'partner-email';
  }
  var SRC = entrySource();

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

  function showState(which) {
    stateForm.hidden = which !== 'form';
    statePick.hidden = which !== 'pick';
    stateConfirmed.hidden = which !== 'confirmed';
  }

  function focusHeading(id) {
    try { window.scrollTo(0, 0); } catch (e) {}
    var h = $(id);
    if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
  }

  /* ------------------------------------------------------------------
     Money. One parser for revenue and EBITDA.

     parseMoney(text) -> whole dollars, or null if it is not an amount.
       - "$", commas, spaces and "usd" are ignored; "over" / a trailing "+"
         are ignored too, so "Over $50M" and "50+" still read as amounts.
       - A suffix sets the unit: k / thousand = x1,000; m / mm / mn / mil /
         million(s) = x1,000,000; b / bn / billion(s) = x1,000,000,000.
       - A bare number under 1,000 means millions ("7", "7.4", "12.5");
         1,000 and up means dollars ("7400000", "7,400,000").
     ------------------------------------------------------------------ */
  var MONEY_RE = /^(\d+(?:\.\d*)?|\.\d+)(k|thousand|m|mm|mn|mil|mill|million|millions|b|bn|billion|billions)?$/;

  function parseMoney(text) {
    var s = String(text == null ? '' : text).toLowerCase()
      .replace(/usd|us\$/g, '').replace(/[$,\s]/g, '')
      .replace(/^over/, '').replace(/\+$/, '');
    var m = s.match(MONEY_RE);
    if (!m) return null;
    var n = parseFloat(m[1]);
    if (!isFinite(n)) return null;
    var unit = m[2] || '';
    var mult;
    if (!unit) mult = n < 1000 ? 1e6 : 1;
    else if (unit === 'k' || unit === 'thousand') mult = 1e3;
    else if (unit.charAt(0) === 'b') mult = 1e9;
    else mult = 1e6;
    var dollars = Math.round(n * mult);
    return isFinite(dollars) ? dollars : null;
  }

  function formatDollars(n) {
    try { return '$' + Math.round(n).toLocaleString('en-US'); } catch (e) { return '$' + Math.round(n); }
  }

  // 7400000 -> "$7.4M", 250000 -> "$250K", 1.2e9 -> "$1.2B"
  function formatShort(n) {
    function trim(x) { return String(Math.round(x * 10) / 10).replace(/\.0$/, ''); }
    if (n >= 1e9) return '$' + trim(n / 1e9) + 'B';
    if (n >= 1e6) return '$' + trim(n / 1e6) + 'M';
    if (n >= 1e3) return '$' + trim(n / 1e3) + 'K';
    return '$' + Math.round(n);
  }

  /* ------------------------------------------------------------------
     EBITDA options and mapping.
       options[0..47]  = $3M ... $50M  (millions 3..50)
       options[48]     = Over $50M
     Typed amount -> round to the nearest $1M:
       < 3     -> blocked (BELOW_MIN_MESSAGE)
       3 .. 50 -> that option; exact_annual_ebitda = millions x 1,000,000
       > 50    -> Over $50M;    exact_annual_ebitda = the typed rounded amount
     "Over $50M" chosen from the list (no amount typed) -> 51,000,000.
     Band for what_is_your_approximate_annual_ebitda_profit:
       3-4 "$3M - $5M", 5-9 "$5M - $10M", 10-19 "$10M - $20M", 20+ "$20M+".
     ------------------------------------------------------------------ */
  var EBITDA_MIN = 3;
  var EBITDA_MAX = 50;
  var OVER_INDEX = EBITDA_MAX - EBITDA_MIN + 1; // 48
  var OVER_DEFAULT_MILLIONS = 51;
  var EBITDA_OPTIONS = (function () {
    var list = [];
    for (var m = EBITDA_MIN; m <= EBITDA_MAX; m++) list.push({ millions: m, label: '$' + m + 'M' });
    list.push({ millions: null, label: 'Over $' + EBITDA_MAX + 'M' });
    return list;
  })();

  function ebitdaBand(millions) {
    if (millions < 5) return '$3M - $5M';
    if (millions < 10) return '$5M - $10M';
    if (millions < 20) return '$10M - $20M';
    return '$20M+';
  }

  // Text -> { status: 'empty' | 'invalid' | 'below' | 'ok', index, millions, exact, typed }
  function readEbitda(text) {
    var t = String(text || '').trim();
    if (!t) return { status: 'empty', index: -1 };
    // The list's own label for Over $50M: no amount typed.
    if (t.toLowerCase().replace(/\s+/g, '') === EBITDA_OPTIONS[OVER_INDEX].label.toLowerCase().replace(/\s+/g, '')) {
      return { status: 'ok', index: OVER_INDEX, millions: OVER_DEFAULT_MILLIONS, exact: OVER_DEFAULT_MILLIONS * 1e6, typed: null };
    }
    var dollars = parseMoney(t);
    if (dollars === null) return { status: 'invalid', index: -1 };
    var millions = Math.round(dollars / 1e6);
    if (millions < EBITDA_MIN) return { status: 'below', index: -1, typed: dollars, millions: millions };
    if (millions > EBITDA_MAX) return { status: 'ok', index: OVER_INDEX, millions: millions, exact: millions * 1e6, typed: dollars };
    return { status: 'ok', index: millions - EBITDA_MIN, millions: millions, exact: millions * 1e6, typed: dollars };
  }

  /* ------------------------------------------------------------------
     Form fields and errors
     ------------------------------------------------------------------ */
  var form = $('ps-form');
  var formError = $('ps-form-error');
  var submitBtn = $('ps-form-submit');
  var notLive = $('ps-not-live');
  var F = {
    clientName: $('ps-client-name'),
    clientEmail: $('ps-client-email'),
    revenue: $('ps-client-revenue'),
    ebitda: $('ps-client-ebitda'),
    partnerName: $('ps-partner-name'),
    partnerEmail: $('ps-partner-email'),
    partnerCell: $('ps-partner-cell')
  };
  var revenueHint = $('ps-client-revenue-hint');
  var ebitdaHint = $('ps-client-ebitda-hint');
  var REVENUE_HINT = revenueHint ? revenueHint.textContent : '';
  var EBITDA_HINT = ebitdaHint ? ebitdaHint.textContent : '';

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

  function showFormError(msg) { formError.textContent = msg; formError.hidden = false; }
  function hideFormError() { formError.textContent = ''; formError.hidden = true; }

  function validPhone(value) {
    if (!/^\+?[0-9\s().\-]+$/.test(value)) return false;
    var digits = value.replace(/\D/g, '').length;
    return digits >= 10 && digits <= 15;
  }

  /* ---- Revenue: live interpretation under the input, normalised on blur ---- */
  function readRevenue() {
    var t = F.revenue.value.trim();
    if (!t) return { status: 'empty' };
    var d = parseMoney(t);
    if (d === null) return { status: 'invalid' };
    if (d <= 0) return { status: 'zero' };
    if (d >= 1e13) return { status: 'invalid' };
    return { status: 'ok', dollars: d };
  }

  function updateRevenueHint() {
    var r = readRevenue();
    if (r.status === 'ok') {
      revenueHint.innerHTML = '';
      revenueHint.appendChild(document.createTextNode('Recorded as '));
      var b = document.createElement('strong');
      b.textContent = formatDollars(r.dollars);
      revenueHint.appendChild(b);
      revenueHint.appendChild(document.createTextNode(' a year.'));
    } else if (r.status === 'invalid') {
      revenueHint.textContent = 'Enter an amount, e.g. 45M or 45,000,000.';
    } else {
      revenueHint.textContent = REVENUE_HINT;
    }
  }

  F.revenue.addEventListener('input', function () {
    updateRevenueHint();
    if (F.revenue.getAttribute('aria-invalid') && readRevenue().status === 'ok') fieldError(F.revenue, '');
  });
  F.revenue.addEventListener('blur', function () {
    var r = readRevenue();
    if (r.status === 'ok') F.revenue.value = formatDollars(r.dollars);
    updateRevenueHint();
  });

  /* ------------------------------------------------------------------
     EBITDA combobox (WAI-ARIA combobox with list autocomplete). Typing
     moves the active option live; arrows / Enter / click choose; Escape
     closes. On blur the input shows the chosen option's label.
     ------------------------------------------------------------------ */
  var combo = $('ps-ebitda-combo');
  var list = $('ps-ebitda-list');
  var toggleBtn = $('ps-ebitda-toggle');
  var ebitda = { status: 'empty', index: -1 };
  var activeIndex = -1;

  EBITDA_OPTIONS.forEach(function (opt, i) {
    var li = document.createElement('li');
    li.className = 'ps-combo__option';
    li.id = 'ps-ebitda-opt-' + i;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.setAttribute('data-index', String(i));
    li.textContent = opt.label;
    list.appendChild(li);
  });
  var optionEls = list.querySelectorAll('.ps-combo__option');

  function isListOpen() { return !list.hidden; }

  function openList() {
    if (isListOpen()) return;
    list.hidden = false;
    combo.classList.add('is-open');
    F.ebitda.setAttribute('aria-expanded', 'true');
    scrollOptionIntoView(activeIndex >= 0 ? activeIndex : ebitda.index);
  }

  function closeList() {
    list.hidden = true;
    combo.classList.remove('is-open');
    F.ebitda.setAttribute('aria-expanded', 'false');
    F.ebitda.removeAttribute('aria-activedescendant');
  }

  function scrollOptionIntoView(i) {
    if (i < 0 || !optionEls[i] || list.hidden) return;
    var el = optionEls[i];
    var top = el.offsetTop;
    var bottom = top + el.offsetHeight;
    // Keep the snapped option roughly centred while typing.
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = Math.max(0, top - (list.clientHeight - el.offsetHeight) / 2);
    }
  }

  function setActive(i) {
    activeIndex = i;
    for (var k = 0; k < optionEls.length; k++) {
      optionEls[k].classList.toggle('is-active', k === i);
      optionEls[k].setAttribute('aria-selected', k === ebitda.index ? 'true' : 'false');
    }
    if (i >= 0 && isListOpen()) {
      F.ebitda.setAttribute('aria-activedescendant', optionEls[i].id);
      scrollOptionIntoView(i);
    } else {
      F.ebitda.removeAttribute('aria-activedescendant');
    }
  }

  function updateEbitdaHint() {
    var e = ebitda;
    ebitdaHint.innerHTML = '';
    function put(text, strong) {
      var node = strong ? document.createElement('strong') : document.createTextNode(text);
      if (strong) node.textContent = text;
      ebitdaHint.appendChild(node);
    }
    if (e.status === 'ok') {
      var opt = EBITDA_OPTIONS[e.index];
      if (e.index === OVER_INDEX && e.typed) {
        put('Over $50M: recorded as '); put(formatShort(e.exact), true); put('.');
      } else if (e.index === OVER_INDEX) {
        put('Over $50M.');
      } else if (e.typed && Math.abs(e.typed - e.exact) >= 1000) {
        put(formatShort(e.typed) + ' rounds to '); put(opt.label, true); put('.');
      } else {
        put('Selected: '); put(opt.label, true); put('.');
      }
    } else if (e.status === 'below') {
      put(formatShort(Math.max(0, e.typed)) + ' is under $3M.');
    } else if (e.status === 'invalid') {
      put('Enter an amount, e.g. 7.4M or 7,400,000.');
    } else {
      put(EBITDA_HINT);
    }
  }

  // Apply a parsed value to the control (state, list, hint).
  function applyEbitda(next) {
    ebitda = next;
    setActive(next.index);
    updateEbitdaHint();
    if (F.ebitda.getAttribute('aria-invalid') && next.status === 'ok') fieldError(F.ebitda, '');
  }

  // Put the chosen option's label in the input (on blur, Enter, click).
  function commitEbitdaText() {
    if (ebitda.status !== 'ok') return;
    F.ebitda.value = EBITDA_OPTIONS[ebitda.index].label;
  }

  // Choose an option from the list (click, Enter, arrows).
  function chooseIndex(i, keepTyped) {
    if (i < 0 || i >= EBITDA_OPTIONS.length) return;
    var opt = EBITDA_OPTIONS[i];
    var next;
    if (i === OVER_INDEX) {
      // Keep an over-$50M amount the partner typed; otherwise the default.
      if (keepTyped && ebitda.index === OVER_INDEX && ebitda.typed) next = ebitda;
      else next = { status: 'ok', index: OVER_INDEX, millions: OVER_DEFAULT_MILLIONS, exact: OVER_DEFAULT_MILLIONS * 1e6, typed: null };
    } else {
      next = { status: 'ok', index: i, millions: opt.millions, exact: opt.millions * 1e6, typed: null };
    }
    applyEbitda(next);
    F.ebitda.value = opt.label;
  }

  F.ebitda.addEventListener('input', function () {
    openList();
    applyEbitda(readEbitda(F.ebitda.value));
  });

  // Focusing or clicking the field shows the list at the current choice
  // (click covers a field that is still focused after Enter / Escape).
  function showListAtChoice() {
    openList();
    setActive(ebitda.index);
  }
  F.ebitda.addEventListener('focus', showListAtChoice);
  F.ebitda.addEventListener('click', function () { if (!isListOpen()) showListAtChoice(); });

  F.ebitda.addEventListener('keydown', function (e) {
    var key = e.key;
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      e.preventDefault();
      if (!isListOpen()) { openList(); setActive(ebitda.index); return; }
      var from = activeIndex >= 0 ? activeIndex : (key === 'ArrowDown' ? -1 : EBITDA_OPTIONS.length);
      var to = Math.max(0, Math.min(EBITDA_OPTIONS.length - 1, from + (key === 'ArrowDown' ? 1 : -1)));
      chooseIndex(to, false);
    } else if (key === 'Home' && isListOpen() && e.altKey) {
      e.preventDefault(); chooseIndex(0, false);
    } else if (key === 'Enter') {
      if (isListOpen()) {
        e.preventDefault();
        if (activeIndex >= 0) chooseIndex(activeIndex, true);
        closeList();
      }
    } else if (key === 'Escape') {
      if (isListOpen()) { e.preventDefault(); closeList(); }
    } else if (key === 'Tab') {
      closeList();
    }
  });

  F.ebitda.addEventListener('blur', function () {
    closeList();
    commitEbitdaText();
    if (ebitda.status === 'below') fieldError(F.ebitda, BELOW_MIN_MESSAGE);
    updateEbitdaHint();
  });

  // mousedown, not click, so the input keeps focus and does not blur first.
  // Always prevented, so a press on the list's scrollbar does not close it.
  list.addEventListener('mousedown', function (e) {
    e.preventDefault();
    var li = e.target.closest ? e.target.closest('.ps-combo__option') : null;
    if (!li) return;
    chooseIndex(Number(li.getAttribute('data-index')), false);
    closeList();
  });

  toggleBtn.addEventListener('mousedown', function (e) {
    e.preventDefault();
    if (isListOpen()) { closeList(); return; }
    F.ebitda.focus();
    openList();
    setActive(ebitda.index);
  });

  /* ------------------------------------------------------------------
     Validation
     ------------------------------------------------------------------ */
  function validateForm() {
    var errors = [];
    function check(input, message) {
      fieldError(input, message || '');
      if (message) errors.push(input);
    }

    var clientName = str(F.clientName.value, 200);
    var split = splitName(clientName);
    check(F.clientName, !clientName ? 'Enter your client\u2019s name.'
      : !split.last ? 'Enter your client\u2019s first and last name.' : '');

    var clientEmail = str(F.clientEmail.value, 254);
    check(F.clientEmail, !clientEmail ? 'Enter your client\u2019s email address.'
      : !EMAIL_RE.test(clientEmail) ? 'That email address doesn\u2019t look right.' : '');

    var revenue = readRevenue();
    check(F.revenue, revenue.status === 'empty' ? 'Enter your client\u2019s annual revenue, e.g. 45M.'
      : revenue.status === 'zero' ? 'Revenue must be more than $0.'
      : revenue.status !== 'ok' ? 'Enter revenue as an amount, e.g. 45M or 45,000,000.' : '');

    var e = readEbitda(F.ebitda.value);
    if (e.status === 'ok' && ebitda.status === 'ok' && e.index === ebitda.index) e = ebitda; // keep a typed over-$50M amount
    applyEbitda(e);
    check(F.ebitda, e.status === 'empty' ? 'Enter your client\u2019s annual EBITDA, e.g. 7.4M.'
      : e.status === 'invalid' ? 'Enter EBITDA as an amount, e.g. 7.4M or 7,400,000.'
      : e.status === 'below' ? BELOW_MIN_MESSAGE : '');

    var partnerName = str(F.partnerName.value, 200);
    check(F.partnerName, partnerName ? '' : 'Enter your name.');

    var partnerEmail = str(F.partnerEmail.value, 254);
    check(F.partnerEmail, !partnerEmail ? 'Enter your email address.'
      : !EMAIL_RE.test(partnerEmail) ? 'That email address doesn\u2019t look right.'
      : partnerEmail.toLowerCase() === clientEmail.toLowerCase() ? 'Use your own email here. The invitation goes to your client and to you separately.' : '');

    var partnerCell = str(F.partnerCell.value, 30);
    check(F.partnerCell, partnerCell && !validPhone(partnerCell) ? 'Enter a full cell number, or leave this blank.' : '');

    if (errors.length) return { errors: errors };
    return {
      errors: [],
      lead: {
        client: {
          name: clientName,
          firstName: split.first,
          lastName: split.last,
          email: clientEmail,
          revenue: revenue.dollars,
          ebitdaExact: e.exact,
          ebitdaMillions: e.millions,
          ebitdaTyped: e.typed || null,
          ebitdaIndex: e.index,
          ebitdaBand: ebitdaBand(e.millions)
        },
        partner: { name: partnerName, email: partnerEmail, cell: partnerCell }
      }
    };
  }

  function splitName(full) {
    if (tracking && typeof tracking.splitName === 'function') {
      try { return tracking.splitName(full); } catch (e) {}
    }
    var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') };
  }

  /* ------------------------------------------------------------------
     Form submit -> Forms API -> state 2
     ------------------------------------------------------------------ */
  var NOT_LIVE_MESSAGE = 'This form isn\u2019t live yet. Email your client\u2019s details to Michael at ' + HOST.email + ' and he\u2019ll set up the call.';
  var canSubmit = !!HUBSPOT_FORM_GUID && !!tracking && typeof tracking.submitForm === 'function';
  if (!canSubmit && notLive) notLive.hidden = false;

  function formFields(lead) {
    var c = lead.client;
    var p = lead.partner;
    var fields = [
      { name: 'firstname', value: c.firstName },
      { name: 'lastname', value: c.lastName },
      { name: 'email', value: c.email },
      { name: 'annualrevenue', value: String(c.revenue) },
      { name: 'exact_annual_ebitda', value: String(c.ebitdaExact) },
      { name: 'what_is_your_approximate_annual_ebitda_profit', value: c.ebitdaBand },
      { name: 'role', value: 'CEO/Founder/Owner' },
      // The form only accepts $3M+ EBITDA, which is what "qualified" means.
      { name: 'ibo_qualified', value: 'True' },
      { name: 'referring_partner', value: p.name },
      { name: 'referring_partner_email', value: p.email }
    ];
    if (p.cell) fields.push({ name: 'referring_partner_cell', value: p.cell });
    return fields;
  }

  var currentLead = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideFormError();
    var result = validateForm();
    if (result.errors.length) {
      showFormError('Check the highlighted ' + (result.errors.length === 1 ? 'field' : 'fields') + '.');
      try { result.errors[0].focus(); } catch (err) {}
      return;
    }
    if (!canSubmit) {
      showFormError(NOT_LIVE_MESSAGE);
      return;
    }

    var lead = result.lead;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026';
    var sending;
    try {
      sending = tracking.submitForm(HUBSPOT_PORTAL_ID, HUBSPOT_FORM_GUID, formFields(lead));
    } catch (err) {
      sending = Promise.reject(err);
    }
    sending.then(function () {
      track('partner_form_submit', { ebitda_band: lead.client.ebitdaBand });
      lead.submittedAt = Date.now();
      storageSet(LEAD_KEY, lead);
      startPicker(lead, true);
    }).catch(function () {
      showFormError('Something went wrong sending your client\u2019s details. Please try again, or email Michael at ' + HOST.email + '.');
    }).then(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Next';
    });
  });

  // Refill the form from a saved lead (reload during state 2, or "Edit details").
  function fillForm(lead) {
    try {
      var c = lead.client;
      var p = lead.partner;
      F.clientName.value = c.name || '';
      F.clientEmail.value = c.email || '';
      F.revenue.value = isNum(c.revenue) ? formatDollars(c.revenue) : '';
      if (isNum(c.ebitdaIndex) && c.ebitdaIndex >= 0 && c.ebitdaIndex < EBITDA_OPTIONS.length) {
        applyEbitda({ status: 'ok', index: c.ebitdaIndex, millions: c.ebitdaMillions, exact: c.ebitdaExact, typed: c.ebitdaTyped || null });
        commitEbitdaText();
      }
      F.partnerName.value = p.name || '';
      F.partnerEmail.value = p.email || '';
      F.partnerCell.value = p.cell || '';
      updateRevenueHint();
    } catch (e) {}
  }

  function validLead(lead) {
    return !!(lead && lead.client && lead.partner && EMAIL_RE.test(lead.client.email || '') &&
      EMAIL_RE.test(lead.partner.email || '') && lead.client.firstName && lead.client.lastName &&
      lead.client.ebitdaBand && lead.partner.name);
  }

  /* ------------------------------------------------------------------
     State 2: pick a time
     ------------------------------------------------------------------ */
  var tzSelect = $('ps-tz');
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
    // Slots by monthOffset for the current zone. The calendar for a month
    // draws from every loaded offset, so a day HubSpot happens to list under
    // a neighbouring offset is never lost. Cleared on a zone change.
    loaded: {}
  };

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
      opt.textContent = z[1] + (abbr ? ' \u00b7 ' + abbr : '') + (z[0] === detected ? ' \u00b7 yours' : '');
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

  var statusBox = $('ps-status');
  var statusText = $('ps-status-text');
  var spinner = $('ps-spinner');
  var retryBtn = $('ps-retry');
  var timesWrap = $('ps-times-wrap');
  var timesList = $('ps-times');
  var timesDate = $('ps-times-date');
  var calGrid = $('ps-cal-grid');
  var calBody = $('ps-cal-body');
  var calMonth = $('ps-cal-month');
  var calNote = $('ps-cal-note');
  var prevBtn = $('ps-month-prev');
  var nextBtn = $('ps-month-next');
  var confirmBtn = $('ps-confirm');
  var bookError = $('ps-book-error');
  var pickerEl = $('ps-picker');

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

  function emailLink() {
    return '<a href="mailto:' + HOST.email + '">' + HOST.email + '</a>';
  }

  function clientFirst() {
    return currentLead && currentLead.client && currentLead.client.firstName ? currentLead.client.firstName : 'your client';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
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
      el.className = 'ps-calday' + (key === todayKey ? ' is-today' : '');
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

  function loadAvailability() {
    var req = ++picker.req;
    picker.slot = null;
    updateConfirm();
    var offset = picker.monthOffset;
    renderCalendar(true);
    calNote.textContent = '';
    showStatus('loading', 'Loading Michael&rsquo;s calendar&hellip;');
    var url = AVAILABILITY_URL + '?timezone=' + encodeURIComponent(picker.tz) + '&monthOffset=' + offset;
    fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (data) {
          if (!res.ok || !data || !Array.isArray(data.slots)) throw new Error('availability ' + res.status);
          return data;
        });
      })
      .then(function (data) {
        if (req !== picker.req) return; // a newer request (zone or month change) won
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
          loadAvailability();
          return;
        }
        renderPicker();
      })
      .catch(function () {
        if (req !== picker.req) return;
        renderCalendar(true);
        showStatus('error', 'Couldn&rsquo;t load Michael&rsquo;s calendar. Try again, or write to Michael at ' + emailLink() + '.');
      });
  }

  function renderPicker() {
    var open = renderCalendar(false);
    var keys = Object.keys(open).sort();
    picker.days = keys.map(function (k) { return open[k]; });
    if (!keys.length) {
      var monthName = calMonth.textContent;
      calNote.textContent = 'No open days in ' + monthName + '.';
      showStatus('empty', 'No open times ' + (picker.monthOffset ? 'in ' + escapeHtml(monthName) : 'in the next few weeks') +
        '. ' + (!nextBtn.disabled ? 'Try the next month, or w' : 'W') + 'rite to Michael at ' + emailLink() +
        ' and he&rsquo;ll find a time for ' + escapeHtml(clientFirst()) + '.');
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
    timesDate.textContent = longDate(day.first) + ' \u00b7 ' + tzShortName(picker.tz, day.first);
    day.slots.forEach(function (s) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ps-time';
      b.textContent = timeLabel(s.start);
      b.setAttribute('aria-pressed', picker.slot && picker.slot.start === s.start ? 'true' : 'false');
      b.addEventListener('click', function () {
        picker.slot = s;
        var buttons = timesList.querySelectorAll('.ps-time');
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

  var booking = false;

  function updateConfirm() {
    if (booking) return;
    if (picker.slot) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm ' + slotLabel(picker.slot.start);
    } else {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Choose a time';
    }
  }

  var schedulerViewed = false;

  function startPicker(lead, moveFocus) {
    currentLead = lead;
    setText('[data-client="first"]', lead.client.firstName);
    bookError.hidden = true;
    if (!tzSelect.options.length) buildTzSelect();
    showState('pick');
    if (moveFocus) focusHeading('ps-pick-title');
    if (!schedulerViewed) {
      schedulerViewed = true;
      track('partner_scheduler_view', {});
    }
    picker.monthOffset = 0;
    picker.autoAdvanced = false;
    loadAvailability();
  }

  $('ps-back').addEventListener('click', function () {
    if (currentLead) fillForm(currentLead);
    showState('form');
    focusHeading('ps-form-title');
  });

  function showBookError(html) {
    bookError.innerHTML = html;
    bookError.hidden = false;
  }

  confirmBtn.addEventListener('click', function () {
    if (!picker.slot || !currentLead || booking) return;
    var slot = picker.slot;
    var lead = currentLead;
    booking = true;
    bookError.hidden = true;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking\u2026';

    var body = {
      startTime: slot.start,
      timezone: picker.tz,
      client: { firstName: lead.client.firstName, lastName: lead.client.lastName, email: lead.client.email },
      partner: { name: lead.partner.name, email: lead.partner.email, cell: lead.partner.cell || '' },
      ebitdaBand: lead.client.ebitdaBand
    };

    fetch(BOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    }).then(function (r) {
      booking = false;
      if (r.ok && r.data && r.data.ok) {
        onBooked(slot, r.data, lead);
        return;
      }
      var code = r.data && r.data.error;
      track('partner_meeting_book_failed', { reason: code || String(r.status) });
      if (r.status === 409 || code === 'slot_unavailable') {
        showBookError('That time was just taken. Here are Michael&rsquo;s latest open times; pick another.');
        loadAvailability();
      } else if (r.status === 504 || code === 'upstream_timeout') {
        showBookError('We couldn&rsquo;t confirm the booking in time. Before trying again, check your inbox for an invitation from ' + emailLink() + '.');
        updateConfirm();
      } else {
        showBookError('That booking didn&rsquo;t go through. Try another time, or write to Michael at ' + emailLink() + ' and he&rsquo;ll set it up.');
        updateConfirm();
      }
    }).catch(function () {
      booking = false;
      track('partner_meeting_book_failed', { reason: 'network' });
      showBookError('We couldn&rsquo;t reach the scheduler. Check your connection and try again, or write to Michael at ' + emailLink() + '.');
      updateConfirm();
    });
  });

  function onBooked(slot, data, lead) {
    var start = isNum(data.start) ? data.start : slot.start;
    var end = isNum(data.end) && data.end > start ? data.end : start + MINUTES * 60000;
    var record = {
      start: start,
      end: end,
      minutes: Math.round((end - start) / 60000) || MINUTES,
      tz: picker.tz,
      client: { firstName: lead.client.firstName, email: lead.client.email },
      partner: { name: lead.partner.name, email: lead.partner.email },
      bookedAt: Date.now()
    };
    var leadDays = Math.max(0, Math.round((start - Date.now()) / 86400000));
    track('partner_meeting_booked', { lead_days: leadDays, ebitda_band: lead.client.ebitdaBand });
    storageSet(BOOKING_KEY, record);
    storageRemove(LEAD_KEY);
    renderConfirmation(record, true);
  }

  /* ------------------------------------------------------------------
     State 3: confirmation
     ------------------------------------------------------------------ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function utcStamp(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function isoNoMs(ms) { return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z'); }

  function eventTitle() { return 'Call with ' + HOST.name; }
  function eventDetails() { return 'Zoom link is in the invitation from ' + HOST.email + '.'; }

  function googleUrl(b) {
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(eventTitle()).replace(/%20/g, '+') +
      '&dates=' + utcStamp(b.start) + '/' + utcStamp(b.end) +
      '&details=' + encodeURIComponent(eventDetails());
  }
  function outlookUrl(b) {
    return 'https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
      '&subject=' + encodeURIComponent(eventTitle()) +
      '&startdt=' + encodeURIComponent(isoNoMs(b.start)) +
      '&enddt=' + encodeURIComponent(isoNoMs(b.end)) +
      '&body=' + encodeURIComponent(eventDetails());
  }
  function icsText(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function icsBody(b) {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IBO Advisors//Partner Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + utcStamp(b.start) + '-' + Math.random().toString(36).slice(2, 10) + '@iboadvisors.com',
      'DTSTAMP:' + utcStamp(Date.now()),
      'DTSTART:' + utcStamp(b.start),
      'DTEND:' + utcStamp(b.end),
      'SUMMARY:' + icsText(eventTitle()),
      'DESCRIPTION:' + icsText('Zoom link is in the invitation from ' + HOST.email),
      'END:VEVENT',
      'END:VCALENDAR',
      ''
    ].join('\r\n');
  }

  var icsUrl = null;
  function wireCalendarLinks(b) {
    var google = $('ps-cal-google');
    var outlook = $('ps-cal-outlook');
    var ics = $('ps-cal-ics');
    if (!(isNum(b.start) && isNum(b.end) && b.end > b.start)) {
      $('ps-cal').hidden = true;
      $('ps-cal-caption').hidden = true;
      return;
    }
    try {
      google.href = googleUrl(b);
      outlook.href = outlookUrl(b);
      if (icsUrl && window.URL && URL.revokeObjectURL) URL.revokeObjectURL(icsUrl);
      icsUrl = URL.createObjectURL(new Blob([icsBody(b)], { type: 'text/calendar;charset=utf-8' }));
      ics.href = icsUrl;
    } catch (e) {}
    [google, outlook, ics].forEach(function (a) {
      if (!a || a.getAttribute('data-wired')) return;
      a.setAttribute('data-wired', '1');
      a.addEventListener('click', function () {
        track('calendar_fallback_click', { provider: a.getAttribute('data-provider') || '', page: 'partnerschedule' });
      });
    });
  }

  var COUNT_WORDS = { 1: 'One', 2: 'Two', 3: 'Three' };
  function updateStepsHeading() {
    var steps = document.querySelectorAll('#ps-steps-card .ps-step');
    var total = 0;
    var last = null;
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('is-last');
      if (steps[i].hidden) continue;
      total++;
      last = steps[i];
    }
    if (last) last.classList.add('is-last');
    if (total) $('ps-steps-title').textContent = (COUNT_WORDS[total] || String(total)) + ' small ' + (total === 1 ? 'thing' : 'things') + ' before the call';
  }

  /* Optional note to Michael. Posts to the "Pre-call note" form against the
     CLIENT's contact (that is who the meeting is with), prefixed with who
     wrote it; pre_call_note_host routes it to Michael. Never shown to the
     client. */
  var noteBooking = null;
  function wireNote(b) {
    var card = $('ps-note');
    var canSend = !!PRECALL_NOTE_FORM_GUID && !!tracking && typeof tracking.submitForm === 'function' &&
      !!(b.client && EMAIL_RE.test(b.client.email || ''));
    card.hidden = !canSend;
    noteBooking = b;
    if (!canSend || card.getAttribute('data-wired')) return;
    card.setAttribute('data-wired', '1');

    var noteForm = $('ps-note-form');
    var text = $('ps-note-text');
    var submit = $('ps-note-submit');
    var errorEl = $('ps-note-error');
    var sentEl = $('ps-note-sent');
    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

    noteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.hidden = true;
      var note = String(text.value || '').trim().slice(0, 1000);
      if (!note) { showError('Write a note first, or skip this step.'); text.focus(); return; }
      var bk = noteBooking;
      var partner = bk.partner || {};
      var prefix = 'Note from referring partner ' + (partner.name || 'unknown') + ' (' + (partner.email || 'no email') + '): ';
      submit.disabled = true;
      submit.textContent = 'Sending\u2026';
      var sending;
      try {
        sending = tracking.submitForm(HUBSPOT_PORTAL_ID, PRECALL_NOTE_FORM_GUID, [
          { name: 'email', value: bk.client.email },
          { name: 'pre_call_note', value: prefix + note },
          { name: 'pre_call_note_host', value: HOST.email }
        ]);
      } catch (err) {
        sending = Promise.reject(err);
      }
      sending.then(function () {
        noteForm.hidden = true;
        sentEl.hidden = false;
        track('partner_precall_note_sent', { length: note.length });
      }).catch(function () {
        showError('Couldn\u2019t send. Email Michael directly at ' + HOST.email + '.');
        submit.disabled = false;
        submit.textContent = 'Send to Michael';
      });
    });
  }

  function renderConfirmation(b, moveFocus) {
    var tz = validTimeZone(b.tz) ? b.tz : detectedTimeZone();
    var first = str(b.client && b.client.firstName, 100) || 'Your client';
    setText('[data-client="first"]', first);
    setText('[data-client="email"]', str(b.client && b.client.email, 254) || 'your client');
    setText('[data-partner="email"]', str(b.partner && b.partner.email, 254) || 'your email');
    setText('[data-meeting-title]', MEETING_TITLE);

    try {
      var d = new Date(b.start);
      if (!isNum(b.start) || isNaN(d.getTime())) throw new Error('no time');
      var opt = function (o) { o.timeZone = tz; return o; };
      var date = new Intl.DateTimeFormat('en-US', opt({ weekday: 'long', month: 'long', day: 'numeric' })).format(d);
      var time = new Intl.DateTimeFormat('en-US', opt({ hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })).format(d);
      var month = new Intl.DateTimeFormat('en-US', opt({ month: 'short' })).format(d).replace(/\.$/, '').toUpperCase();
      var day = new Intl.DateTimeFormat('en-US', opt({ day: 'numeric' })).format(d);
      $('ps-when-month').textContent = month;
      $('ps-when-day').textContent = day;
      $('ps-when-tile').hidden = false;
      $('ps-when-date').textContent = date;
      $('ps-when-time').textContent = time;
      $('ps-when-time').hidden = false;
      $('ps-when-sep').hidden = false;
      $('ps-when-label').textContent = 'Your client\u2019s call \u00b7 ' + tzName(tz);
      var bookedEl = $('ps-booked-when');
      bookedEl.textContent = date + ' at ';
      var t = document.createElement('span');
      t.className = 'ps-nowrap';
      t.textContent = time + '.';
      bookedEl.appendChild(t);
    } catch (e) {
      $('ps-when-tile').hidden = true;
      $('ps-when-date').textContent = 'The time is in the invitation.';
      $('ps-when-time').hidden = true;
      $('ps-when-sep').hidden = true;
      $('ps-booked-when').textContent = 'The time is in the invitation.';
    }

    try { wireCalendarLinks(b); } catch (e) {}
    try { wireNote(b); } catch (e) {}
    try { updateStepsHeading(); } catch (e) {}

    var img = $('ps-host-img');
    if (img) img.onerror = function () {
      var pic = $('ps-host-picture');
      if (pic) pic.hidden = true;
      $('ps-pair').classList.add('ps-pair--solo');
    };

    showState('confirmed');
    if (moveFocus) focusHeading('ps-confirmed-title');
  }

  function tzName(tz) {
    for (var i = 0; i < TIME_ZONES.length; i++) if (TIME_ZONES[i][0] === tz) return TIME_ZONES[i][1].replace(/\s*\(.*\)$/, '');
    return tz.replace(/_/g, ' ');
  }

  $('ps-another').addEventListener('click', function () {
    storageRemove(BOOKING_KEY);
    storageRemove(LEAD_KEY);
    try { window.location.href = window.location.pathname + window.location.search; } catch (e) { window.location.reload(); }
  });

  /* ------------------------------------------------------------------
     Start
     ------------------------------------------------------------------ */
  function loadBooking() {
    var b = storageGet(BOOKING_KEY);
    if (!b) return null;
    // A tab left open long after the call offers the form again.
    if (isNum(b.end) && b.end < Date.now() - 12 * 3600000) { storageRemove(BOOKING_KEY); return null; }
    return b;
  }

  var storedBooking = loadBooking();
  var storedLead = storedBooking ? null : storageGet(LEAD_KEY);
  if (storedBooking) {
    renderConfirmation(storedBooking, false);
  } else if (validLead(storedLead)) {
    // Reload while picking a time: the lead is already in HubSpot.
    fillForm(storedLead);
    startPicker(storedLead, false);
  } else {
    storageRemove(LEAD_KEY);
    showState('form');
  }
})();

/* ==========================================================================
   Mobile navigation toggle (same as /book/book.js; this page does not load
   modal.js, which also fires conversions on timers). The ☰ button opens a
   dropdown with the nav links plus the Learn More CTA (moved into the links
   container while open, restored on close), keeps aria-expanded in step,
   and closes on a link tap, Escape, or a resize back to the desktop bar.
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
