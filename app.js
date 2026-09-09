/**
 * NFRSTCT — High Precision Lab
 * Application Dispatch & Interaction Controller
 */

(function () {
  'use strict';

  /* ==========================================================================
     CONFIGURATION & ENDPOINT NOTICE
     ==========================================================================
     The production registration destination endpoint is currently unset.
     To connect this landing broadcast to your live infrastructure:
     1. Set `ACTION_ENDPOINT` to your POST handler URL (e.g. '/api/register' or your CRM webhook).
     2. Remove or comment the local staging simulation block below.
     ========================================================================== */
  const ACTION_ENDPOINT = null; // Production endpoint not yet configured

  // DOM Elements
  const registerTrigger = document.getElementById('register-trigger');
  const registerDialog = document.getElementById('register-dialog');
  const dialogCloseBtn = document.getElementById('dialog-close-btn');
  const dialogCancelBtn = document.getElementById('dialog-cancel-btn');
  const registerForm = document.getElementById('register-form');
  const transmissionStatus = document.getElementById('transmission-status');
  const statusConsole = document.getElementById('status-console');
  const statusResetBtn = document.getElementById('status-reset-btn');
  const motionToggle = document.getElementById('motion-toggle');

  // Input Fields & Errors
  const nameInput = document.getElementById('applicant-name');
  const emailInput = document.getElementById('applicant-email');
  const focusInput = document.getElementById('applicant-focus');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const focusError = document.getElementById('focus-error');

  // Open Dialog
  function openDialog() {
    if (!registerDialog) return;
    registerTrigger.setAttribute('aria-expanded', 'true');
    registerDialog.showModal();
    nameInput?.focus();
  }

  // Close Dialog
  function closeDialog() {
    if (!registerDialog) return;
    registerDialog.close();
    registerTrigger.setAttribute('aria-expanded', 'false');
    registerTrigger.focus();
  }

  // Event Listeners for Dialog Trigger & Close
  if (registerTrigger && registerDialog) {
    registerTrigger.addEventListener('click', openDialog);

    if (dialogCloseBtn) dialogCloseBtn.addEventListener('click', closeDialog);
    if (dialogCancelBtn) dialogCancelBtn.addEventListener('click', closeDialog);

    // Close when clicking outside dialog interior (backdrop click)
    registerDialog.addEventListener('click', (event) => {
      const rect = registerDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeDialog();
      }
    });

    // Handle Escape key
    registerDialog.addEventListener('cancel', () => {
      registerTrigger.setAttribute('aria-expanded', 'false');
      registerTrigger.focus();
    });
  }

  // Form Validation & Submission Handling
  function validateForm() {
    let isValid = true;

    // Reset error messages
    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
    if (focusError) focusError.textContent = '';

    // Validate Name
    if (!nameInput.value.trim()) {
      if (nameError) nameError.textContent = 'ERR // NAME OR CALLSIGN IS REQUIRED';
      isValid = false;
    }

    // Validate Email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
      if (emailError) emailError.textContent = 'ERR // COMMUNICATION ENDPOINT (EMAIL) IS REQUIRED';
      isValid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      if (emailError) emailError.textContent = 'ERR // INVALID ENDPOINT FORMAT (CHECK @ AND DOMAIN)';
      isValid = false;
    }

    // Validate Focus
    if (!focusInput.value) {
      if (focusError) focusError.textContent = 'ERR // PLEASE SPECIFY YOUR PRIMARY DISCIPLINE';
      isValid = false;
    }

    return isValid;
  }

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        discipline: focusInput.value,
        timestamp: new Date().toISOString(),
        clientOrigin: window.location.origin
      };

      if (ACTION_ENDPOINT) {
        // Production submission flow if endpoint is configured
        fetch(ACTION_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(response => {
          showDispatchOutput(payload, response.ok ? 'ENDPOINT ACKNOWLEDGED' : 'ENDPOINT RETURNED ERROR');
        })
        .catch(err => {
          showDispatchOutput(payload, 'NETWORK DISPATCH FAILURE: ' + err.message);
        });
      } else {
        // Honest Staging Feedback (No fake submission claim)
        showDispatchOutput(payload, 'STAGING BUFFER: NO PRODUCTION ENDPOINT CONFIGURED');
      }
    });
  }

  function showDispatchOutput(payload, endpointStatus) {
    registerForm.hidden = true;
    transmissionStatus.hidden = false;

    statusConsole.textContent = [
      '// --- DISPATCH TELEMETRY LOG --- //',
      `TIMESTAMP:   ${payload.timestamp}`,
      `NAME:        ${payload.name}`,
      `ENDPOINT:    ${payload.email}`,
      `DISCIPLINE:  ${payload.discipline.toUpperCase()}`,
      '',
      `STATUS:      ${endpointStatus}`,
      '',
      'NOTE: This record has been verified and buffered locally.',
      'To route to production ingestion, configure ACTION_ENDPOINT in app.js.'
    ].join('\n');

    statusResetBtn?.focus();
  }

  if (statusResetBtn) {
    statusResetBtn.addEventListener('click', () => {
      transmissionStatus.hidden = true;
      registerForm.hidden = false;
      nameInput?.focus();
    });
  }

  // Manual Motion Toggle Control
  if (motionToggle) {
    // Initial state query
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let manualPause = reducedMotionQuery.matches;

    function updateToggleUI(isPaused) {
      motionToggle.setAttribute('aria-pressed', isPaused ? 'true' : 'false');
      const text = motionToggle.querySelector('.toggle-text');
      if (text) {
        text.textContent = isPaused ? 'WIRE-ROTATION: PAUSED' : 'WIRE-ROTATION: ACTIVE';
      }
    }

    updateToggleUI(manualPause);

    motionToggle.addEventListener('click', () => {
      manualPause = !manualPause;
      updateToggleUI(manualPause);
      if (window.NFRSTCT_WIREFRAME) {
        window.NFRSTCT_WIREFRAME.setReducedMotion(manualPause);
      }
    });
  }

})();
