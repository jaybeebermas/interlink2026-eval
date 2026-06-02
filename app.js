// ============================================================
// INTERLINK 2026 — Evaluation Form Logic
// ============================================================

// ── Configuration ──
// Replace this URL with your deployed Google Apps Script Web App URL.
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbwv0OaA8ZHi0GgFX-GY4hzjAf68krhJQ_swKS9Go754UPxm4pZNVym3T-Tqp9oiJD_x/exec";

document.addEventListener("DOMContentLoaded", () => {
  'use strict';

  // ── DOM References ──
  const form = document.getElementById('evaluationForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');

  const overlaySuccess = document.getElementById('overlaySuccess');
  const overlayError = document.getElementById('overlayError');
  const errorMessage = document.getElementById('errorMessage');
  const ratingError = document.getElementById('ratingError');

  // All rating question field names (must match radio button name attributes)
  const RATING_FIELDS = [
    'q1_registration',
    'q2_objective',
    'q3_relevance',
    'q4_time',
    'q5_methods',
    'q6_venue',
    'q7_effectiveness',
    'q8_general'
  ];

  // ── Utility: Get selected radio value ──
  function getRadioValue(name) {
    const selected = form.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : '';
  }

  // ── Utility: Validate all rating rows are filled ──
  function validateRatings() {
    let allValid = true;
    const rows = document.querySelectorAll('.rating-row');

    rows.forEach(row => {
      const fieldName = row.getAttribute('data-field');
      const value = getRadioValue(fieldName);
      if (!value) {
        row.classList.add('is-invalid');
        allValid = false;
      } else {
        row.classList.remove('is-invalid');
      }
    });

    if (!allValid) {
      ratingError.classList.add('visible');
    } else {
      ratingError.classList.remove('visible');
    }

    return allValid;
  }

  // ── Clear rating validation on selection ──
  RATING_FIELDS.forEach(name => {
    const radios = form.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const row = radio.closest('.rating-row');
        if (row) row.classList.remove('is-invalid');

        // Check if all are now filled to hide the error
        const allFilled = RATING_FIELDS.every(f => getRadioValue(f));
        if (allFilled) {
          ratingError.classList.remove('visible');
        }
      });
    });
  });

  // ── Form Submission ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger Bootstrap-style validation UI for text inputs
    form.classList.add('was-validated');

    // Validate text fields
    const textValid = form.checkValidity();

    // Validate rating rows
    const ratingsValid = validateRatings();

    if (!textValid || !ratingsValid) return;

    // Lock button
    submitBtn.disabled = true;
    submitBtnText.innerHTML = '<span class="btn-spinner"></span> Processing…';

    // Validation Guard: Alert if the script URL hasn't been configured
    if (ENDPOINT_URL === "YOUR_URL_HERE" || !ENDPOINT_URL.startsWith("http")) {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Submit Evaluation';
        errorMessage.textContent = "Configuration Error: Please update the ENDPOINT_URL constant in app.js with your actual Google Apps Script Web App URL.";
        overlayError.classList.add('active');
      }, 300);
      return;
    }

    // Build payload
    const payload = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      q1_registration: getRadioValue('q1_registration'),
      q2_objective: getRadioValue('q2_objective'),
      q3_relevance: getRadioValue('q3_relevance'),
      q4_time: getRadioValue('q4_time'),
      q5_methods: getRadioValue('q5_methods'),
      q6_venue: getRadioValue('q6_venue'),
      q7_effectiveness: getRadioValue('q7_effectiveness'),
      q8_general: getRadioValue('q8_general'),
      commentRecommendation: document.getElementById('commentRecommendation').value.trim(),
    };

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

      const result = await response.json();

      if (result.success) {
        overlaySuccess.classList.add('active');
      } else {
        throw new Error(result.message || 'Submission was not accepted by the server.');
      }
    } catch (err) {
      errorMessage.textContent = err.message || 'An unexpected error occurred. Please try again.';
      overlayError.classList.add('active');
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Submit Evaluation';
    }
  });

  // ── Overlay Handlers (globally accessible) ──
  window.exitWebsite = function () {
    window.close();
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 100);
  };

  window.dismissError = function () {
    overlayError.classList.remove('active');
  };
});
