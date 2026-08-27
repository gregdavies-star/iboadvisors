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

  if (!overlay || !form) return;

  function openModal(e) {
    if (e) e.preventDefault();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    stepForm.hidden = false;
    stepDeclined.hidden = true;
    form.reset();
    hideError();
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
    var ebitdaOption = ebitdaSelect.options[ebitdaSelect.selectedIndex];
    var ebitdaBand = ebitdaSelect.value;

    if (!fullName || !email || !cellNumber || !company || !ebitdaBand) {
      showError('Please fill in every field to continue.');
      return;
    }

    var qualifies = ebitdaOption && ebitdaOption.getAttribute('data-qualifies') === 'true';

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
          var url = new URL(HUBSPOT_MEETING_URL);
          url.searchParams.set('firstName', firstName);
          url.searchParams.set('lastName', lastName);
          url.searchParams.set('email', email);
          url.searchParams.set('company', company);
          window.location.href = url.toString();
        } else {
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
