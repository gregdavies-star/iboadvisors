/* ==========================================================================
   IBO Advisors — Business Valuation Calculator
   Fully client-side: the instant estimate never leaves the browser. The
   email gate submits to the same HubSpot form used by the qualify modal
   (so valuation leads land in the same pipeline), then generates the
   detailed PDF locally with jsPDF — no backend, no per-report cost.
   ========================================================================== */
(function () {
  'use strict';

  var HUBSPOT_PORTAL_ID = '245308986';
  var HUBSPOT_FORM_GUID = 'ec6307ff-aa5a-4e75-b423-11846eab6ad7';
  var HUBSPOT_MEETING_URL = 'https://meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo';

  /* ------------------------------------------------------------------
     Market data. Base EBITDA multiple ranges are calibrated to a company
     at ~$3–5M EBITDA in the lower middle market (IBBA Market Pulse /
     GF Data ranges); the size factor below scales them up or down.
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

  // Multiple scales with earnings size. Factors are relative to the
  // $3–5M-EBITDA baseline the industry ranges are calibrated to.
  var SIZE_TIERS = [
    { min: 10000000, factor: 1.25, label: '$10M+ EBITDA commands a scale premium' },
    { min: 5000000,  factor: 1.12, label: '$5–10M EBITDA earns a size premium' },
    { min: 3000000,  factor: 1.00, label: '' },
    { min: 1000000,  factor: 0.85, label: 'Earnings under $3M price below the mid-market benchmark' },
    { min: 500000,   factor: 0.72, label: 'Earnings under $1M price well below mid-market multiples' },
    { min: 0,        factor: 0.60, label: 'Main Street-size earnings trade at Main Street multiples' }
  ];

  // SDE overstates transferable earnings relative to EBITDA, so SDE
  // multiples run lower than EBITDA multiples for the same business.
  var SDE_FACTOR = 0.85;

  var DRIVERS = {
    growth: {
      declining: { f: 0.85, down: 'Declining revenue — buyers price decline more harshly than they reward growth' },
      flat:      { f: 0.96, down: 'Flat revenue — no growth story for a buyer to pay up for' },
      moderate:  { f: 1.03, up: 'Consistent growth adds real multiple' },
      strong:    { f: 1.10, up: '15%+ growth puts you in the premium bracket for your industry' }
    },
    recurring: {
      low:    { f: 1.00, down: 'Limited recurring revenue — the most reliable multiple-expander is missing' },
      medium: { f: 1.04, up: 'Meaningful repeat revenue supports the top half of your range' },
      high:   { f: 1.10, up: '50%+ recurring revenue is the single strongest premium driver' }
    },
    concentration: {
      low:    { f: 1.03, up: 'No customer over 10% of revenue — diligence-proof on concentration' },
      medium: { f: 0.97, down: 'A 10–25% customer will draw diligence scrutiny' },
      high:   { f: 0.88, down: 'A customer over 25% of revenue is the #1 reason deals re-price in diligence' }
    },
    dependence: {
      low:    { f: 1.06, up: 'The business runs without you — buyers pay for that' },
      medium: { f: 0.98, down: 'Weekly owner involvement — buyers will discount for transition risk' },
      high:   { f: 0.90, down: 'Owner-dependent operations are a direct discount to your multiple' }
    }
  };

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  function parseMoney(str) {
    if (!str) return 0;
    var n = parseFloat(String(str).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function fmtMoney(n) {
    if (!isFinite(n)) return '—';
    if (Math.abs(n) >= 1e6) {
      var m = n / 1e6;
      return '$' + (m >= 100 ? Math.round(m) : m.toFixed(m >= 10 ? 1 : 2)) + 'M';
    }
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function fmtMoneyFull(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function fmtMult(n) { return n.toFixed(1) + 'x'; }

  // Live-format money inputs as the user types.
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
     Valuation engine — deterministic, runs entirely in the browser.
     ------------------------------------------------------------------ */
  function computeValuation(inputs) {
    var industry = INDUSTRIES.filter(function (i) { return i.id === inputs.industryId; })[0];
    var addbacks = inputs.abComp + inputs.abOnetime + inputs.abPersonal;
    var adjProfit = inputs.profit + addbacks;

    var sizeTier = SIZE_TIERS.filter(function (t) { return adjProfit >= t.min; })[0];

    var driverFactor = 1;
    var ups = [];
    var downs = [];
    ['growth', 'recurring', 'concentration', 'dependence'].forEach(function (key) {
      var d = DRIVERS[key][inputs[key]];
      driverFactor *= d.f;
      if (d.up && d.f > 1) ups.push(d.up);
      if (d.down && d.f < 1) downs.push(d.down);
    });
    if (sizeTier.factor > 1) ups.push(sizeTier.label);
    if (sizeTier.factor < 1 && sizeTier.label) downs.push(sizeTier.label);

    var modeFactor = inputs.mode === 'sde' ? SDE_FACTOR : 1;
    var loMult = Math.max(1.5, industry.lo * sizeTier.factor * driverFactor * modeFactor);
    var hiMult = Math.min(15, industry.hi * sizeTier.factor * driverFactor * modeFactor);
    var midMult = (loMult + hiMult) / 2;

    return {
      industry: industry,
      addbacks: addbacks,
      adjProfit: adjProfit,
      sizeTier: sizeTier,
      driverFactor: driverFactor,
      loMult: loMult, midMult: midMult, hiMult: hiMult,
      low: adjProfit * loMult,
      mid: adjProfit * midMult,
      high: adjProfit * hiMult,
      ups: ups,
      downs: downs,
      margin: inputs.revenue > 0 ? adjProfit / inputs.revenue : null
    };
  }

  /* ------------------------------------------------------------------
     UI wiring
     ------------------------------------------------------------------ */
  var form = $('vc-form');
  if (!form) return;

  var industrySelect = $('vc-industry');
  INDUSTRIES.forEach(function (i) {
    var opt = document.createElement('option');
    opt.value = i.id;
    opt.textContent = i.label;
    industrySelect.appendChild(opt);
  });

  ['vc-revenue', 'vc-profit', 'vc-ab-comp', 'vc-ab-onetime', 'vc-ab-personal'].forEach(function (id) {
    wireMoneyInput($(id));
  });

  var mode = 'ebitda';
  function setMode(next) {
    mode = next;
    $('vc-mode-ebitda').setAttribute('aria-pressed', String(next === 'ebitda'));
    $('vc-mode-sde').setAttribute('aria-pressed', String(next === 'sde'));
    $('vc-profit-label').textContent = next === 'sde' ? 'SDE' : 'EBITDA';
  }
  $('vc-mode-ebitda').addEventListener('click', function () { setMode('ebitda'); });
  $('vc-mode-sde').addEventListener('click', function () { setMode('sde'); });

  var lastInputs = null;
  var lastResult = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('vc-form-error');
    errorEl.hidden = true;

    var inputs = {
      industryId: industrySelect.value,
      revenue: parseMoney($('vc-revenue').value),
      profit: parseMoney($('vc-profit').value),
      mode: mode,
      growth: $('vc-growth').value,
      recurring: $('vc-recurring').value,
      concentration: $('vc-concentration').value,
      dependence: $('vc-dependence').value,
      abComp: parseMoney($('vc-ab-comp').value),
      abOnetime: parseMoney($('vc-ab-onetime').value),
      abPersonal: parseMoney($('vc-ab-personal').value)
    };

    if (!inputs.industryId) {
      errorEl.textContent = 'Please select your industry.';
      errorEl.hidden = false;
      return;
    }
    if (inputs.profit <= 0) {
      errorEl.textContent = 'Please enter your annual ' + (mode === 'sde' ? 'SDE' : 'EBITDA') + ' — the estimate is built on it.';
      errorEl.hidden = false;
      return;
    }
    if (inputs.revenue > 0 && inputs.profit + inputs.abComp + inputs.abOnetime + inputs.abPersonal > inputs.revenue) {
      errorEl.textContent = 'Profit plus add-backs is higher than revenue — please double-check the numbers.';
      errorEl.hidden = false;
      return;
    }

    lastInputs = inputs;
    lastResult = computeValuation(inputs);
    renderResults(lastResult);
  });

  function renderResults(r) {
    $('vc-out-low').textContent = fmtMoney(r.low);
    $('vc-out-mid').textContent = fmtMoney(r.mid);
    $('vc-out-high').textContent = fmtMoney(r.high);

    // Marker position: where the midpoint multiple sits within the
    // industry's unadjusted range, clamped to the bar.
    var span = (r.industry.hi - r.industry.lo) || 1;
    var pos = ((r.midMult / (lastInputs.mode === 'sde' ? SDE_FACTOR : 1)) - r.industry.lo) / span;
    pos = Math.max(0.04, Math.min(0.96, pos));
    $('vc-meter-marker').style.left = (pos * 100).toFixed(1) + '%';

    var profitWord = lastInputs.mode === 'sde' ? 'SDE' : 'EBITDA';
    $('vc-out-basis').textContent =
      'Based on ' + fmtMoney(r.adjProfit) + ' adjusted ' + profitWord +
      (r.addbacks > 0 ? ' (including ' + fmtMoney(r.addbacks) + ' of add-backs)' : '') +
      ' at ' + fmtMult(r.loMult) + '–' + fmtMult(r.hiMult) + ' — the current ' +
      r.industry.label + ' range of ' + fmtMult(r.industry.lo) + '–' + fmtMult(r.industry.hi) +
      ' EBITDA, adjusted for your size, growth, revenue quality, and transition risk.';

    function fill(listId, items, fallback) {
      var ul = $(listId);
      ul.innerHTML = '';
      (items.length ? items : [fallback]).forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        ul.appendChild(li);
      });
    }
    fill('vc-out-up', r.ups, 'Nothing stands out yet — the full report shows which drivers add the most.');
    fill('vc-out-down', r.downs, 'No major red flags from what you’ve entered.');

    var results = $('vc-results');
    results.hidden = false;
    $('vc-gate').hidden = false;
    $('vc-success').hidden = true;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------
     Email gate → HubSpot → PDF
     ------------------------------------------------------------------ */
  function ebitdaBandFor(adjProfit, mode) {
    // Only EBITDA-mode figures map to the qualify bands; SDE overstates
    // earnings, so SDE leads are banded conservatively.
    var effective = mode === 'sde' ? adjProfit * 0.75 : adjProfit;
    if (effective >= 20000000) return '$20M+';
    if (effective >= 10000000) return '$10M - $20M';
    if (effective >= 5000000) return '$5M - $10M';
    if (effective >= 3000000) return '$3M - $5M';
    return 'Less than $3M';
  }

  var gateForm = $('vc-gate-form');
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var errorEl = $('vc-gate-error');
    errorEl.hidden = true;

    var fullName = $('vc-lead-name').value.trim();
    var email = $('vc-lead-email').value.trim();
    var phone = $('vc-lead-phone').value.trim();
    var company = $('vc-lead-company').value.trim();

    if (!fullName || !email || !phone || !company) {
      errorEl.textContent = 'Please fill in every field to get your report.';
      errorEl.hidden = false;
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errorEl.textContent = 'That email address doesn’t look right — please double-check it.';
      errorEl.hidden = false;
      return;
    }
    if (!lastResult || !lastInputs) {
      errorEl.textContent = 'Please calculate your valuation first.';
      errorEl.hidden = false;
      return;
    }

    var nameParts = fullName.split(/\s+/);
    var firstName = nameParts.shift() || fullName;
    var lastName = nameParts.join(' ');
    var band = ebitdaBandFor(lastResult.adjProfit, lastInputs.mode);
    var qualifies = band !== 'Less than $3M';

    var submitBtn = $('vc-gate-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparing your report…';

    var payload = {
      fields: [
        { name: 'firstname', value: firstName },
        { name: 'lastname', value: lastName },
        { name: 'email', value: email },
        { name: 'phone', value: phone },
        { name: 'company', value: company },
        { name: 'ibo_qualified', value: qualifies ? 'True' : 'False' },
        { name: 'respondent_role', value: 'CEO/Founder/Owner' },
        { name: 'what_is_your_approximate_annual_ebitda_profit', value: band }
      ],
      context: {
        pageUri: window.location.href,
        pageName: document.title
      }
    };

    fetch(
      'https://api.hsforms.com/submissions/v3/integration/submit/' + HUBSPOT_PORTAL_ID + '/' + HUBSPOT_FORM_GUID,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    )
      .then(function (res) {
        if (!res.ok) throw new Error('Submission failed');
        return res.json().catch(function () { return {}; });
      })
      .then(function () {
        // Same conversion labels as the qualify modal so valuation leads
        // feed the existing Google Ads conversion actions.
        fireConversion(qualifies
          ? 'AW-18411360561/XH9KCMqlj-gcELGinMtE'
          : 'AW-18411360561/jK-oCMy9vOgcELGinMtE');

        downloadPdf(company, fullName);

        $('vc-gate').hidden = true;
        var success = $('vc-success');
        success.hidden = false;
        if (qualifies) {
          var q = $('vc-success-qualified');
          q.hidden = false;
          var url = new URL(HUBSPOT_MEETING_URL);
          url.searchParams.set('firstName', firstName);
          url.searchParams.set('lastName', lastName);
          url.searchParams.set('email', email);
          url.searchParams.set('company', company);
          $('vc-meeting-link').href = url.toString();
        }
        success.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function () {
        errorEl.textContent = 'Something went wrong submitting your details. Please try again.';
        errorEl.hidden = false;
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Email me the full analysis';
      });
  });

  $('vc-redownload').addEventListener('click', function (e) {
    e.preventDefault();
    if (lastResult) downloadPdf($('vc-lead-company').value.trim(), $('vc-lead-name').value.trim());
  });

  /* ------------------------------------------------------------------
     PDF report — deterministic template rendered with jsPDF.
     Brand: navy #0e2a48, gold #a9804a, cream #f3e7db.
     ------------------------------------------------------------------ */
  var NAVY = [14, 42, 72];
  var GOLD = [169, 128, 74];
  var CREAM = [243, 231, 219];
  var MUTED = [91, 86, 76];
  var PAGE_W = 612; // Letter, points
  var PAGE_H = 792;
  var MARGIN = 64;

  function downloadPdf(company, ownerName) {
    if (!window.jspdf || !lastResult || !lastInputs) return;
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    var r = lastResult;
    var inp = lastInputs;
    var profitWord = inp.mode === 'sde' ? 'SDE' : 'EBITDA';
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var y;

    function heading(text) {
      doc.setFont('times', 'bold'); doc.setFontSize(22); doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(text, MARGIN, y);
      doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]); doc.setLineWidth(2);
      doc.line(MARGIN, y + 10, MARGIN + 56, y + 10);
      y += 36;
    }

    function body(text, opts) {
      opts = opts || {};
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
      doc.setFontSize(opts.size || 10.5);
      var c = opts.color || MUTED;
      doc.setTextColor(c[0], c[1], c[2]);
      var lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * (opts.size || 10.5) * 1.45 + (opts.after == null ? 10 : opts.after);
    }

    function tableRow(label, value, opts) {
      opts = opts || {};
      var h = 24;
      if (opts.fill) {
        doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
        doc.rect(MARGIN, y - 15, PAGE_W - MARGIN * 2, h, 'F');
      }
      doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(label, MARGIN + 8, y);
      doc.text(value, PAGE_W - MARGIN - 8, y, { align: 'right' });
      doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]); doc.setLineWidth(0.4);
      doc.line(MARGIN, y + 9, PAGE_W - MARGIN, y + 9);
      y += h;
    }

    function footer(pageLabel) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text('IBO Advisors  ·  Confidential valuation analysis for ' + company, MARGIN, PAGE_H - 36);
      doc.text(pageLabel, PAGE_W - MARGIN, PAGE_H - 36, { align: 'right' });
    }

    function newPage(pageLabel) {
      doc.addPage();
      y = MARGIN + 24;
      footer(pageLabel);
    }

    /* ---- Page 1: cover ---- */
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]); doc.setLineWidth(2);
    doc.line(MARGIN, 180, PAGE_W - MARGIN, 180);
    doc.setFont('times', 'bold'); doc.setFontSize(15); doc.setTextColor(205, 172, 124);
    doc.text('IBO ADVISORS', MARGIN, 150);
    doc.setFont('times', 'bold'); doc.setFontSize(34); doc.setTextColor(255, 255, 255);
    doc.text(doc.splitTextToSize('Confidential Valuation Analysis', PAGE_W - MARGIN * 2), MARGIN, 240);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.text('Prepared for ' + (ownerName || 'the owner') + '  ·  ' + company, MARGIN, 310);
    doc.text(today, MARGIN, 330);
    doc.setFontSize(24); doc.setFont('times', 'bold'); doc.setTextColor(205, 172, 124);
    doc.text('Estimated market value: ' + fmtMoney(r.low) + ' – ' + fmtMoney(r.high), MARGIN, 420);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(199, 163, 129);
    doc.text(doc.splitTextToSize('This report is a market-based estimate generated from the figures you provided and published lower-middle-market transaction multiples. It is not a formal valuation, an appraisal, an offer, or tax or legal advice.', PAGE_W - MARGIN * 2), MARGIN, PAGE_H - 110);

    /* ---- Page 2: executive summary ---- */
    newPage('Page 2 of 6');
    heading('Executive summary');
    body('Estimated market value of ' + company + ': ' + fmtMoneyFull(r.low) + ' to ' + fmtMoneyFull(r.high) + ', with a midpoint of ' + fmtMoneyFull(r.mid) + '.', { bold: true, size: 12, color: NAVY });
    body('The estimate applies a ' + fmtMult(r.loMult) + '–' + fmtMult(r.hiMult) + ' multiple to your adjusted ' + profitWord + ' of ' + fmtMoneyFull(r.adjProfit) + '. That multiple starts from the current ' + r.industry.label + ' benchmark of ' + fmtMult(r.industry.lo) + '–' + fmtMult(r.industry.hi) + ' EBITDA for lower-middle-market transactions and is adjusted for company size, growth trend, revenue quality, customer concentration, and owner dependence — the same levers a real buyer prices.');
    if (r.margin != null) {
      body('At ' + fmtMoneyFull(inp.revenue) + ' of revenue, your adjusted ' + profitWord + ' margin is ' + Math.round(r.margin * 100) + '%.' + (r.margin >= 0.2 ? ' Margins at this level support the upper half of your industry range.' : r.margin < 0.1 ? ' Thin margins will draw diligence attention; documented margin improvement is one of the fastest ways to raise both the multiple and the number it is applied to.' : ''));
    }
    body('What is working in your favor:', { bold: true, color: NAVY, after: 2 });
    (r.ups.length ? r.ups : ['No standout premium drivers from the inputs provided.']).forEach(function (u) { body('•  ' + u, { after: 2 }); });
    y += 8;
    body('What is holding the number down:', { bold: true, color: NAVY, after: 2 });
    (r.downs.length ? r.downs : ['No major discount drivers from the inputs provided.']).forEach(function (d) { body('•  ' + d, { after: 2 }); });

    /* ---- Page 3: adjusted EBITDA build-up ---- */
    newPage('Page 3 of 6');
    heading('Adjusted ' + profitWord + ' build-up');
    body('Buyers do not apply a multiple to the profit on your tax return. They apply it to adjusted ' + profitWord + ': reported earnings plus the expenses a new owner would not inherit. Every dollar of defensible add-back is worth that dollar times your multiple.');
    y += 6;
    tableRow('Reported annual ' + profitWord, fmtMoneyFull(inp.profit), { bold: true });
    tableRow('Owner compensation above market rate', fmtMoneyFull(inp.abComp));
    tableRow('One-time, non-recurring expenses', fmtMoneyFull(inp.abOnetime));
    tableRow('Personal expenses run through the business', fmtMoneyFull(inp.abPersonal));
    tableRow('Adjusted ' + profitWord, fmtMoneyFull(r.adjProfit), { bold: true, fill: true });
    y += 10;
    body('In a real process these add-backs must survive a quality-of-earnings review, so document each one now: employment-market comp data for the salary adjustment, invoices for one-time items, and a clean ledger for personal expenses. Undocumented add-backs are the first thing a buyer strikes — and each struck dollar costs you its multiple.');

    /* ---- Page 4: the multiple math ---- */
    newPage('Page 4 of 6');
    heading('How your multiple was built');
    body('Every factor below moves the ' + r.industry.label + ' benchmark range of ' + fmtMult(r.industry.lo) + '–' + fmtMult(r.industry.hi) + ' EBITDA up or down. This is the same arithmetic a financial buyer runs before their first offer.');
    y += 6;
    tableRow('Industry benchmark (' + r.industry.label + ')', fmtMult(r.industry.lo) + ' – ' + fmtMult(r.industry.hi), { bold: true });
    tableRow('Size factor (adjusted earnings of ' + fmtMoney(r.adjProfit) + ')', '× ' + r.sizeTier.factor.toFixed(2));
    tableRow('Growth / revenue quality / concentration / transition risk', '× ' + r.driverFactor.toFixed(2));
    if (inp.mode === 'sde') tableRow('SDE basis (multiples run below EBITDA multiples)', '× ' + SDE_FACTOR.toFixed(2));
    tableRow('Your applied multiple range', fmtMult(r.loMult) + ' – ' + fmtMult(r.hiMult), { bold: true, fill: true });
    y += 10;
    body('Where you land inside your range is not fixed. The conservative end assumes a single unprepared buyer conversation; the strong end assumes competing offers, clean earnings, and an organized process. The spread between the two ends of your range is ' + fmtMoneyFull(r.high - r.low) + ' — preparation, not luck, decides who captures it.');

    /* ---- Page 5: what you'd keep ---- */
    newPage('Page 5 of 6');
    heading('What you would actually keep');
    var price = r.mid;
    var feeRate = 0.03, taxRate = 0.288, basisRate = 0.10;
    var gain = price * (1 - basisRate);
    // Strategic sale: all cash, fees + full capital gains today.
    var stratNet = price - price * feeRate - gain * taxRate;
    // PE sale: 70% cash today, 30% rolled (untaxed now, at risk until the
    // sponsor's exit); tax and fees hit the cash portion.
    var peCash = price * 0.70;
    var peNetToday = peCash - price * feeRate - (peCash * (1 - basisRate)) * taxRate;
    // IBO: full valuation; a qualifying seller can defer capital gains.
    var iboNet = price - price * feeRate;
    body('Headline price is not what lands in your account. Using your midpoint value of ' + fmtMoneyFull(price) + ' and illustrative assumptions (3% transaction costs, 28.8% combined federal capital gains + NIIT, 10% basis, before state tax), the three main paths compare like this:');
    y += 6;
    tableRow('Strategic or full cash sale — net after fees and capital gains', fmtMoneyFull(stratNet), { bold: true });
    tableRow('Private equity sale — cash in hand today (70% cash / 30% rolled)', fmtMoneyFull(peNetToday));
    tableRow('   …plus rollover equity at risk until the sponsor’s exit', fmtMoneyFull(price * 0.30));
    tableRow('Independent Buyout — net proceeds with capital gains deferred', fmtMoneyFull(iboNet), { bold: true, fill: true });
    y += 10;
    body('The Independent Buyout line assumes the seller qualifies for capital gains deferral under the structure’s tax provisions, which depends on your specific facts — confirm with your own tax advisor. The comparison is illustrative, but the shape of it is the point: in a conventional sale the tax and the rollover risk are certain; in an IBO, deferral and control retention are structural features, not concessions you negotiate for.', { size: 9.5 });
    body('Just as important as the number: after a strategic sale the company is absorbed; after a PE sale the sponsor controls the board and the exit clock; after an IBO, leadership keeps decision-making authority and the company stays independent.', { size: 9.5 });

    /* ---- Page 6: preparation + next step ---- */
    newPage('Page 6 of 6');
    heading('The 12–24 month preparation checklist');
    [
      'Move the business off you: document processes, elevate a second layer of leadership, and make at least one key customer relationship someone else’s.',
      'Clean the earnings: separate personal expenses now, document every add-back, and consider a sell-side quality-of-earnings review before any buyer does one.',
      'De-risk revenue: push contracts and recurring arrangements wherever your industry allows, and work any 25%+ customer below that line.',
      'Know your number before anyone offers you one: decide what you need after tax — not what sounds impressive before it.',
      'Understand every path before choosing a buyer: strategic sale, private equity, management buyout, and the Independent Buyout price and behave very differently for the same company.'
    ].forEach(function (item, i) {
      body((i + 1) + '.  ' + item, { after: 6 });
    });
    y += 14;
    // Scheduling is offered only to qualified leads — same $3M adjusted-EBITDA
    // band (SDE discounted) the email gate uses for ibo_qualified.
    var qualifies = ebitdaBandFor(r.adjProfit, inp.mode) !== 'Less than $3M';
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(MARGIN, y - 16, PAGE_W - MARGIN * 2, qualifies ? 150 : 108, 'F');
    doc.setFont('times', 'bold'); doc.setFontSize(15); doc.setTextColor(205, 172, 124);
    doc.text('Talk it through with an advisor', MARGIN + 20, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(CREAM[0], CREAM[1], CREAM[2]);
    doc.text(doc.splitTextToSize('IBO Advisors has guided 500+ ownership transitions representing over $5B in owner payouts. A confidential conversation costs nothing and commits you to nothing.', PAGE_W - MARGIN * 2 - 40), MARGIN + 20, y + 30);
    if (qualifies) {
      doc.text(doc.splitTextToSize('Talk to Michael @ IBOAdvisors to talk through your options in more detail.', PAGE_W - MARGIN * 2 - 40), MARGIN + 20, y + 70);
      var btnX = MARGIN + 20, btnY = y + 86, btnW = 160, btnH = 30;
      doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
      doc.roundedRect(btnX, btnY, btnW, btnH, 4, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
      doc.text('Schedule a call', btnX + btnW / 2, btnY + 19, { align: 'center' });
      doc.link(btnX, btnY, btnW, btnH, { url: HUBSPOT_MEETING_URL });
    } else {
      doc.setTextColor(205, 172, 124);
      doc.textWithLink('www.iboadvisors.com', MARGIN + 20, y + 76, { url: 'https://www.iboadvisors.com' });
    }

    doc.save('IBO-Advisors-Valuation-Analysis.pdf');
  }
})();
