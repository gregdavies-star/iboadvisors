/* ==========================================================================
   IBO Advisors — "Learn More" qualify modal
   Opens on any [data-ibo-open-modal] trigger, submits to the HubSpot Forms
   API, and routes qualified leads (EBITDA >= $3M) to the HubSpot meeting
   scheduler. Leads under $3M EBITDA see an in-modal thank-you message
   instead of a scheduler, matching the qualification logic used on the
   live iboadvisors.com site.
   ========================================================================== */
(function () {
  // HubSpot identifiers — same Portal ID / Form used by iboadvisors.com so
  // leads submitted here land in the same HubSpot account.
  var HUBSPOT_PORTAL_ID = '245308986';
  var HUBSPOT_FORM_GUID = 'ec6307ff-aa5a-4e75-b423-11846eab6ad7';
  var HUBSPOT_MEETING_URL = 'https://meetings-na2.hubspot.com/michael-chasen/discussing-the-ibo';

  var overlay = document.getElementById('ibo-modal-overlay');
  var closeBtn = document.getElementById('ibo-modal-close');
  var declinedCloseBtn = document.getElementById('ibo-modal-declined-close');
  var form = document.getElementById('ibo-modal-form');
  var stepForm = document.getElementById('ibo-modal-step-form');
  var stepDeclined = document.getElementById('ibo-modal-step-declined');
  var submitBtn = document.getElementById('ibo-modal-submit');
  var errorEl = document.getElementById('ibo-form-error');
  var ebitdaSelect = document.getElementById('ibo-ebitdaBand');
  var ebitdaWrap = document.getElementById('ibo-ebitda-wrap');
  var roleRadios = document.querySelectorAll('input[name="respondentRole"]');

  if (!overlay || !form) return;

  // Toggle the EBITDA question: only owners/founders/CEOs answer it.
  // Advisors skip straight to scheduling with no EBITDA gate.
  function updateRoleUI() {
    var selected = document.querySelector('input[name="respondentRole"]:checked');
    var isOwner = !!selected && selected.value === 'CEO/Founder/Owner';
    ebitdaWrap.hidden = !isOwner;
    if (isOwner) {
      ebitdaSelect.setAttribute('required', 'required');
    } else {
      ebitdaSelect.removeAttribute('required');
      ebitdaSelect.value = '';
    }
  }

  roleRadios.forEach(function (radio) {
    radio.addEventListener('change', updateRoleUI);
  });

  // Fires all conversion events via the Google Ads global site tag
  // (gtag.js) already loaded in <head> on every page.
  // GA4 event helper (the Google Ads conversion helper below is separate).
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
  }

  function fireConversion(sendTo) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', { send_to: sendTo });
    }
  }

  // Time on Site 30s: fires once per page view, 30s after load.
  setTimeout(function () {
    fireConversion('AW-18411360561/KKztCMelj-gcELGinMtE');
  }, 30000);

  function openModal(e) {
    if (e) e.preventDefault();
    // Click to Learn More: fires every time a Learn More trigger opens the modal.
    fireConversion('AW-18411360561/IM9lCM-9vOgcELGinMtE');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    stepForm.hidden = false;
    stepDeclined.hidden = true;
    form.reset();
    hideError();
    updateRoleUI();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Next';
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  // Wire up every CTA that should open the modal.
  document.querySelectorAll('[data-ibo-open-modal]').forEach(function (el) {
    el.addEventListener('click', openModal);
  });

  closeBtn.addEventListener('click', closeModal);
  declinedCloseBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var fullName = document.getElementById('ibo-fullName').value.trim();
    var email = document.getElementById('ibo-email').value.trim();
    var cellNumber = document.getElementById('ibo-cellNumber').value.trim();
    var company = document.getElementById('ibo-company').value.trim();
    var selectedRole = document.querySelector('input[name="respondentRole"]:checked');
    var respondentRole = selectedRole ? selectedRole.value : '';
    var isOwner = respondentRole === 'CEO/Founder/Owner';
    var ebitdaOption = ebitdaSelect.options[ebitdaSelect.selectedIndex];
    var ebitdaBand = ebitdaSelect.value;

    if (!fullName || !email || !cellNumber || !company || !respondentRole) {
      showError('Please fill in every field to continue.');
      return;
    }

    if (isOwner && !ebitdaBand) {
      showError('Please fill in every field to continue.');
      return;
    }

    // Advisors always qualify for scheduling; owners/founders/CEOs are
    // gated by the EBITDA threshold selected above.
    var qualifies = isOwner
      ? (ebitdaOption && ebitdaOption.getAttribute('data-qualifies') === 'true')
      : true;

    var nameParts = fullName.split(/\s+/);
    var firstName = nameParts.shift() || fullName;
    var lastName = nameParts.join(' ');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Checking…';

    var payload = {
      fields: [
        { name: 'firstname', value: firstName },
        { name: 'lastname', value: lastName },
        { name: 'email', value: email },
        { name: 'phone', value: cellNumber },
        { name: 'company', value: company },
        { name: 'ibo_qualified', value: qualifies ? 'True' : 'False' },
        { name: 'respondent_role', value: respondentRole },
        { name: 'what_is_your_approximate_annual_ebitda_profit', value: ebitdaBand }
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
        track('modal_submit', {
          ebitda_band: isOwner ? ebitdaBand : 'advisor',
          respondent_role: respondentRole,
          qualified: qualifies ? 'yes' : 'no'
        });
        if (qualifies) {
          // Learn More Form - Qualified Lead
          fireConversion('AW-18411360561/XH9KCMqlj-gcELGinMtE');
          var url = new URL(HUBSPOT_MEETING_URL);
          url.searchParams.set('firstName', firstName);
          url.searchParams.set('lastName', lastName);
          url.searchParams.set('email', email);
          url.searchParams.set('company', company);
          window.location.href = url.toString();
        } else {
          // Learn More Form - Unqualified Lead
          fireConversion('AW-18411360561/jK-oCMy9vOgcELGinMtE');
          stepForm.hidden = true;
          stepDeclined.hidden = false;
        }
      })
      .catch(function () {
        showError('Something went wrong submitting your details. Please try again.');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Next';
      });
  });
})();

/* ==========================================================================
   Mobile navigation toggle
   The ☰ button is revealed by CSS at <=960px but was never wired to
   anything, so mobile visitors had no navigation at all. This opens a
   dropdown panel containing the nav links plus the "Learn More" CTA. The CTA
   is moved into the links container while open so both share one panel, then
   restored to its place in the bar on close/desktop.
   ========================================================================== */
(function () {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var toggle = nav.querySelector('.nav-toggle');
  var links = nav.querySelector('.nav__links');
  var cta = nav.querySelector('.nav__cta');
  if (!toggle || !links) return;

  if (!links.id) links.id = 'primary-nav';
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-expanded', 'false');

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
    if (nav.classList.contains('nav-open')) close();
    else open();
  });

  // Tapping a link or the CTA closes the menu (CTA still opens the modal).
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) close();
  });

  // Restore the desktop bar if the viewport grows past the breakpoint.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && nav.classList.contains('nav-open')) close();
  });
})();

/* ==========================================================================
   Contact modal
   The "Contact" nav/footer links open a choice modal: "Schedule a meeting"
   hands off to the existing Learn More qualify modal (the schedule button
   also carries data-ibo-open-modal, which the modal IIFE above wires up);
   "Send the team a message" opens a Name/Email/Message form that posts to
   the HubSpot Forms API — the same portal the Learn More form already uses —
   so the message lands in HubSpot as a contact. Set the message form's
   notification recipient to michael@iboadvisors.com in HubSpot (form
   Options -> "Send form notification emails to") so Michael is emailed on
   each submission; no code handles delivery.
   ========================================================================== */
(function () {
  var overlay = document.getElementById('ibo-contact-overlay');
  if (!overlay) return;

  // Same HubSpot portal as the Learn More form. Create a separate HubSpot form
  // (fields: first name, last name, email, message) for these general messages,
  // set its notification recipient to michael@iboadvisors.com, and paste its
  // form GUID below. Until it's set the form fails closed with a note to email.
  var HUBSPOT_PORTAL_ID = '245308986';
  var HUBSPOT_MESSAGE_FORM_GUID = 'c16ecef7-48a5-4373-8410-beebb620d337';
  var CONTACT_EMAIL = 'michael@iboadvisors.com';

  var closeBtn = document.getElementById('ibo-contact-close');
  var stepChoice = document.getElementById('ibo-contact-step-choice');
  var stepMessage = document.getElementById('ibo-contact-step-message');
  var stepSent = document.getElementById('ibo-contact-step-sent');
  var scheduleBtn = document.getElementById('ibo-contact-schedule');
  var messageBtn = document.getElementById('ibo-contact-message');
  var form = document.getElementById('ibo-message-form');
  var errorEl = document.getElementById('ibo-message-error');
  var submitBtn = document.getElementById('ibo-message-submit');
  var sentClose = document.getElementById('ibo-contact-sent-close');

  function show(step) {
    stepChoice.hidden = step !== 'choice';
    stepMessage.hidden = step !== 'message';
    stepSent.hidden = step !== 'sent';
  }
  function openContact(e) {
    if (e) e.preventDefault();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    hideError();
    show('choice');
  }
  function closeContact() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }
  function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
  function hideError() { errorEl.hidden = true; errorEl.textContent = ''; }

  document.querySelectorAll('[data-ibo-open-contact]').forEach(function (el) {
    el.addEventListener('click', openContact);
  });
  closeBtn.addEventListener('click', closeContact);
  if (sentClose) sentClose.addEventListener('click', closeContact);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeContact(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeContact();
  });

  // "Schedule a meeting" also carries data-ibo-open-modal (wired by the modal
  // IIFE above) which opens the Learn More flow; here we just close this modal.
  if (scheduleBtn) scheduleBtn.addEventListener('click', function () { closeContact(); });
  if (messageBtn) messageBtn.addEventListener('click', function () { hideError(); show('message'); });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();
      var name = document.getElementById('ibo-msg-name').value.trim();
      var email = document.getElementById('ibo-msg-email').value.trim();
      var message = document.getElementById('ibo-msg-message').value.trim();

      if (!name || !email || !message) {
        showError('Please fill in every field.');
        return;
      }
      if (HUBSPOT_MESSAGE_FORM_GUID === 'YOUR_HUBSPOT_MESSAGE_FORM_GUID') {
        showError('Messaging isn’t set up yet — please email ' + CONTACT_EMAIL + ' directly.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      var nameParts = name.split(/\s+/);
      var firstName = nameParts.shift() || name;
      var lastName = nameParts.join(' ');

      fetch(
        'https://api.hsforms.com/submissions/v3/integration/submit/' +
          HUBSPOT_PORTAL_ID + '/' + HUBSPOT_MESSAGE_FORM_GUID,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: [
              { name: 'firstname', value: firstName },
              { name: 'lastname', value: lastName },
              { name: 'email', value: email },
              { name: 'message', value: message }
            ],
            context: { pageUri: window.location.href, pageName: document.title }
          })
        }
      )
        .then(function (res) {
          if (!res.ok) throw new Error('Submission failed');
          return res.json().catch(function () { return {}; });
        })
        .then(function () { show('sent'); })
        .catch(function () {
          showError('Something went wrong sending your message. Please email ' + CONTACT_EMAIL + '.');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send message';
        });
    });
  }
})();

/* ==========================================================================
   GA4: schedule_click - any click on a link to the scheduling page
   ========================================================================== */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var isScheduler = href.indexOf('meetings-na2.hubspot.com') !== -1 || href === '/meet' || href.indexOf('iboadvisors.com/meet') !== -1;
    if (!isScheduler) return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'schedule_click', { link_url: href, page_path: window.location.pathname });
    }
  }, true);
})();
