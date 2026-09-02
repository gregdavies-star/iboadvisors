/* ==========================================================================
   IBO Advisors — PE exit vs. Independent Buyout comparison
   /ibo-exit — landing page for the "buy at 6x, lever it up, sell at 10x"
   Meta ad. Standalone by design: separate from the SEO-facing
   /business-valuation-calculator, not indexed, no site navigation.

   Fully client-side. The math mirrors the "Comparison Public Equity vs IBO"
   worksheet line for line:

     EBITDA today -> 3 yr -> 6 yr, compounded at the growth rate
     Valuation    = EBITDA x multiple (multiple depends on industry)

     Private equity                        Independent Buyout
     ------------------------------        ------------------------------
       Valuation                             Valuation
     - Held back for earnout (20%)         + Warrant upside (15% x V6)
     + Earnout statistically paid (21%)    + Appreciation upside
     - Rollover (25%)                          (.35 V0 + .35 V3 + .30 V6) - V0
     + Rollover payout at 2nd sale         + Taxes (0%)
         (25% x V6)
     - Taxes (30% of the above)
     = Total                               = Total

   Booking is gated at $3M EBITDA, the same threshold the site's qualify
   modal and valuation calculator use. Qualified leads post to the same
   HubSpot form and are sent to the same meeting scheduler.
   ========================================================================== */
(function () {
  'use strict';

  var HUBSPOT_PORTAL_ID = '245308986';
  var HUBSPOT_FORM_GUID = 'ec6307ff-aa5a-4e75-b423-11846eab6ad7';
  var HUBSPOT_MEETING_URL = 'https://meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo';
  var QUALIFY_EBITDA = 3000000;

  /* Worksheet constants that aren't exposed as inputs. */
  var EARNOUT_PAID_CHANCE = 0.21;   // statistical chance the earnout is paid
  var WARRANT_PCT = 0.15;           // IBO warrant upside as % of year-6 valuation
  var APPRECIATION_WEIGHTS = [0.35, 0.35, 0.30]; // today / 3yr / 6yr
  var IBO_TAX_RATE = 0;

  var DEFAULTS = { earnoutPct: 20, rolloverPct: 25, taxPct: 30, growthPct: 5 };

  /* ------------------------------------------------------------------
     Industry multiples — the same lower-middle-market ranges used by
     /business-valuation-calculator, so the two tools agree. The default
     multiple is the range midpoint scaled by the earnings-size tier.
     ------------------------------------------------------------------ */
  var INDUSTRIES = [
    { id: 'advertising',    label: 'Advertising & Marketing Services',  lo: 4.0, hi: 6.5 },
    { id: 'apparel',        label: 'Apparel & Consumer Products',       lo: 4.0, hi: 6.0 },
    { id: 'architecture',   label: 'Architecture & Engineering',        lo: 4.0, hi: 6.5 },
    { id: 'aviation',       label: 'Aviation Services',                 lo: 4.5, hi: 6.5 },
    { id: 'construction',   label: 'Construction & Specialty Trades',   lo: 3.5, hi: 5.5 },
    { id: 'govcon',         label: 'Government & Defense Contracting',  lo: 4.5, hi: 7.5 },
    { id: 'distribution',   label: 'Distribution & Logistics',          lo: 4.5, hi: 6.5 },
    { id: 'education',      label: 'Education & Training',              lo: 4.5, hi: 7.0 },
    { id: 'financial',      label: 'Financial Services & Insurance',    lo: 5.0, hi: 8.0 },
    { id: 'healthcare',     label: 'Healthcare Services',               lo: 5.0, hi: 8.5 },
    { id: 'homeservices',   label: 'Home & Facility Services (HVAC, plumbing, etc.)', lo: 4.5, hi: 7.0 },
    { id: 'homecare',       label: 'Home Care & Senior Services',       lo: 4.5, hi: 7.0 },
    { id: 'hospitality',    label: 'Restaurants & Hospitality',         lo: 3.0, hi: 5.0 },
    { id: 'itservices',     label: 'IT Services & Managed Services',    lo: 5.5, hi: 8.5 },
    { id: 'manufacturing',  label: 'Manufacturing',                     lo: 4.5, hi: 7.0 },
    { id: 'professional',   label: 'Professional Services',            lo: 4.0, hi: 6.5 },
    { id: 'software',       label: 'Software & Technology',             lo: 6.0, hi: 10.0 },
    { id: 'staffing',       label: 'Staffing & HR Services',            lo: 4.0, hi: 6.0 },
    { id: 'transportation', label: 'Transportation',                    lo: 3.5, hi: 5.5 },
    { id: 'other',          label: 'Other',                             lo: 4.0, hi: 6.5 }
  ];

  var SIZE_TIERS = [
    { min: 10000000, factor: 1.25 },
    { min: 5000000,  factor: 1.12 },
    { min: 3000000,  factor: 1.00 },
    { min: 1000000,  factor: 0.85 },
    { min: 500000,   factor: 0.72 },
    { min: 0,        factor: 0.60 }
  ];

  function industryById(id) {
    return INDUSTRIES.filter(function (i) { return i.id === id; })[0] || null;
  }

  function defaultMultiple(industry, ebitda) {
    if (!industry) return null;
    var tier = SIZE_TIERS.filter(function (t) { return ebitda >= t.min; })[0];
    var mid = (industry.lo + industry.hi) / 2;
    return Math.round(mid * tier.factor * 10) / 10;
  }

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  function parseMoney(str) {
    if (!str) return 0;
    var n = parseFloat(String(str).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function parseNum(str, fallback) {
    var n = parseFloat(str);
    return isFinite(n) ? n : fallback;
  }

  function fmtMoney(n, signed) {
    if (!isFinite(n)) return '—';
    var abs = Math.abs(n);
    var s;
    if (abs >= 1e6) {
      var m = abs / 1e6;
      s = '$' + (m >= 100 ? Math.round(m).toLocaleString('en-US') : m.toFixed(1)) + 'M';
    } else if (abs >= 1e3) {
      s = '$' + Math.round(abs / 1e3) + 'K';
    } else {
      s = '$' + Math.round(abs);
    }
    if (n < 0) return '−' + s;
    if (signed && n > 0) return '+' + s;
    return s;
  }

  function fmtMoneyFull(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function fmtMult(n) { return (Math.round(n * 10) / 10).toFixed(1) + 'x'; }

  function fmtPct(n) { return (Math.round(n * 10) / 10) + '%'; }

  function wireMoneyInput(input) {
    input.addEventListener('blur', function () {
      var n = parseMoney(input.value);
      input.value = n ? fmtMoneyFull(n) : '';
    });
  }

  function fireConversion(sendTo) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: sendTo });
    }
  }

  /* ------------------------------------------------------------------
     The comparison engine — the worksheet, in dollars.
     ------------------------------------------------------------------ */
  function computeComparison(inp) {
    var g = inp.growth;
    var m = inp.multiple;

    var e0 = inp.ebitda;
    var e3 = e0 * Math.pow(1 + g, 3);
    var e6 = e3 * Math.pow(1 + g, 3);
    var v0 = e0 * m, v3 = e3 * m, v6 = e6 * m;

    // Private equity
    var heldBack = -inp.earnoutPct * v0;
    var earnoutPaid = inp.earnoutPct * v0 * EARNOUT_PAID_CHANCE;
    var rolloverAmt = -inp.rolloverPct * v0;
    var rolloverPayout = inp.rolloverPct * v6;
    var pePreTax = v0 + heldBack + earnoutPaid + rolloverAmt + rolloverPayout;
    var peTaxes = -pePreTax * inp.taxPct;
    var peTotal = pePreTax + peTaxes;

    // Independent Buyout
    var warrants = WARRANT_PCT * v6;
    var appreciation = (APPRECIATION_WEIGHTS[0] * v0 + APPRECIATION_WEIGHTS[1] * v3 + APPRECIATION_WEIGHTS[2] * v6) - v0;
    var iboPreTax = v0 + warrants + appreciation;
    var iboTaxes = -iboPreTax * IBO_TAX_RATE;
    var iboTotal = iboPreTax + iboTaxes;

    return {
      e0: e0, e3: e3, e6: e6, v0: v0, v3: v3, v6: v6,
      pe: { valuation: v0, heldBack: heldBack, earnoutPaid: earnoutPaid, rolloverAmt: rolloverAmt, rolloverPayout: rolloverPayout, taxes: peTaxes, total: peTotal },
      ibo: { valuation: v0, warrants: warrants, appreciation: appreciation, taxes: iboTaxes, total: iboTotal },
      spread: iboTotal - peTotal,
      qualifies: e0 >= QUALIFY_EBITDA
    };
  }

  // Years of compounding needed to reach the qualifying EBITDA (null if never).
  function yearsToQualify(ebitda, growth) {
    if (ebitda >= QUALIFY_EBITDA) return 0;
    if (growth <= 0) return null;
    return Math.ceil(Math.log(QUALIFY_EBITDA / ebitda) / Math.log(1 + growth));
  }

  /* ------------------------------------------------------------------
     UI wiring
     ------------------------------------------------------------------ */
  var form = $('xc-form');
  if (!form) return;

  var industrySelect = $('xc-industry');
  INDUSTRIES.forEach(function (i) {
    var opt = document.createElement('option');
    opt.value = i.id;
    opt.textContent = i.label;
    industrySelect.appendChild(opt);
  });

  ['xc-revenue', 'xc-ebitda'].forEach(function (id) { wireMoneyInput($(id)); });

  var advanced = $('xc-advanced');
  var editBtn = $('xc-edit');
  var editBtn2 = $('xc-edit-2');
  var multipleInput = $('xc-multiple');
  var multipleHelp = $('xc-multiple-help');

  function setAdvanced(open) {
    advanced.hidden = !open;
    editBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function toggleAdvanced() {
    setAdvanced(advanced.hidden);
    if (!advanced.hidden) {
      refreshMultipleHint();
      var first = advanced.querySelector('input');
      if (first) first.focus({ preventScroll: true });
    }
  }

  editBtn.addEventListener('click', toggleAdvanced);

  // The Edit button in the results scrolls back up with the panel open.
  editBtn2.addEventListener('click', function () {
    setAdvanced(true);
    refreshMultipleHint();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = advanced.querySelector('input');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
  });

  $('xc-reset').addEventListener('click', function (e) {
    e.preventDefault();
    multipleInput.value = '';
    $('xc-earnout').value = DEFAULTS.earnoutPct;
    $('xc-rollover').value = DEFAULTS.rolloverPct;
    $('xc-tax').value = DEFAULTS.taxPct;
    refreshMultipleHint();
  });

  // Show the industry multiple as the placeholder so an override is informed.
  function refreshMultipleHint() {
    var industry = industryById(industrySelect.value);
    var ebitda = parseMoney($('xc-ebitda').value);
    var auto = industry ? defaultMultiple(industry, ebitda) : null;
    if (auto) {
      multipleInput.placeholder = auto.toFixed(1);
      multipleHelp.textContent = 'Leave blank to use ' + fmtMult(auto) + ' — the current ' + industry.label + ' multiple at your size.';
    } else {
      multipleInput.placeholder = 'Auto';
      multipleHelp.textContent = 'Leave blank to use your industry’s current multiple.';
    }
  }
  industrySelect.addEventListener('change', refreshMultipleHint);
  $('xc-ebitda').addEventListener('blur', refreshMultipleHint);

  /* Calculating overlay: a short staged reveal between submit and results. */
  var CALC_STEPS = [
    'Applying your industry multiple…',
    'Projecting six years of growth…',
    'Pricing the earnout, the rollover, and the tax bill…'
  ];
  var calcTimers = [];

  function showCalculating(done) {
    var overlay = $('xc-calc-overlay');
    var stepEl = $('xc-calc-step');
    var calcBtn = $('xc-calculate');
    if (!overlay) { done(); return; }

    calcTimers.forEach(clearTimeout);
    calcTimers = [];
    calcBtn.disabled = true;
    stepEl.textContent = CALC_STEPS[0];
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    for (var i = 1; i < CALC_STEPS.length; i++) {
      (function (idx) {
        calcTimers.push(setTimeout(function () { stepEl.textContent = CALC_STEPS[idx]; }, idx * 900));
      })(i);
    }
    calcTimers.push(setTimeout(function () {
      overlay.hidden = true;
      document.body.style.overflow = '';
      calcBtn.disabled = false;
      done();
    }, 2700));
  }

  var lastInputs = null;
  var lastResult = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('xc-form-error');
    errorEl.hidden = true;

    var industry = industryById(industrySelect.value);
    var revenue = parseMoney($('xc-revenue').value);
    var ebitda = parseMoney($('xc-ebitda').value);
    var growthPct = parseNum($('xc-growth').value, DEFAULTS.growthPct);

    function fail(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

    if (revenue <= 0) return fail('Please enter your annual revenue.');
    if (ebitda <= 0) return fail('Please enter your annual EBITDA — the comparison is built on it.');
    if (ebitda > revenue) return fail('EBITDA is higher than revenue — please double-check the numbers.');
    if (!industry) return fail('Please select your industry.');
    if (growthPct < -50 || growthPct > 100) return fail('Please enter a growth rate between −50% and 100%.');

    var autoMultiple = defaultMultiple(industry, ebitda);
    var override = parseNum(multipleInput.value, NaN);
    var multiple = (isFinite(override) && override > 0) ? override : autoMultiple;

    var inputs = {
      revenue: revenue,
      ebitda: ebitda,
      industry: industry,
      growth: growthPct / 100,
      multiple: multiple,
      multipleIsCustom: multiple !== autoMultiple,
      earnoutPct: Math.max(0, parseNum($('xc-earnout').value, DEFAULTS.earnoutPct)) / 100,
      rolloverPct: Math.max(0, parseNum($('xc-rollover').value, DEFAULTS.rolloverPct)) / 100,
      taxPct: Math.max(0, parseNum($('xc-tax').value, DEFAULTS.taxPct)) / 100
    };

    lastInputs = inputs;
    lastResult = computeComparison(inputs);
    $('xc-results').hidden = true;
    $('xc-cta-book').hidden = true;
    $('xc-cta-wait').hidden = true;
    showCalculating(function () { renderResults(inputs, lastResult); });
  });

  function renderResults(inp, r) {
    // Projection band
    $('xc-band-lede').textContent =
      'At ' + fmtPct(inp.growth * 100) + ' annual growth, ' + fmtMoney(inp.ebitda) +
      ' of EBITDA becomes ' + fmtMoney(r.e6) + ' in six years. At ' + fmtMult(inp.multiple) +
      ', that’s a company worth ' + fmtMoney(r.v6) + ' — ' + fmtMoney(r.v6 - r.v0) +
      ' of value that has to go to someone. The question is who.';
    $('xc-v0').textContent = fmtMoney(r.v0);
    $('xc-v3').textContent = fmtMoney(r.v3);
    $('xc-v6').textContent = fmtMoney(r.v6);
    $('xc-e0').textContent = fmtMoney(r.e0);
    $('xc-e3').textContent = fmtMoney(r.e3);
    $('xc-e6').textContent = fmtMoney(r.e6);
    $('xc-basis').textContent =
      'Valuation = EBITDA × ' + fmtMult(inp.multiple) +
      (inp.multipleIsCustom
        ? ' (your multiple).'
        : ' — the current ' + inp.industry.label + ' multiple for a company of your size.') +
      ' Revenue of ' + fmtMoney(inp.revenue) + ' implies a ' + Math.round(inp.ebitda / inp.revenue * 100) + '% EBITDA margin.';

    // PE card
    $('xc-pe-val').textContent = fmtMoney(r.pe.valuation);
    $('xc-pe-heldback').textContent = fmtMoney(r.pe.heldBack);
    $('xc-pe-earnout-note').textContent = fmtPct(inp.earnoutPct * 100) + ' of the price tied to future targets';
    $('xc-pe-earnout-paid').textContent = fmtMoney(r.pe.earnoutPaid, true);
    $('xc-pe-chance-note').textContent = 'Earnouts are paid in full about ' + Math.round(EARNOUT_PAID_CHANCE * 100) + '% of the time';
    $('xc-pe-rollover').textContent = fmtMoney(r.pe.rolloverAmt);
    $('xc-pe-rollover-note').textContent = fmtPct(inp.rolloverPct * 100) + ' reinvested, at the sponsor’s risk';
    $('xc-pe-rollover-payout').textContent = fmtMoney(r.pe.rolloverPayout, true);
    $('xc-pe-taxes').textContent = fmtMoney(r.pe.taxes);
    $('xc-pe-tax-note').textContent = fmtPct(inp.taxPct * 100) + ' capital gains on everything you receive';
    $('xc-pe-total').textContent = fmtMoney(r.pe.total);

    // IBO card
    $('xc-ibo-val').textContent = fmtMoney(r.ibo.valuation);
    $('xc-ibo-warrants').textContent = fmtMoney(r.ibo.warrants, true);
    $('xc-ibo-appreciation').textContent = fmtMoney(r.ibo.appreciation, true);
    $('xc-ibo-taxes').textContent = fmtMoney(r.ibo.taxes);
    $('xc-ibo-total').textContent = fmtMoney(r.ibo.total);

    // Verdict
    var title = $('xc-verdict-title');
    var body = $('xc-verdict-body');
    var cta = $('xc-verdict-cta');
    if (r.spread > 0) {
      title.textContent = 'An IBO could mean ' + fmtMoney(r.spread) + ' more in your pocket.';
      body.textContent =
        'Same company, same ' + fmtMult(inp.multiple) + ' valuation. In the private equity sale, ' +
        fmtMoney(-r.pe.heldBack - r.pe.rolloverAmt) + ' of your price is held back or rolled forward at someone else’s risk, and ' +
        fmtMoney(-r.pe.taxes) + ' goes to taxes. In an Independent Buyout you’re paid at a full valuation, keep the upside as the company grows, and the capital gains bill can be deferred or eliminated. ' +
        (r.qualifies
          ? 'At your scale, an IBO is worth modeling seriously before you talk to any buyer.'
          : 'At your scale the structure isn’t quite there yet — but you’re building toward it.');
    } else {
      title.textContent = 'On these assumptions the two paths land close together.';
      body.textContent =
        'With the earnout, rollover, and tax assumptions you’ve entered, a private equity sale keeps pace with an Independent Buyout in dollars. ' +
        'That still leaves the differences a spreadsheet can’t price: who runs the company afterward, and whether your proceeds are certain or contingent.';
    }
    cta.textContent = r.qualifies ? 'Book a meeting' : 'What happens next';

    // Bottom CTA — gated at $3M EBITDA.
    var bookSection = $('xc-cta-book');
    var waitSection = $('xc-cta-wait');
    var ctaAnchor;
    if (r.qualifies) {
      bookSection.hidden = false;
      waitSection.hidden = true;
      $('xc-book-lede').textContent =
        'At ' + fmtMoney(inp.ebitda) + ' of EBITDA the Independent Buyout is a genuine alternative to a private equity sale. ' +
        'A confidential call walks through the structure on your actual numbers — and whether it’s the better path for you.';
      ctaAnchor = bookSection;
    } else {
      bookSection.hidden = true;
      waitSection.hidden = false;
      var yrs = yearsToQualify(inp.ebitda, inp.growth);
      $('xc-wait-body').textContent =
        'The Independent Buyout structure is built on a company’s own borrowing capacity, and the economics start to work at roughly $3M in annual EBITDA. ' +
        'You’re at ' + fmtMoney(inp.ebitda) + ' today' +
        (yrs ? ' — at ' + fmtPct(inp.growth * 100) + ' growth you’d cross $3M in about ' + yrs + (yrs === 1 ? ' year' : ' years') + '.' : '.') +
        ' The playbook above is exactly the reason to keep building. When you reach $3M, come back and run the numbers again. We’ll be here.';
      ctaAnchor = waitSection;
    }
    cta.setAttribute('href', '#' + ctaAnchor.id);

    var results = $('xc-results');
    results.hidden = false;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------
     Lead capture → HubSpot. Both forms post to the same form the site's
     qualify modal uses, so leads land in one pipeline: qualified leads go
     on to the scheduler, under-$3M leads are tagged ibo_qualified=False
     and shown a thank-you.
     ------------------------------------------------------------------ */
  function ebitdaBandFor(ebitda) {
    if (ebitda >= 20000000) return '$20M+';
    if (ebitda >= 10000000) return '$10M - $20M';
    if (ebitda >= 5000000) return '$5M - $10M';
    if (ebitda >= 3000000) return '$3M - $5M';
    return 'Less than $3M';
  }

  function submitLead(fields) {
    return fetch(
      'https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_GUID,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields,
          context: { pageUri: window.location.href, pageName: document.title }
        })
      }
    ).then(function (res) {
      if (!res.ok) throw new Error('Submission failed');
      return res.json().catch(function () { return {}; });
    });
  }

  function splitName(fullName) {
    var parts = fullName.split(/\s+/);
    return { first: parts.shift() || fullName, last: parts.join(' ') };
  }

  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  /* ---- Book a meeting (EBITDA >= $3M) ---- */
  var bookForm = $('xc-book-form');
  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('xc-book-error');
    errorEl.hidden = true;

    var fullName = $('xc-lead-name').value.trim();
    var email = $('xc-lead-email').value.trim();
    var phone = $('xc-lead-phone').value.trim();
    var company = $('xc-lead-company').value.trim();

    function fail(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

    if (!fullName || !email || !phone || !company) return fail('Please fill in every field to book a meeting.');
    if (!EMAIL_RE.test(email)) return fail('That email address doesn’t look right — please double-check it.');
    if (!lastResult || !lastInputs) return fail('Please run the comparison first.');

    var name = splitName(fullName);
    var firstName = name.first, lastName = name.last;
    var band = ebitdaBandFor(lastInputs.ebitda);
    var qualifies = lastResult.qualifies;

    var submitBtn = $('xc-book-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening the calendar…';

    submitLead([
      { name: 'firstname', value: firstName },
      { name: 'lastname', value: lastName },
      { name: 'email', value: email },
      { name: 'phone', value: phone },
      { name: 'company', value: company },
      { name: 'ibo_qualified', value: qualifies ? 'True' : 'False' },
      { name: 'respondent_role', value: 'CEO/Founder/Owner' },
      { name: 'what_is_your_approximate_annual_ebitda_profit', value: band }
    ])
      .then(function () {
        // Same Google Ads conversion labels as the site's qualify modal.
        fireConversion(qualifies
          ? 'AW-18411360561/XH9KCMqlj-gcELGinMtE'
          : 'AW-18411360561/jK-oCMy9vOgcELGinMtE');
        var url = new URL(HUBSPOT_MEETING_URL);
        url.searchParams.set('firstName', firstName);
        url.searchParams.set('lastName', lastName);
        url.searchParams.set('email', email);
        url.searchParams.set('company', company);
        window.location.href = url.toString();
      })
      .catch(function () {
        errorEl.textContent = 'Something went wrong submitting your details. Please try again.';
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book a meeting';
      });
  });

  /* ---- Stay in touch (EBITDA < $3M) ---- */
  var touchForm = $('xc-touch-form');
  touchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('xc-touch-error');
    errorEl.hidden = true;

    var fullName = $('xc-touch-name').value.trim();
    var email = $('xc-touch-email').value.trim();
    var company = $('xc-touch-company').value.trim();

    function fail(msg) { errorEl.textContent = msg; errorEl.hidden = false; }

    if (!fullName || !email || !company) return fail('Please fill in every field so we know who to check in with.');
    if (!EMAIL_RE.test(email)) return fail('That email address doesn’t look right — please double-check it.');
    if (!lastInputs) return fail('Please run the comparison first.');

    var name = splitName(fullName);
    var submitBtn = $('xc-touch-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    submitLead([
      { name: 'firstname', value: name.first },
      { name: 'lastname', value: name.last },
      { name: 'email', value: email },
      { name: 'company', value: company },
      { name: 'ibo_qualified', value: 'False' },
      { name: 'respondent_role', value: 'CEO/Founder/Owner' },
      { name: 'what_is_your_approximate_annual_ebitda_profit', value: ebitdaBandFor(lastInputs.ebitda) }
    ])
      .then(function () {
        // Learn More Form - Unqualified Lead (same label the qualify modal fires).
        fireConversion('AW-18411360561/jK-oCMy9vOgcELGinMtE');
        touchForm.hidden = true;
        $('xc-touch-done').hidden = false;
      })
      .catch(function () {
        fail('Something went wrong saving your details. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Keep me in the loop';
      });
  });
})();
