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
        submitBtn.textContent = 'Continue to scheduling';
      });
  });
})();
