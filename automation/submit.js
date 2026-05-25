#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');

// ── Args ──
const args    = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
if (fileIdx === -1 || !args[fileIdx + 1]) {
  console.error('Usage: node automation/submit.js --file data/cases_YYYY-MM-DD.json');
  process.exit(1);
}
const inputFile = path.resolve(args[fileIdx + 1]);
if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

// ── Log file paths ──
const DATA_DIR  = path.resolve(__dirname, '../data');
const SUBMITTED = path.join(DATA_DIR, 'submitted_log.json');
const FAILED    = path.join(DATA_DIR, 'failed_cases.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(p, fallback) {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback; }
  catch(_) { return fallback; }
}

function appendJSON(p, entry) {
  const arr = readJSON(p, []);
  arr.push(entry);
  fs.writeFileSync(p, JSON.stringify(arr, null, 2));
}

// ── Readable labels for terminal output ──
const LABELS = {
  '51592':'AdventHealth Orlando','55630':'Pain Mgmt - Orlando',
  '33':'Age 12-65','34':'Age 65+',
  '156628':'ASA1','156632':'ASA2','156634':'ASA3','156636':'ASA4','156630':'ASA5','156631':'ASA6',
  '46':'Non-Trauma LTP','134':'Trauma LTP',
  '1256330':'General Maintenance','156641':'MAC/Sedation','1256331':'Spinal','1256332':'Epidural','156646':'CSE',
  '156648':'Single Shot PNB','156647':'Continuous PNB',
  '156654':'Oral ETT','1256333':'SGA','1256334':'DL','1256335':'VL','156655':'Nasal ETT',
  '2298046':'Flex Bronchoscopic','2298047':'Awake','156650':'Mask','156666':'Jet Vent','1256337':'Other Airway',
  '156674':'Bronchial Blocker','1256336':'DLT','148':'Anticipated DA','149':'Unanticipated DA',
  '156682':'Cardiac w/o CPB','156681':'Cardiac+CPB',
  '156685':'Endovascular','156684':'Open Vessel',
  '156688':'IC Endovascular','156689':'IC Nonvasc Open','156687':'IC Vascular Open',
  '156692':'C-Section','156686':'C-Section HR','156690':'Vaginal Delivery','156691':'Vaginal Delivery HR',
  '156683':'Intrathoracic Non-Cardiac',
  '1256338':'Arterial Line','1256339':'Central Venous','156693':'US-Guided','156700':'PA Catheter',
  '1256341':'CSF Drain','156708':'IONM','156707':'TEE',
  '156722':'Lumbar','156720':'T1-7','156721':'T8-12','156719':'Cervical','156723':'Caudal',
  '1911477':'Adductor Canal','156730':'Ankle','156734':'Axillary','1911478':'ESP',
  '156735':'Femoral','156732':'Infraclavicular','156731':'Interscalene',
  '156737':'Lumbar Plexus','156739':'Paravertebral','156729':'Popliteal',
  '1911476':'QL','156738':'Retrobulbar','156740':'Saphenous','156736':'Sciatic',
  '156733':'Supraclavicular','1911475':'TAP','1256340':'Other PNB'
};
function label(v) { return LABELS[v] || v; }
function labels(arr) { return (arr||[]).map(label).join(', ') || '—'; }

// ── Date formatter: "2026-05-24" → "5/24/2026" ──
function toAcgmeDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

// ── Readable case summary for terminal ──
function summarize(c) {
  const lines = [
    `  Date:         ${c.case_date}${c.case_id ? ' (ID: ' + c.case_id + ')' : ''}`,
    `  Supervisor:   ${c.supervisor_name}`,
    `  Site:         ${label(c.site)}`,
    `  Patient Age:  ${label(c.patient_age)}`,
    `  ASA:          ${labels(c.asa)}`,
    `  Anesthesia:   ${labels(c.anesthesia)}`,
    `  Airway:       ${labels(c.airway)}`,
  ];
  if ((c.lung_iso||[]).length)      lines.push(`  Lung Iso:     ${labels(c.lung_iso)}`);
  if (c.life_threat)                lines.push(`  Life-threat:  ${label(c.life_threat)}`);
  if (c.difficult_airway)           lines.push(`  Diff Airway:  ${label(c.difficult_airway)}`);
  if ((c.proc||[]).length)          lines.push(`  Procedure:    ${labels(c.proc)}`);
  if ((c.vasc||[]).length)          lines.push(`  Vasc Access:  ${labels(c.vasc)}`);
  if ((c.mon||[]).length)           lines.push(`  Monitoring:   ${labels(c.mon)}`);
  if ((c.neuraxial||[]).length)     lines.push(`  Neuraxial:    ${labels(c.neuraxial)}`);
  if ((c.pnb_site||[]).length)      lines.push(`  PNB Site:     ${labels(c.pnb_site)}`);
  return lines.join('\n');
}

// ── ACGME form field names ──
const ACGME_URL    = 'https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert';
const DATE_FIELD   = '0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32';
const CASEID_FIELD = '241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4';

// ── Fill a case into the open ACGME form ──
async function fillCase(page, c) {
  await page.goto(ACGME_URL, { waitUntil: 'domcontentloaded' });

  // Text inputs
  await page.fill(`[name="${DATE_FIELD}"]`, toAcgmeDate(c.case_date));
  if (c.case_id) await page.fill(`[name="${CASEID_FIELD}"]`, c.case_id);

  // Selects
  await page.selectOption('[name="ProcedureYear"]', String(c.case_year));
  await page.selectOption('[name="Institutions"]',  String(c.site));
  await page.selectOption('[name="Attendings"]',    String(c.supervisor));
  // PatientTypes is a select, not a checkbox
  await page.selectOption('[name="PatientTypes"]',  String(c.patient_age));

  // Checkboxes by element ID (attribute selector — reliable for numeric IDs)
  async function checkById(val) {
    if (!val) return;
    try {
      const el      = page.locator(`[id="${val}"]`).first();
      const exists  = await el.count() > 0;
      if (!exists)  { console.warn(`  [warn] element id="${val}" not found`); return; }
      const checked = await el.isChecked().catch(() => false);
      if (!checked) await el.check();
    } catch(e) {
      console.warn(`  [warn] could not check id="${val}": ${e.message}`);
    }
  }

  for (const v of (c.asa||[]))          await checkById(v);
  for (const v of (c.anesthesia||[]))   await checkById(v);
  for (const v of (c.airway||[]))       await checkById(v);
  for (const v of (c.lung_iso||[]))     await checkById(v);
  for (const v of (c.proc||[]))         await checkById(v);
  for (const v of (c.vasc||[]))         await checkById(v);
  for (const v of (c.mon||[]))          await checkById(v);
  for (const v of (c.neuraxial||[]))    await checkById(v);
  for (const v of (c.pnb_site||[]))     await checkById(v);
  if (c.life_threat)                    await checkById(c.life_threat);
  if (c.difficult_airway)               await checkById(c.difficult_airway);
}

// ── Submit the filled form ──
async function submitForm(page) {
  const submitBtn = page.locator('input[type="submit"], button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  const errEl  = page.locator('.validation-summary-errors, .field-validation-error').first();
  const hasErr = await errEl.isVisible().catch(() => false);
  if (hasErr) {
    const errText = await errEl.textContent().catch(() => 'Unknown form error');
    throw new Error(`Form error: ${errText.trim()}`);
  }
}

// ── Wait for login if not already authenticated ──
async function ensureLoggedIn(page) {
  await page.goto(ACGME_URL, { waitUntil: 'domcontentloaded' });
  const url = page.url();
  const isLoginPage = url.toLowerCase().includes('login') || url.toLowerCase().includes('signin');
  if (isLoginPage) {
    console.log('\n  Not logged in. Please log in in the browser window.');
    console.log('   Waiting up to 5 minutes...\n');
    await page.waitForURL(
      u => !u.toLowerCase().includes('login') && !u.toLowerCase().includes('signin'),
      { timeout: 300000 }
    );
    console.log('Login detected. Continuing.\n');
  }
}

// ── Readline prompt helper ──
function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ── Main ──
(async () => {
  let allCases;
  try {
    allCases = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  } catch(e) {
    console.error(`Failed to parse JSON: ${e.message}`);
    process.exit(1);
  }
  if (!Array.isArray(allCases)) {
    console.error('Input file must contain a JSON array of cases');
    process.exit(1);
  }

  const submitted    = readJSON(SUBMITTED, []);
  const submittedIds = new Set(submitted.map(s => s.id));
  const pending      = allCases.filter(c => !submittedIds.has(c.id));

  if (pending.length === 0) {
    console.log('All cases in this file have already been submitted. Nothing to do.');
    process.exit(0);
  }

  console.log('\nACGME Case Submitter');
  console.log('─────────────────────────────────────');
  console.log(`Total in file:     ${allCases.length}`);
  console.log(`Already submitted: ${allCases.length - pending.length}`);
  console.log(`To submit:         ${pending.length}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page    = await context.newPage();
  const rl      = readline.createInterface({ input: process.stdin, output: process.stdout });

  let submitted_count = 0, skipped = 0, failed = 0;

  try {
    await ensureLoggedIn(page);

    for (let i = 0; i < pending.length; i++) {
      const c = pending[i];
      console.log(`\n── Case ${i + 1} of ${pending.length} ─────────────────────────────`);
      console.log(summarize(c));
      console.log('');

      // Fill form
      try {
        await fillCase(page, c);
      } catch(e) {
        console.error(`  x Error filling form: ${e.message}`);
        const ans = await ask(rl, '  r=retry, s=skip, q=quit: ');
        const cmd = ans.trim().toLowerCase();
        if (cmd === 'r') { i--; continue; }
        if (cmd === 'q') { console.log('\nQuitting.'); break; }
        skipped++;
        continue;
      }

      // Prompt
      const ans = await ask(rl, '  Press Enter to submit, s to skip, q to quit: ');
      const cmd = ans.trim().toLowerCase();

      if (cmd === 'q') {
        console.log('\nQuitting.');
        break;
      }
      if (cmd === 's') {
        console.log('  Skipped.');
        skipped++;
        continue;
      }

      // Submit
      try {
        await submitForm(page);
        console.log('  Submitted.');
        appendJSON(SUBMITTED, { id: c.id, case_date: c.case_date, submitted_at: new Date().toISOString() });
        submitted_count++;
      } catch(e) {
        console.error(`  x Failed: ${e.message}`);
        appendJSON(FAILED, { case: c, error: e.message, failed_at: new Date().toISOString() });
        failed++;
      }
    }
  } finally {
    rl.close();
    await browser.close();
  }

  console.log('\n── Summary ──────────────────────────────────');
  console.log(`  Submitted: ${submitted_count}`);
  console.log(`  Failed:    ${failed}${failed > 0 ? '  (see data/failed_cases.json)' : ''}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log('');
})();
