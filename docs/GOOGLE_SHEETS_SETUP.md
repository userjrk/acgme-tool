# Google Sheets Setup Guide

This guide sets up a shared Google Sheet that receives every case
saved by any resident using the app. You do this setup ONCE.
Residents don't need a Google account or any setup.

---

## How It Works

```
Resident's phone
    ↓  taps "Save Case"
case_log.html
    ↓  POST request (no login needed)
Google Apps Script (your account)
    ↓  appends a row
Your Google Sheet  ←  all residents' cases, forever
```

The Apps Script acts as a middleman. Residents never see your
Google account. They just open the app URL and use it.

---

## Step 1 — Create the Google Sheet

1. Go to sheets.google.com → create a new blank sheet
2. Name it: **ACGME Case Log — [Program Name]**
3. Add these headers in Row 1 (one per column, exact order):

```
resident_name | case_date | case_id | case_year | site | supervisor_name |
patient_age | life_threatening | difficult_airway | asa | anesthesia_type |
airway_management | procedure_category | vascular_access | monitoring |
neuraxial_site | pnb_site | submitted_at
```

4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit`

---

## Step 2 — Create the Apps Script

1. In your Google Sheet: **Extensions → Apps Script**
2. Delete all existing code
3. Paste this exactly:

```javascript
const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

    const chipLabels = {
      "33":"12-65yr","34":"≥65yr",
      "156628":"ASA 1","156632":"ASA 2","156634":"ASA 3",
      "156636":"ASA 4","156630":"ASA 5","156631":"ASA 6",
      "1256330":"General Maint.","156641":"MAC/Sedation",
      "1256331":"Spinal","1256332":"Epidural","156646":"CSE",
      "156648":"Single Shot","156647":"Continuous",
      "156654":"Oral ETT","1256333":"Supraglottic",
      "1256334":"Direct","1256335":"Indirect (Video)",
      "156655":"Nasal ETT","2298046":"Flex Bronchoscopic",
      "2298047":"Awake","156650":"Mask","156666":"Jet Vent",
      "156674":"Bronchial Blocker","1256336":"DLT",
      "148":"Anticipated DA","149":"Unanticipated DA",
      "46":"Non-Trauma LTP","134":"Trauma LTP",
      "156682":"Cardiac w/o CPB","156681":"Cardiac + CPB",
      "156685":"Major Vessels Endo","156684":"Major Vessels Open",
      "156688":"Intracranial Endo","156689":"Intracranial Nonvasc",
      "156687":"Intracranial Vasc","156692":"C-Section",
      "156686":"C-Section (hi-risk)","156690":"Vaginal",
      "156691":"Vaginal (hi-risk)","156683":"Intrathoracic Non-Cardiac",
      "1256338":"Arterial Line","1256339":"Central Venous",
      "156693":"US-Guided","156700":"PA Catheter",
      "1256341":"CSF Drain","156708":"IONM","156707":"TEE",
      "156722":"Lumbar","156720":"T1-7","156721":"T8-12",
      "156719":"Cervical","156723":"Caudal",
      "1911477":"Adductor Canal","156730":"Ankle","156734":"Axillary",
      "1911478":"Erector Spinae","156735":"Femoral","156732":"Infraclavicular",
      "156731":"Interscalene","156737":"Lumbar Plexus","156739":"Paravertebral",
      "156729":"Popliteal","1911476":"Quadratus Lumb.","156738":"Retrobulbar",
      "156740":"Saphenous","156736":"Sciatic","156733":"Supraclavicular",
      "1911475":"TAP","1256340":"Other"
    };

    function label(val) {
      if (!val) return '';
      if (Array.isArray(val)) return val.map(v => chipLabels[v] || v).join(' | ');
      return chipLabels[val] || val;
    }

    const site = data.site === '51592' ? 'AdventHealth Orlando' : 'Center for Pain Mgmt';

    sheet.appendRow([
      data.resident_name || '',
      data.case_date || '',
      data.case_id || '',
      data.case_year || '',
      site,
      data.supervisor_name || '',
      label(data.patient_age),
      label(data.life_threat),
      label(data.difficult_airway),
      label(data.asa),
      label(data.anesthesia),
      label(data.airway),
      label(data.proc),
      label(data.vasc),
      label(data.mon),
      label(data.neuraxial),
      label(data.pnb_site),
      new Date().toISOString()
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test this works — run manually from the Apps Script editor
function testAppend() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        resident_name: 'Test Resident',
        case_date: '2026-05-24',
        case_year: '1',
        site: '51592',
        supervisor_name: 'Cole, Britten',
        patient_age: '33',
        asa: ['156634'],
        anesthesia: ['1256330'],
        airway: ['156654'],
        proc: [], vasc: [], mon: [], neuraxial: [], pnb_site: []
      })
    }
  };
  doPost(fakeEvent);
  Logger.log('Test row appended — check your sheet');
}
```

4. Replace `PASTE_YOUR_SHEET_ID_HERE` with your actual Sheet ID
5. Click **Save** (floppy disk icon)

---

## Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Set:
   - Description: `ACGME Case Log`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   `https://script.google.com/macros/s/LONG_STRING_HERE/exec`

---

## Step 4 — Add the URL to the App

Open `app/case_log.html` and find this section near the top of the script:

```javascript
const SHEETS_CONFIG = {
  enabled: false,
  url: '',
};
```

Change it to:

```javascript
const SHEETS_CONFIG = {
  enabled: true,
  url: 'https://script.google.com/macros/s/YOUR_URL_HERE/exec',
};
```

Save the file and push to GitHub. Done.

---

## Step 5 — Test It

1. Open the app in a browser
2. Enter a test case and hit Save
3. Wait 5 seconds, open your Google Sheet
4. You should see a new row with all the case details

If no row appears: go back to Apps Script editor, run `testAppend()`
manually and check for errors in the Execution Log.

---

## Program-Wide Use — What Residents Experience

- They open the app URL (your GitHub Pages URL)
- They type their name once — it stays saved on their device
- They log cases as normal
- Every save automatically appears in your shared sheet
- They never see your Google account or sheet
- No login, no setup on their end

---

## What You See in the Sheet

Each row = one case. Columns are human-readable.
You can filter by resident name, date, attending, procedure type.
At end of week: you see every resident's cases in one place.
You can sort/filter to pull just your own cases for ACGME submission.

---

## Re-deploying After Changes

If you ever update the Apps Script code:
1. Click **Deploy → Manage deployments**
2. Click the edit (pencil) icon
3. Change version to **New version**
4. Click **Deploy**

The URL stays the same — no changes needed in the HTML.
