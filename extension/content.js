'use strict';

const DATE_FIELD   = '0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32';
const CASEID_FIELD = '241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4';
const INSERT_PATH  = 'ads/caselogs/caseentry/insert';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FILL_FORM') {
    fillForm(msg.caseData, msg.autoSubmit)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: err.message }));
    return true;
  }
  if (msg.type === 'SUBMIT_FORM') {
    submitForm()
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, reason: err.message }));
    return true;
  }
});

function setAndTrigger(el, value) {
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function fillForm(c, autoSubmit) {
  const url = window.location.href.toLowerCase();
  if (url.includes('login') || url.includes('signin')) {
    return { success: false, reason: 'not_logged_in' };
  }

  const form = await waitForElement('form', 8000);
  if (!form) {
    const urlNow = window.location.href.toLowerCase();
    if (urlNow.includes('login') || urlNow.includes('signin')) {
      return { success: false, reason: 'not_logged_in' };
    }
    return { success: false, reason: 'form_not_found' };
  }

  // Date field: YYYY-MM-DD → M/D/YYYY
  if (c.case_date) {
    const dateEl = document.querySelector(`[name="${DATE_FIELD}"]`);
    const [y, m, d] = c.case_date.split('-');
    setAndTrigger(dateEl, `${parseInt(m)}/${parseInt(d)}/${y}`);
  }

  // Case ID
  setAndTrigger(document.querySelector(`[name="${CASEID_FIELD}"]`), c.case_id || '');

  // Select fields
  const selects = {
    ProcedureYear: c.case_year,
    Institutions:  c.site,
    Attendings:    c.supervisor,
    PatientTypes:  c.patient_age,
  };
  for (const [name, value] of Object.entries(selects)) {
    if (!value) continue;
    const el = document.querySelector(`select[name="${name}"]`) ||
               document.querySelector(`select#${name}`);
    if (el) setAndTrigger(el, value);
    else console.warn(`[content.js] Select not found: ${name}`);
  }

  // Checkboxes and radios — click by element ID
  const checkboxVals = [
    ...(c.asa || []),
    ...(c.anesthesia || []),
    ...(c.airway || []),
    ...(c.proc || []),
    ...(c.vasc || []),
    ...(c.mon || []),
    ...(c.neuraxial || []),
    ...(c.pnb_site || []),
    ...(c.life_threat   ? [c.life_threat]   : []),
    ...(c.difficult_airway ? [c.difficult_airway] : []),
  ];

  for (const val of checkboxVals) {
    const el = document.getElementById(val);
    if (el && !el.checked) {
      el.click();
      await sleep(150);
    } else if (!el) {
      console.warn(`[content.js] Checkbox/radio not found: ${val}`);
    }
  }

  if (!autoSubmit) {
    return { filled: true };
  }

  return await submitForm();
}

async function submitForm() {
  const submitEl = document.querySelector(
    'input[type="submit"], button[type="submit"]'
  );
  if (submitEl) {
    submitEl.click();
  } else {
    const form = document.querySelector('form');
    if (form) form.submit();
    else return { success: false, reason: 'submit_button_not_found' };
  }

  // Poll for redirect away from insert page (up to 10 seconds)
  const success = await pollForSuccess(10000);
  if (!success) return { success: false, reason: 'timeout' };
  return { success: true };
}

async function pollForSuccess(timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const url = window.location.href.toLowerCase();
    if (!url.includes(INSERT_PATH)) return true;
    if (document.querySelector('.alert-success, .success-message')) return true;
    await sleep(500);
  }
  return false;
}

function waitForElement(selector, timeout) {
  return new Promise(resolve => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }

    const t = setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { clearTimeout(t); obs.disconnect(); resolve(el); }
    });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
