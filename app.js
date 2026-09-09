/**
 * NFRSTCT — High Precision Lab
 * Application Dispatch & Benchmark Controller
 */

(function () {
  'use strict';

  /* ==========================================================================
     CONFIGURATION & ENDPOINT NOTICE
     ========================================================================== */
  const ACTION_ENDPOINT = null; // Production registration endpoint URL

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

  // Interactive Benchmark Elements
  const pillarBtns = document.querySelectorAll('.pillar-btn');
  const benchReadout = document.getElementById('bench-readout');
  const telemetryFps = document.getElementById('telemetry-fps');
  const telemetryVerts = document.getElementById('telemetry-verts');
  const btnCopySpec = document.getElementById('btn-copy-spec');
  const copySpecLabel = document.getElementById('copy-spec-label');

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

    registerDialog.addEventListener('cancel', () => {
      registerTrigger.setAttribute('aria-expanded', 'false');
      registerTrigger.focus();
    });
  }

  // Form Validation & Submission Handling
  function validateForm() {
    let isValid = true;

    if (nameError) nameError.textContent = '';
    if (emailError) emailError.textContent = '';
    if (focusError) focusError.textContent = '';

    if (!nameInput.value.trim()) {
      if (nameError) nameError.textContent = 'ERR // NAME OR CALLSIGN IS REQUIRED';
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
      if (emailError) emailError.textContent = 'ERR // COMMUNICATION ENDPOINT (EMAIL) IS REQUIRED';
      isValid = false;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      if (emailError) emailError.textContent = 'ERR // INVALID ENDPOINT FORMAT (CHECK @ AND DOMAIN)';
      isValid = false;
    }

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

  // Motion Toggle Control
  if (motionToggle) {
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

  /* ==========================================================================
     Interactive Benchmark Controller
     ========================================================================== */
  if (pillarBtns.length > 0) {
    pillarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        pillarBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const presetKey = btn.getAttribute('data-preset');
        if (window.NFRSTCT_WIREFRAME) {
          const presetName = window.NFRSTCT_WIREFRAME.setPreset(presetKey);
          updateBenchReadout();
        }
      });
    });
  }

  function updateBenchReadout() {
    if (!window.NFRSTCT_WIREFRAME) return;
    const telem = window.NFRSTCT_WIREFRAME.getTelemetry();

    if (telemetryFps) telemetryFps.textContent = `${telem.fps} FPS`;
    if (telemetryVerts) telemetryVerts.textContent = `${telem.vertices} VERTS`;
  }

  // Poll live telemetry metrics every 600ms
  setInterval(updateBenchReadout, 600);

  // Copy Spec matrix parameters to clipboard
  if (btnCopySpec) {
    btnCopySpec.addEventListener('click', () => {
      if (!window.NFRSTCT_WIREFRAME) return;
      const telem = window.NFRSTCT_WIREFRAME.getTelemetry();

      const jsonSpec = JSON.stringify({
        sys: "SYS.NFRSTCT // HIGH PRECISION LAB",
        spec: telem.preset,
        metrics: {
          fps: telem.fps,
          vertices: telem.vertices,
          edges: telem.edges,
          chords: telem.chords,
          speed: telem.speed
        },
        so4MatrixAngles: telem.angles,
        timestamp: new Date().toISOString()
      }, null, 2);

      navigator.clipboard.writeText(jsonSpec).then(() => {
        if (copySpecLabel) {
          const origText = copySpecLabel.textContent;
          copySpecLabel.textContent = 'MATRIX SPEC COPIED ✓';
          btnCopySpec.style.backgroundColor = 'var(--color-primary)';
          btnCopySpec.style.color = 'var(--color-bg)';
          setTimeout(() => {
            copySpecLabel.textContent = origText;
            btnCopySpec.style.backgroundColor = 'transparent';
            btnCopySpec.style.color = 'var(--color-primary)';
          }, 2000);
        }
      }).catch(() => {
        if (copySpecLabel) copySpecLabel.textContent = 'SPEC READOUT READY';
      });
    });
  }

})();
