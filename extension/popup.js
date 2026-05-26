'use strict';

const LABELS = {
  "33":"12-65yr","34":"≥65yr",
  "156628":"ASA 1","156632":"ASA 2","156634":"ASA 3","156636":"ASA 4","156630":"ASA 5","156631":"ASA 6",
  "1256330":"General","156641":"MAC/Sed","1256331":"Spinal","1256332":"Epidural","156646":"CSE",
  "156648":"Single Shot PNB","156647":"Continuous PNB",
  "156654":"Oral ETT","1256333":"SGA","1256334":"Direct Laryngoscopy","1256335":"Video Laryngoscopy",
  "156655":"Nasal ETT","2298046":"Flex Bronch","2298047":"Awake","156650":"Mask",
  "156674":"Bronchial Blocker","1256336":"DLT",
  "148":"Anticipated DA","149":"Unanticipated DA",
  "46":"Non-Trauma LTP","134":"Trauma LTP",
  "156682":"Cardiac w/o CPB","156681":"Cardiac+CPB",
  "156685":"Maj Vessels Endo","156684":"Maj Vessels Open",
  "156688":"Intracranial Endo","156689":"Intracranial Nonvasc","156687":"Intracranial Vasc",
  "156692":"C-Section","156686":"C-Section Hi-Risk","156690":"Vaginal","156691":"Vaginal Hi-Risk",
  "156683":"Intrathoracic",
  "1256338":"Art Line","1256339":"CVL","156693":"US-Guided","156700":"PA Cath",
  "1256341":"CSF Drain","156708":"IONM","156707":"TEE",
  "156722":"Lumbar","156720":"T1-7","156721":"T8-12","156719":"Cervical","156723":"Caudal",
  "1911477":"Adductor Canal","156729":"Popliteal","156736":"Sciatic","156735":"Femoral",
  "156731":"Interscalene","156733":"Supraclavicular","1911475":"TAP","1911478":"ESP","1256340":"Other PNB"
};

// ── STATE ──
let allCases = [];
let newCases = [];
let submittedIds = new Set();
let sessionResults = [];
let currentIdx = 0;
let submissionMode = 'review';

// ── DOM REFS ──
const statusPill    = document.getElementById('status-pill');
const statusText    = document.getElementById('status-text');
const mainBody      = document.getElementById('main-body');
const notAcgme      = document.getElementById('not-acgme');
const fileZone      = document.getElementById('file-zone');
const fileInput     = document.getElementById('file-input');
const fileIcon      = document.getElementById('file-icon');
const fileLabel     = document.getElementById('file-label');
const fileSub       = document.getElementById('file-sub');
const caseSummary   = document.getElementById('case-summary');
const submitBtn     = document.getElementById('submit-btn');
const progressWrap  = document.getElementById('progress-wrap');
const progressLabel = document.getElementById('progress-label');
const progressPct   = document.getElementById('progress-pct');
const progressFill  = document.getElementById('progress-fill');
const resultsEl     = document.getElementById('results');
const finalSummary  = document.getElementById('final-summary');
const exportBtn     = document.getElementById('export-btn');
const warning       = document.getElementById('warning');
const casePreview   = document.getElementById('case-preview');
const previewCounter = document.getElementById('preview-counter');
const previewDate   = document.getElementById('preview-date');
const previewTags   = document.getElementById('preview-tags');
const submitNextBtn = document.getElementById('submit-next-btn');
const skipBtn       = document.getElementById('skip-btn');

// ── INIT ──
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onAcgme = tab?.url?.includes('apps.acgme.org');

  if (!onAcgme) {
    mainBody.style.display = 'none';
    notAcgme.classList.add('show');
    statusPill.className = 'status-pill error';
    statusText.textContent = 'Not on ACGME';
    return;
  }

  statusPill.className = 'status-pill ready';
  statusText.textContent = 'Ready';

  const stored = await chrome.storage.local.get(['submission_mode']);
  setMode(stored.submission_mode || 'review', false);
})();

// ── MODE TOGGLE ──
function setMode(mode, save = true) {
  submissionMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  if (save) chrome.storage.local.set({ submission_mode: mode });
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// ── FILE INPUT ──
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
fileZone.addEventListener('dragover', e => { e.preventDefault(); fileZone.classList.add('drag'); });
fileZone.addEventListener('dragleave', () => fileZone.classList.remove('drag'));
fileZone.addEventListener('drop', e => {
  e.preventDefault();
  fileZone.classList.remove('drag');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

async function handleFile(file) {
  if (!file) return;
  let parsed;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
  } catch (e) {
    fileIcon.textContent = '✗';
    fileLabel.textContent = 'Invalid JSON file';
    fileSub.textContent = e.message;
    return;
  }

  allCases = parsed;
  const stored = await chrome.storage.local.get(['submitted_case_ids']);
  submittedIds = new Set(stored.submitted_case_ids || []);
  newCases = allCases.filter(c => !submittedIds.has(c.id));

  const skipped = allCases.length - newCases.length;
  const resident = allCases[0]?.resident_name || '—';
  const dates = getDatesRange(allCases);

  fileZone.classList.add('loaded');
  fileIcon.textContent = '✓';
  fileLabel.textContent = file.name;
  fileSub.textContent = 'File loaded successfully';

  document.getElementById('sum-resident').textContent = resident;
  document.getElementById('sum-total').textContent = newCases.length + ' cases';
  document.getElementById('sum-already').textContent = skipped + ' (will skip)';
  document.getElementById('sum-dates').textContent = dates;
  caseSummary.classList.add('show');

  if (skipped > 0) warning.classList.add('show');

  submitBtn.disabled = newCases.length === 0;
  submitBtn.textContent = newCases.length > 0
    ? (submissionMode === 'review' ? `Review ${newCases.length} Cases →` : `Submit ${newCases.length} Cases →`)
    : 'No new cases to submit';
}

function getDatesRange(cases) {
  if (!cases.length) return '—';
  const dates = cases.map(c => c.case_date).sort();
  const fmt = d => { const [, m, day] = d.split('-'); return `${parseInt(m)}/${parseInt(day)}`; };
  if (dates[0] === dates[dates.length - 1]) return dates[0];
  return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
}

// ── SUBMIT ──
submitBtn.addEventListener('click', async () => {
  if (submitBtn.classList.contains('done')) { resetAll(); return; }
  if (newCases.length === 0) return;

  submitBtn.disabled = true;
  submitBtn.classList.add('running');
  resultsEl.classList.add('show');
  sessionResults = [];
  currentIdx = 0;

  // Show already-skipped cases first
  allCases.filter(c => submittedIds.has(c.id)).forEach(c => addResult('skip', c, 'Already submitted'));

  if (submissionMode === 'review') {
    await startReviewMode();
  } else {
    await startAutoMode();
  }
});

// ── REVIEW MODE ──
async function startReviewMode() {
  casePreview.classList.add('show');
  await fillNextCaseForReview(0);
}

async function fillNextCaseForReview(idx) {
  if (idx >= newCases.length) { finishAll(); return; }
  currentIdx = idx;
  const c = newCases[idx];

  previewCounter.textContent = `Case ${idx + 1} of ${newCases.length}`;
  previewDate.textContent = `${c.case_date} · ${c.supervisor_name || '—'}`;

  const tagVals = [
    c.patient_age,
    ...(c.asa || []), ...(c.anesthesia || []), ...(c.airway || []),
    ...(c.proc || []), ...(c.vasc || []), ...(c.mon || []),
  ].filter(Boolean);
  previewTags.innerHTML = tagVals
    .map(v => LABELS[v] ? `<span class="preview-tag">${LABELS[v]}</span>` : '')
    .join('');

  submitNextBtn.disabled = true;
  skipBtn.disabled = true;
  statusText.textContent = 'Filling…';
  statusPill.className = 'status-pill';

  try {
    const res = await msgBackground({ type: 'FILL_CASE', caseData: c, autoSubmit: false });
    if (res.reason === 'not_logged_in') { handleNotLoggedIn(); return; }
  } catch (e) {
    addResult('fail', c, 'Could not fill form');
    sessionResults.push({ case: c, status: 'fail', reason: e.message });
    await fillNextCaseForReview(idx + 1);
    return;
  }

  statusPill.className = 'status-pill ready';
  statusText.textContent = 'Review form';
  submitNextBtn.disabled = false;
  skipBtn.disabled = false;
}

submitNextBtn.addEventListener('click', async () => {
  submitNextBtn.disabled = true;
  skipBtn.disabled = true;
  const c = newCases[currentIdx];

  statusText.textContent = 'Submitting…';
  statusPill.className = 'status-pill';

  let res;
  try { res = await msgBackground({ type: 'SUBMIT_CURRENT' }); }
  catch (e) { res = { success: false, reason: e.message }; }

  if (res.success) {
    addResult('success', c, 'Submitted');
    sessionResults.push({ case: c, status: 'success' });
    const { submitted_case_ids: ids = [] } = await chrome.storage.local.get(['submitted_case_ids']);
    ids.push(c.id);
    await chrome.storage.local.set({ submitted_case_ids: ids });
  } else {
    addResult('fail', c, res.reason || 'Submission failed');
    sessionResults.push({ case: c, status: 'fail', reason: res.reason });
  }

  statusPill.className = 'status-pill ready';
  statusText.textContent = 'Ready';
  await fillNextCaseForReview(currentIdx + 1);
});

skipBtn.addEventListener('click', async () => {
  skipBtn.disabled = true;
  submitNextBtn.disabled = true;
  const c = newCases[currentIdx];
  addResult('skip', c, 'Skipped');
  sessionResults.push({ case: c, status: 'skip' });
  await fillNextCaseForReview(currentIdx + 1);
});

// ── AUTO MODE ──
async function startAutoMode() {
  progressWrap.classList.add('show');
  const total = newCases.length;

  for (let i = 0; i < newCases.length; i++) {
    const c = newCases[i];
    progressLabel.textContent = `Submitting case ${i + 1} of ${total}…`;
    progressPct.textContent = Math.round((i / total) * 100) + '%';
    progressFill.style.width = Math.round((i / total) * 100) + '%';

    const pendingEl = addResult('pending', c, 'Submitting…');

    let res;
    try { res = await msgBackground({ type: 'FILL_CASE', caseData: c, autoSubmit: true }); }
    catch (e) { res = { success: false, reason: e.message }; }

    if (res.reason === 'not_logged_in') {
      pendingEl.className = 'result-item fail';
      pendingEl.querySelector('.result-icon').textContent = '✗';
      pendingEl.querySelector('.result-sub').textContent = 'Not logged in — stopping';
      handleNotLoggedIn();
      return;
    }

    if (res.success) {
      pendingEl.className = 'result-item success';
      pendingEl.querySelector('.result-icon').textContent = '✓';
      pendingEl.querySelector('.result-sub').textContent = 'Submitted';
      sessionResults.push({ case: c, status: 'success' });
      const { submitted_case_ids: ids = [] } = await chrome.storage.local.get(['submitted_case_ids']);
      ids.push(c.id);
      await chrome.storage.local.set({ submitted_case_ids: ids });
    } else {
      pendingEl.className = 'result-item fail';
      pendingEl.querySelector('.result-icon').textContent = '✗';
      pendingEl.querySelector('.result-sub').textContent = res.reason || 'Failed';
      sessionResults.push({ case: c, status: 'fail', reason: res.reason });
    }

    if (i < newCases.length - 1) await sleep(1500);
  }

  progressFill.style.width = '100%';
  progressFill.classList.add('done');
  progressLabel.textContent = 'Done';
  progressPct.textContent = '100%';
  finishAll();
}

// ── FINISH ──
function finishAll() {
  const submitted = sessionResults.filter(r => r.status === 'success').length;
  const failed = sessionResults.filter(r => r.status === 'fail').length;
  const skipped = sessionResults.filter(r => r.status === 'skip').length
    + allCases.filter(c => submittedIds.has(c.id)).length;

  document.getElementById('final-submitted').textContent = submitted;
  document.getElementById('final-failed').textContent = failed;
  document.getElementById('final-skipped').textContent = skipped;
  finalSummary.classList.add('show');
  exportBtn.classList.add('show');
  casePreview.classList.remove('show');

  submitBtn.disabled = false;
  submitBtn.classList.remove('running');
  submitBtn.classList.add('done');
  submitBtn.textContent = failed > 0
    ? `Done · ${failed} failed — tap to reset`
    : 'All done · Tap to reset';

  statusPill.className = 'status-pill ready';
  statusText.textContent = 'Done';
}

// ── NOT LOGGED IN ──
function handleNotLoggedIn() {
  casePreview.classList.remove('show');
  statusPill.className = 'status-pill error';
  statusText.textContent = 'Session expired';
  mainBody.style.display = 'none';
  notAcgme.classList.add('show');
  document.querySelector('.not-acgme h2').textContent = 'Session expired';
  document.querySelector('.not-acgme p').textContent =
    'Your ACGME session expired. Log in again, then reopen the extension.';
}

// ── RESULTS ──
function addResult(type, c, sub) {
  const el = document.createElement('div');
  el.className = 'result-item ' + type;
  const icons = { success: '✓', fail: '✗', skip: '→', pending: '⋯' };
  el.innerHTML = `
    <span class="result-icon">${icons[type]}</span>
    <div class="result-text">
      <div>${c.case_date} · ${c.supervisor_name || '—'}</div>
      <div class="attending result-sub">${sub}</div>
    </div>`;
  resultsEl.appendChild(el);
  resultsEl.scrollTop = resultsEl.scrollHeight;
  return el;
}

// ── EXPORT ──
exportBtn.addEventListener('click', () => {
  const report = {
    generated: new Date().toISOString(),
    results: sessionResults.map(r => ({
      case_date: r.case.case_date,
      supervisor_name: r.case.supervisor_name,
      id: r.case.id,
      status: r.status,
      reason: r.reason || null,
    })),
  };
  const json = JSON.stringify(report, null, 2);
  const filename = `submission_report_${new Date().toISOString().split('T')[0]}.json`;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
});

// ── RESET ──
function resetAll() {
  allCases = []; newCases = []; sessionResults = []; currentIdx = 0;
  fileZone.classList.remove('loaded');
  fileIcon.textContent = '📂';
  fileLabel.textContent = 'Select JSON export';
  fileSub.textContent = 'Exported from your ACGME Case Log app';
  caseSummary.classList.remove('show');
  warning.classList.remove('show');
  progressWrap.classList.remove('show');
  resultsEl.classList.remove('show');
  resultsEl.innerHTML = '';
  finalSummary.classList.remove('show');
  exportBtn.classList.remove('show');
  casePreview.classList.remove('show');
  progressFill.style.width = '0%';
  progressFill.classList.remove('done');
  submitBtn.classList.remove('done', 'running');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Select a file to begin';
  fileInput.value = '';
  statusPill.className = 'status-pill ready';
  statusText.textContent = 'Ready';
}

// ── HELPERS ──
function msgBackground(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, res => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(res);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
