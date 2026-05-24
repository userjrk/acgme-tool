# ACGME Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA (app/case_log.html) for fast ACGME case entry with dual-layer storage and JSON/CSV export, plus a Playwright automation script (automation/submit.js) for interactive batch submission to the ACGME portal.

**Architecture:** DOM-first single HTML file — all chips, cards, and sections are static HTML; JS manages state and toggles. PWA files (manifest.json, service_worker.js) are siblings in app/. Automation script is a standalone Node.js file that reads exported JSON and interacts with the ACGME portal via Playwright.

**Tech Stack:** Vanilla HTML/CSS/JS, Google Fonts (DM Mono + Syne), IndexedDB + localStorage, Web Share API / File System Access API, Node.js 18+, Playwright

---

## Phase 1: Web App

---

### Task 1: Scaffold file structure and rebuild FORM_SPEC.json

**Files:**
- Create: `app/case_log.html`
- Create: `app/manifest.json`
- Create: `app/service_worker.js`
- Create: `app/icons/` (directory)
- Create: `automation/submit.js`
- Modify: `docs/FORM_SPEC.json`
- Modify: `.gitignore`

- [ ] Create directories and empty files (PowerShell from project root):
```powershell
New-Item -ItemType Directory -Force -Path "app/icons", "automation", "data"
New-Item -ItemType File -Force -Path "app/case_log.html", "app/manifest.json", "app/service_worker.js", "automation/submit.js"
```

- [ ] Write `.gitignore`:
```
data/
node_modules/
```

- [ ] Write `docs/FORM_SPEC.json` (complete field mapping):
```json
{
  "endpoint": "https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert",
  "method": "POST",
  "fields": {
    "case_date":  { "formName": "0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32", "type": "text", "format": "M/D/YYYY" },
    "case_id":    { "formName": "241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4", "type": "text" },
    "case_year":  { "formName": "ProcedureYear", "type": "select", "options": { "1": "CA-1" } },
    "site":       { "formName": "Institutions",  "type": "select", "options": { "51592": "AdventHealth Orlando", "55630": "Center for Pain Management - Orlando" } },
    "supervisor": { "formName": "Attendings",    "type": "select" },
    "patient_age":{ "formName": "PatientTypes",  "type": "checkbox", "options": { "33": "12–65 yr", "34": "≥65 yr" } },
    "asa": { "type": "checkbox_by_id", "options": {
      "156628": "ASA 1", "156632": "ASA 2", "156634": "ASA 3",
      "156636": "ASA 4", "156630": "ASA 5", "156631": "ASA 6",
      "156629": "1E", "156633": "2E", "156635": "3E", "156637": "4E", "156626": "5E"
    }},
    "life_threat": { "type": "radio_by_id", "options": { "46": "Non-Trauma Life-Threatening", "134": "Trauma Life-Threatening" } },
    "anesthesia": { "type": "checkbox_by_id", "options": {
      "1256330": "General Maintenance", "156641": "MAC / Sedation",
      "1256331": "Spinal", "1256332": "Epidural", "156646": "CSE",
      "156648": "Single Shot PNB", "156647": "Continuous PNB"
    }},
    "airway": { "type": "checkbox_by_id", "options": {
      "156654": "Oral ETT", "1256333": "Supraglottic Airway",
      "1256334": "Direct Laryngoscopy", "1256335": "Indirect (Video) Laryngoscopy",
      "156655": "Nasal ETT", "2298046": "Flex Bronchoscopic", "2298047": "Awake",
      "156650": "Mask", "156666": "Jet Ventilation", "1256337": "Other"
    }},
    "difficult_airway": { "type": "radio_by_id", "options": { "148": "Anticipated", "149": "Unanticipated" } },
    "lung_isolation": { "type": "checkbox_by_id", "options": { "156674": "Bronchial Blocker", "1256336": "DLT" } },
    "proc": { "type": "checkbox_by_id", "subcategories": {
      "cardiac":       { "156682": "Cardiac w/o CPB", "156681": "Cardiac with CPB" },
      "major_vessels": { "156685": "Endovascular", "156684": "Open" },
      "intracerebral": { "156688": "Endovascular", "156689": "Nonvasc Open", "156687": "Vascular Open" },
      "delivery":      { "156692": "C-Section", "156686": "C-Section (high-risk)", "156690": "Vaginal Delivery", "156691": "Vaginal Delivery (high-risk)" },
      "other":         { "156683": "Intrathoracic Non-Cardiac" }
    }},
    "vasc":    { "type": "checkbox_by_id", "options": { "1256338": "Arterial Line", "1256339": "Central Venous", "156693": "US-Guided", "156700": "PA Catheter" } },
    "mon":     { "type": "checkbox_by_id", "options": { "1256341": "CSF Drain", "156708": "IONM (Electrophysiologic)", "156707": "TEE" } },
    "neuraxial":{ "type": "checkbox_by_id", "options": { "156722": "Lumbar", "156720": "T1-7", "156721": "T8-12", "156719": "Cervical", "156723": "Caudal" } },
    "pnb_site":{ "type": "checkbox_by_id", "options": {
      "1911477": "Adductor Canal", "156730": "Ankle", "156734": "Axillary",
      "1911478": "Erector Spinae Plane", "156735": "Femoral", "156732": "Infraclavicular",
      "156731": "Interscalene", "156737": "Lumbar Plexus", "156739": "Paravertebral",
      "156729": "Popliteal", "1911476": "Quadratus Lumborum", "156738": "Retrobulbar",
      "156740": "Saphenous", "156736": "Sciatic", "156733": "Supraclavicular",
      "1911475": "Transverse Abdominal Plane (TAP)", "1256340": "Other"
    }}
  },
  "supervisors": {
    "743216": "Adkins, Jakob",    "738774": "Angert, Kevin",    "650569": "Ariani, Kayvan",
    "743489": "Axelrod, Mac",     "650551": "Bissessar, Ravi",  "650444": "Bryskin, Robert",
    "755003": "Capone, Nicholas", "743217": "Chacon, Joshua",   "741070": "Cole, Britten",
    "650553": "Davidovich, Isaac","746882": "Doyle, Charles",   "650473": "Eberhardt, Kara",
    "736431": "Fan, John",        "650545": "Freiberg, Stephen","755005": "Gallo, Elimio",
    "741066": "Geubelle, Gregory","743219": "Gonzalez Ciccarelli, Luis","751637": "Grodin, Benjamin",
    "748654": "Gutierrez, Marc",  "744373": "Hadaway, Jonathan","726834": "Hansen, Bradley",
    "746884": "Hong, Andrew",     "742742": "Hulsey, Alina",    "741069": "Idigo, Nnaemeka",
    "753976": "Kaiser, Eric",     "746885": "Kamdar, Jay",      "752636": "Kumar, Vikas",
    "650548": "Mansfield, Frederick","741068": "Maziad, Jennifer","748656": "Merrell, Matthew",
    "650461": "Michaels, Robert", "742437": "Moorjani, Arun",   "745309": "Newbern, Matthew",
    "745303": "Norris, Frederick","741071": "O'Hara, Brian",    "726836": "Olin, Douglas",
    "752635": "Parisian, David",  "748655": "Phillips, Justin", "744372": "Radmall, Brandon",
    "742362": "Rasmussen, Aaron", "741065": "Rosemeier, Frank", "748657": "Schroeder, Gregory",
    "745306": "Sefton, William",  "746883": "Silvestrini-Suarez, Marco","752634": "Solby, Bryan",
    "651090": "Spalding, Howard", "650558": "Stewart, Douglas", "738764": "Stine, Todd",
    "746886": "Stoner, Matthew",  "744374": "Strickland, Jeffrey","742743": "Tao, David",
    "755008": "Tongson, Sebastian","743218": "Warner, Norman",  "650546": "Weinstein, Adam",
    "650554": "Weltman, Nathan",  "726840": "Wieland, Tommy",  "752645": "Wilkhu, Harshdeep"
  }
}
```

- [ ] Commit:
```
git add docs/FORM_SPEC.json .gitignore app/ automation/
git commit -m "scaffold: create file structure and rebuild FORM_SPEC.json"
```

---

### Task 2: Generate PWA icons and create manifest + service worker

**Files:**
- Create: `app/icons/icon-192.png`
- Create: `app/icons/icon-512.png`
- Write: `app/manifest.json`
- Write: `app/service_worker.js`

- [ ] Create `generate-icons.js` in project root (run once, then delete):
```javascript
const { createCanvas } = require('canvas');
const fs = require('fs');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, size, size);
  const r = size * 0.38;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = '#4fc3f7';
  ctx.fill();
  ctx.fillStyle = '#0a0c10';
  ctx.font = `bold ${Math.round(size * 0.38)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size / 2);
  return canvas.toBuffer('image/png');
}

fs.writeFileSync('app/icons/icon-192.png', makeIcon(192));
fs.writeFileSync('app/icons/icon-512.png', makeIcon(512));
console.log('Icons generated.');
```

- [ ] Check if `canvas` package is available:
```powershell
node -e "require('canvas')" 2>$null
if (-not $?) {
  Write-Host "canvas not available — using fallback SVG-to-PNG approach"
}
```

  If `canvas` is not available, use this alternative that creates minimal valid PNGs using a pure-JS approach — write `generate-icons.js` as:
```javascript
// Minimal 1x1 transparent PNG, scaled — placeholder until canvas is available
// Instead, write SVG data URIs embedded as PNG via fetch in browser, or use this:
const fs = require('fs');
const { execSync } = require('child_process');

// Write SVG files, convert with built-in Windows tools if available
const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0c10"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.38}" fill="#4fc3f7"/>
  <text x="${size/2}" y="${size/2}" font-family="sans-serif" font-size="${Math.round(size*0.38)}" font-weight="bold" fill="#0a0c10" text-anchor="middle" dominant-baseline="middle">A</text>
</svg>`;

fs.writeFileSync('app/icons/icon-192.svg', svgTemplate(192));
fs.writeFileSync('app/icons/icon-512.svg', svgTemplate(512));
console.log('SVG icons written to app/icons/. Convert to PNG manually or use an online tool, then delete the .svg files.');
```

- [ ] Run the icon generator:
```powershell
node generate-icons.js
```
  Expected: `Icons generated.` or instructions for SVG conversion.

- [ ] Delete the generator script:
```powershell
Remove-Item generate-icons.js
```

- [ ] Write `app/manifest.json`:
```json
{
  "name": "ACGME Case Log",
  "short_name": "Case Log",
  "description": "Fast case entry for ACGME ADS portal",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0c10",
  "theme_color": "#4fc3f7",
  "start_url": "./case_log.html",
  "scope": "./",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] Write `app/service_worker.js`:
```javascript
const CACHE = 'acgme-v1';
const ASSETS = [
  './case_log.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (!res || res.status !== 200 || res.type === 'opaque') return res;
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
```

- [ ] Commit:
```
git add app/manifest.json app/service_worker.js app/icons/
git commit -m "pwa: add manifest, service worker, and app icons"
```

---

### Task 3: Write case_log.html — full HTML structure and CSS

**Files:**
- Write: `app/case_log.html` (complete file — HTML skeleton + all form section HTML + full inline CSS, no JS yet)

- [ ] Write the complete `app/case_log.html`. The file must contain all of the following in order:

  **`<head>`** — charset, viewport, PWA meta tags, fonts, manifest link, inline `<style>` with all CSS.

  **`<body>`** structure:
  ```html
  <div id="app">
    <header id="header">...</header>
    <main id="form-body">
      <!-- section cards in order -->
    </main>
    <footer id="footer">...</footer>
  </div>
  <div id="cases-panel" class="panel hidden">...</div>
  <script>/* all JS goes here in later tasks */</script>
  ```

  **Full `app/case_log.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Case Log">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="manifest" href="manifest.json">
  <title>ACGME Case Log</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0a0c10;
      --surface:  #12151c;
      --surface2: #1a1e28;
      --accent:   #4fc3f7;
      --accent-dim: #1e4a5e;
      --auto:     #a78bfa;
      --auto-dim: #2e1f5e;
      --text:     #e8eaf0;
      --text-dim: #6b7280;
      --yes:      #22c55e;
      --no:       #374151;
      --danger:   #ef4444;
      --warn:     #f59e0b;
      --radius:   12px;
      --chip-h:   44px;
      --header-h: 56px;
      --footer-h: 64px;
      --font-mono: 'DM Mono', monospace;
      --font-head: 'Syne', sans-serif;
    }

    html, body { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-mono); font-size: 14px; }

    /* ── Layout ── */
    #app { display: flex; flex-direction: column; height: 100dvh; max-width: 600px; margin: 0 auto; }

    #header {
      position: sticky; top: 0; z-index: 10;
      height: var(--header-h); min-height: var(--header-h);
      background: var(--surface); border-bottom: 1px solid var(--surface2);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; gap: 12px;
    }
    #header h1 { font-family: var(--font-head); font-size: 16px; font-weight: 700; color: var(--accent); letter-spacing: .03em; }

    #form-body { flex: 1; overflow-y: auto; padding: 12px 12px calc(var(--footer-h) + 12px); display: flex; flex-direction: column; gap: 12px; }

    #footer {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 600px;
      height: var(--footer-h); background: var(--surface);
      border-top: 1px solid var(--surface2);
      display: flex; align-items: center; gap: 10px; padding: 0 12px;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* ── Badge ── */
    #badge {
      min-width: 44px; height: 32px; border-radius: 999px;
      background: var(--surface2); color: var(--text-dim);
      border: none; cursor: pointer; font-family: var(--font-mono);
      font-size: 12px; font-weight: 500; padding: 0 10px;
      display: flex; align-items: center; gap: 5px;
      transition: background .2s, color .2s;
    }
    #badge.warn  { background: #78350f; color: var(--warn); }
    #badge.alert { background: #7f1d1d; color: var(--danger); }

    /* ── Cards ── */
    .card { background: var(--surface); border-radius: var(--radius); overflow: hidden; }
    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; background: var(--surface2);
    }
    .card-label { font-family: var(--font-head); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); }
    .card-body { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 8px; }
    .card-body.hidden { display: none; }

    /* ── Yes/No toggle ── */
    .yn-toggle { display: flex; border-radius: 8px; overflow: hidden; border: 1px solid var(--surface2); }
    .yn-toggle button {
      flex: 1; height: 32px; border: none; cursor: pointer;
      font-family: var(--font-mono); font-size: 12px; font-weight: 500;
      background: transparent; color: var(--text-dim); transition: background .15s, color .15s;
    }
    .yn-toggle button.active-yes { background: #14532d; color: var(--yes); }
    .yn-toggle button.active-no  { background: var(--surface2); color: var(--text-dim); }

    /* ── Chips ── */
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      height: var(--chip-h); min-width: 44px; padding: 0 14px;
      border-radius: 999px; border: 1.5px solid var(--surface2);
      background: var(--surface2); color: var(--text-dim);
      font-family: var(--font-mono); font-size: 13px; font-weight: 400;
      cursor: pointer; white-space: nowrap; transition: all .15s;
      display: flex; align-items: center;
    }
    .chip:active { transform: scale(.95); }
    .chip.selected { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
    .chip.auto-selected { background: var(--auto-dim); border-color: var(--auto); color: var(--auto); box-shadow: 0 0 8px var(--auto-dim); }

    /* ── Expander ── */
    .expander-btn {
      background: none; border: none; color: var(--accent); font-family: var(--font-mono);
      font-size: 12px; cursor: pointer; padding: 2px 0; text-decoration: underline; width: fit-content;
    }
    .expander-content.hidden { display: none; }

    /* ── Inputs ── */
    .input-row { display: flex; flex-direction: column; gap: 4px; }
    .input-label { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: .06em; }
    input[type="text"], input[type="date"], select {
      width: 100%; height: var(--chip-h); padding: 0 12px;
      background: var(--surface2); border: 1.5px solid var(--surface2);
      border-radius: var(--radius); color: var(--text);
      font-family: var(--font-mono); font-size: 14px;
      outline: none; transition: border-color .15s;
      -webkit-appearance: none; appearance: none;
    }
    input[type="text"]:focus, input[type="date"]:focus, select:focus { border-color: var(--accent); }
    input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.7); }
    select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }

    /* supervisor sticky badge */
    #supervisor-sticky { display: none; font-size: 11px; font-weight: 500; color: var(--yes); background: #14532d; padding: 2px 8px; border-radius: 999px; }

    /* ── Section subgroup headers ── */
    .subgroup { display: flex; flex-direction: column; gap: 6px; }
    .subgroup-label { font-size: 11px; color: var(--text-dim); font-style: italic; }

    /* ── Footer buttons ── */
    #btn-clear {
      flex: 0 0 80px; height: 44px; border-radius: var(--radius);
      background: var(--surface2); border: 1.5px solid var(--surface2);
      color: var(--text-dim); font-family: var(--font-mono); font-size: 13px;
      cursor: pointer;
    }
    #btn-save {
      flex: 1; height: 44px; border-radius: var(--radius);
      background: var(--accent); border: none;
      color: #0a0c10; font-family: var(--font-head); font-size: 14px; font-weight: 700;
      cursor: pointer; letter-spacing: .03em;
    }
    #btn-save:active { opacity: .85; }

    /* ── Cases Panel ── */
    .panel {
      position: fixed; inset: 0; z-index: 100;
      background: var(--bg); display: flex; flex-direction: column;
      max-width: 600px; margin: 0 auto;
    }
    .panel.hidden { display: none; }
    .panel-header {
      height: var(--header-h); min-height: var(--header-h);
      background: var(--surface); border-bottom: 1px solid var(--surface2);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px;
    }
    .panel-header h2 { font-family: var(--font-head); font-size: 15px; color: var(--text); }
    .panel-close {
      width: 44px; height: 44px; background: none; border: none;
      color: var(--text-dim); font-size: 22px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
    }
    .panel-body { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .panel-actions { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--surface2); flex-wrap: wrap; }
    .panel-actions button {
      height: 40px; padding: 0 14px; border-radius: var(--radius);
      border: 1.5px solid var(--surface2); background: var(--surface2);
      color: var(--text); font-family: var(--font-mono); font-size: 12px;
      cursor: pointer;
    }
    .panel-actions button.danger { border-color: var(--danger); color: var(--danger); }

    /* ── Case Card ── */
    .case-card { background: var(--surface); border-radius: var(--radius); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .case-card-header { display: flex; justify-content: space-between; align-items: center; }
    .case-date-label { font-family: var(--font-head); font-size: 14px; color: var(--accent); }
    .case-delete { width: 32px; height: 32px; background: none; border: 1px solid var(--surface2); border-radius: 8px; color: var(--text-dim); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .case-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .case-tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: var(--surface2); color: var(--text-dim); }

    /* ── Toast ── */
    #toast {
      position: fixed; bottom: calc(var(--footer-h) + 12px); left: 50%; transform: translateX(-50%);
      background: var(--surface2); color: var(--text); font-size: 13px;
      padding: 8px 16px; border-radius: var(--radius); z-index: 200;
      opacity: 0; transition: opacity .2s; pointer-events: none; white-space: nowrap;
    }
    #toast.show { opacity: 1; }
  </style>
</head>
<body>
<div id="app">

  <!-- HEADER -->
  <header id="header">
    <h1>Case Log</h1>
    <button id="badge" onclick="openPanel()" aria-label="Saved cases">
      <span id="badge-count">0</span> cases
    </button>
  </header>

  <!-- FORM -->
  <main id="form-body">

    <!-- Case Basics -->
    <div class="card">
      <div class="card-header"><span class="card-label">Case Basics</span></div>
      <div class="card-body">
        <div class="input-row">
          <label class="input-label" for="case-date">Date</label>
          <input type="date" id="case-date">
        </div>
        <div class="input-row">
          <label class="input-label" for="case-id">Case ID (optional)</label>
          <input type="text" id="case-id" placeholder="Epic encounter #">
        </div>
        <div class="input-row">
          <label class="input-label" for="site-select">Site</label>
          <select id="site-select">
            <option value="51592">AdventHealth Orlando</option>
            <option value="55630">Center for Pain Management - Orlando</option>
          </select>
        </div>
        <div class="input-row">
          <label class="input-label" for="year-select">Case Year</label>
          <select id="year-select">
            <option value="1">CA-1</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Supervisor -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Supervisor</span>
        <span id="supervisor-sticky">STICKY</span>
      </div>
      <div class="card-body">
        <div class="input-row">
          <input type="text" id="supervisor-input" placeholder="Type to search attending…" list="supervisor-list" autocomplete="off">
          <datalist id="supervisor-list">
            <option value="Adkins, Jakob" data-id="743216">
            <option value="Angert, Kevin" data-id="738774">
            <option value="Ariani, Kayvan" data-id="650569">
            <option value="Axelrod, Mac" data-id="743489">
            <option value="Bissessar, Ravi" data-id="650551">
            <option value="Bryskin, Robert" data-id="650444">
            <option value="Capone, Nicholas" data-id="755003">
            <option value="Chacon, Joshua" data-id="743217">
            <option value="Cole, Britten" data-id="741070">
            <option value="Davidovich, Isaac" data-id="650553">
            <option value="Doyle, Charles" data-id="746882">
            <option value="Eberhardt, Kara" data-id="650473">
            <option value="Fan, John" data-id="736431">
            <option value="Freiberg, Stephen" data-id="650545">
            <option value="Gallo, Elimio" data-id="755005">
            <option value="Geubelle, Gregory" data-id="741066">
            <option value="Gonzalez Ciccarelli, Luis" data-id="743219">
            <option value="Grodin, Benjamin" data-id="751637">
            <option value="Gutierrez, Marc" data-id="748654">
            <option value="Hadaway, Jonathan" data-id="744373">
            <option value="Hansen, Bradley" data-id="726834">
            <option value="Hong, Andrew" data-id="746884">
            <option value="Hulsey, Alina" data-id="742742">
            <option value="Idigo, Nnaemeka" data-id="741069">
            <option value="Kaiser, Eric" data-id="753976">
            <option value="Kamdar, Jay" data-id="746885">
            <option value="Kumar, Vikas" data-id="752636">
            <option value="Mansfield, Frederick" data-id="650548">
            <option value="Maziad, Jennifer" data-id="741068">
            <option value="Merrell, Matthew" data-id="748656">
            <option value="Michaels, Robert" data-id="650461">
            <option value="Moorjani, Arun" data-id="742437">
            <option value="Newbern, Matthew" data-id="745309">
            <option value="Norris, Frederick" data-id="745303">
            <option value="O'Hara, Brian" data-id="741071">
            <option value="Olin, Douglas" data-id="726836">
            <option value="Parisian, David" data-id="752635">
            <option value="Phillips, Justin" data-id="748655">
            <option value="Radmall, Brandon" data-id="744372">
            <option value="Rasmussen, Aaron" data-id="742362">
            <option value="Rosemeier, Frank" data-id="741065">
            <option value="Schroeder, Gregory" data-id="748657">
            <option value="Sefton, William" data-id="745306">
            <option value="Silvestrini-Suarez, Marco" data-id="746883">
            <option value="Solby, Bryan" data-id="752634">
            <option value="Spalding, Howard" data-id="651090">
            <option value="Stewart, Douglas" data-id="650558">
            <option value="Stine, Todd" data-id="738764">
            <option value="Stoner, Matthew" data-id="746886">
            <option value="Strickland, Jeffrey" data-id="744374">
            <option value="Tao, David" data-id="742743">
            <option value="Tongson, Sebastian" data-id="755008">
            <option value="Warner, Norman" data-id="743218">
            <option value="Weinstein, Adam" data-id="650546">
            <option value="Weltman, Nathan" data-id="650554">
            <option value="Wieland, Tommy" data-id="726840">
            <option value="Wilkhu, Harshdeep" data-id="752645">
          </datalist>
        </div>
      </div>
    </div>

    <!-- Patient Age -->
    <div class="card">
      <div class="card-header"><span class="card-label">Patient Age</span></div>
      <div class="card-body">
        <div class="chips" id="chips-age">
          <button class="chip" data-group="age" data-val="33">12 – 65 yr</button>
          <button class="chip" data-group="age" data-val="34">≥ 65 yr</button>
        </div>
      </div>
    </div>

    <!-- ASA -->
    <div class="card">
      <div class="card-header"><span class="card-label">ASA Physical Status</span></div>
      <div class="card-body">
        <div class="chips" id="chips-asa">
          <button class="chip" data-group="asa" data-val="156628">ASA 1</button>
          <button class="chip" data-group="asa" data-val="156632">ASA 2</button>
          <button class="chip" data-group="asa" data-val="156634">ASA 3</button>
          <button class="chip" data-group="asa" data-val="156636">ASA 4</button>
          <button class="chip" data-group="asa" data-val="156630">ASA 5</button>
        </div>
        <button class="expander-btn" data-target="asa-extra">+ Other ASA</button>
        <div id="asa-extra" class="expander-content hidden">
          <div class="chips">
            <button class="chip" data-group="asa" data-val="156631">ASA 6</button>
            <button class="chip" data-group="asa" data-val="156629">1E</button>
            <button class="chip" data-group="asa" data-val="156633">2E</button>
            <button class="chip" data-group="asa" data-val="156635">3E</button>
            <button class="chip" data-group="asa" data-val="156637">4E</button>
            <button class="chip" data-group="asa" data-val="156626">5E</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Life-Threatening Pathology -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Life-Threatening Pathology</span>
        <div class="yn-toggle">
          <button class="active-no" data-yn="life-threat" data-val="no">No</button>
          <button data-yn="life-threat" data-val="yes">Yes</button>
        </div>
      </div>
      <div class="card-body hidden" id="body-life-threat">
        <div class="chips">
          <button class="chip" data-group="life-threat" data-single="true" data-val="46">Non-Trauma</button>
          <button class="chip" data-group="life-threat" data-single="true" data-val="134">Trauma</button>
        </div>
      </div>
    </div>

    <!-- Anesthesia -->
    <div class="card">
      <div class="card-header"><span class="card-label">Anesthesia / Analgesia</span></div>
      <div class="card-body">
        <div class="chips" id="chips-anesthesia">
          <button class="chip" data-group="anesthesia" data-val="1256330">General Maintenance</button>
          <button class="chip" data-group="anesthesia" data-val="156641">MAC / Sedation</button>
          <button class="chip" data-group="anesthesia" data-val="1256331">Spinal</button>
          <button class="chip" data-group="anesthesia" data-val="1256332">Epidural</button>
          <button class="chip" data-group="anesthesia" data-val="156646">CSE</button>
        </div>
        <div class="subgroup">
          <span class="subgroup-label">Peripheral Nerve Block</span>
          <div class="chips">
            <button class="chip" data-group="anesthesia" data-val="156648">Single Shot</button>
            <button class="chip" data-group="anesthesia" data-val="156647">Continuous</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Airway -->
    <div class="card">
      <div class="card-header"><span class="card-label">Airway Management</span></div>
      <div class="card-body">
        <div class="chips">
          <button class="chip" data-group="airway" data-val="156654">Oral ETT</button>
          <button class="chip" data-group="airway" data-val="1256333">Supraglottic Airway</button>
        </div>
        <button class="expander-btn" data-target="airway-extra">+ Other airway options</button>
        <div id="airway-extra" class="expander-content hidden">
          <div class="subgroup">
            <span class="subgroup-label">Laryngoscopy</span>
            <div class="chips">
              <button class="chip" data-group="airway" data-val="1256334">Direct</button>
              <button class="chip" data-group="airway" data-val="1256335">Indirect (Video)</button>
            </div>
          </div>
          <div class="subgroup">
            <span class="subgroup-label">Intubation</span>
            <div class="chips">
              <button class="chip" data-group="airway" data-val="156655">Nasal ETT</button>
              <button class="chip" data-group="airway" data-val="2298046">Flex Bronchoscopic</button>
              <button class="chip" data-group="airway" data-val="2298047">Awake</button>
            </div>
          </div>
          <div class="subgroup">
            <span class="subgroup-label">Other</span>
            <div class="chips">
              <button class="chip" data-group="airway" data-val="156650">Mask</button>
              <button class="chip" data-group="airway" data-val="156666">Jet Ventilation</button>
              <button class="chip" data-group="airway" data-val="1256337">Other</button>
            </div>
          </div>
        </div>

        <!-- Lung Isolation / Difficult Airway -->
        <div class="card" style="margin-top:6px; background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Lung Isolation / Difficult Airway</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="lung-iso" data-val="no">No</button>
              <button data-yn="lung-iso" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-lung-iso">
            <div class="subgroup">
              <span class="subgroup-label">Lung Isolation</span>
              <div class="chips">
                <button class="chip" data-group="lung-iso" data-val="156674">Bronchial Blocker</button>
                <button class="chip" data-group="lung-iso" data-val="1256336">DLT</button>
              </div>
            </div>
            <div class="subgroup">
              <span class="subgroup-label">Difficult Airway</span>
              <div class="chips">
                <button class="chip" data-group="difficult-airway" data-single="true" data-val="148">Anticipated</button>
                <button class="chip" data-group="difficult-airway" data-single="true" data-val="149">Unanticipated</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Procedure Category -->
    <div class="card">
      <div class="card-header"><span class="card-label">Procedure Category</span></div>
      <div class="card-body" style="gap:10px;">

        <!-- Cardiac -->
        <div class="card" style="background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Cardiac</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="proc-cardiac" data-val="no">No</button>
              <button data-yn="proc-cardiac" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-proc-cardiac">
            <div class="chips">
              <button class="chip" data-group="proc" data-val="156682">Cardiac w/o CPB</button>
              <button class="chip" data-group="proc" data-val="156681">Cardiac with CPB</button>
            </div>
          </div>
        </div>

        <!-- Major Vessels -->
        <div class="card" style="background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Major Vessels</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="proc-vessels" data-val="no">No</button>
              <button data-yn="proc-vessels" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-proc-vessels">
            <div class="chips">
              <button class="chip" data-group="proc" data-val="156685">Endovascular</button>
              <button class="chip" data-group="proc" data-val="156684">Open</button>
            </div>
          </div>
        </div>

        <!-- Intracerebral -->
        <div class="card" style="background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Intracerebral</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="proc-ic" data-val="no">No</button>
              <button data-yn="proc-ic" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-proc-ic">
            <div class="chips">
              <button class="chip" data-group="proc" data-val="156688">Endovascular</button>
              <button class="chip" data-group="proc" data-val="156689">Nonvasc Open</button>
              <button class="chip" data-group="proc" data-val="156687">Vascular Open</button>
            </div>
          </div>
        </div>

        <!-- Delivery -->
        <div class="card" style="background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Delivery</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="proc-delivery" data-val="no">No</button>
              <button data-yn="proc-delivery" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-proc-delivery">
            <div class="chips">
              <button class="chip" data-group="proc" data-val="156692">C-Section</button>
              <button class="chip" data-group="proc" data-val="156686">C-Section (high-risk)</button>
              <button class="chip" data-group="proc" data-val="156690">Vaginal Delivery</button>
              <button class="chip" data-group="proc" data-val="156691">Vaginal Delivery (high-risk)</button>
            </div>
          </div>
        </div>

        <!-- Other -->
        <div class="card" style="background: var(--surface2);">
          <div class="card-header" style="background: transparent;">
            <span class="card-label" style="font-size:10px;">Other</span>
            <div class="yn-toggle">
              <button class="active-no" data-yn="proc-other" data-val="no">No</button>
              <button data-yn="proc-other" data-val="yes">Yes</button>
            </div>
          </div>
          <div class="card-body hidden" id="body-proc-other">
            <div class="chips">
              <button class="chip" data-group="proc" data-val="156683">Intrathoracic Non-Cardiac</button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Specialized Vascular Access -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Specialized Vascular Access</span>
        <div class="yn-toggle">
          <button class="active-no" data-yn="vasc" data-val="no">No</button>
          <button data-yn="vasc" data-val="yes">Yes</button>
        </div>
      </div>
      <div class="card-body hidden" id="body-vasc">
        <div class="chips">
          <button class="chip" data-group="vasc" data-val="1256338">Arterial Line</button>
          <button class="chip" data-group="vasc" data-val="1256339">Central Venous</button>
          <button class="chip" data-group="vasc" data-val="156693">US-Guided</button>
          <button class="chip" data-group="vasc" data-val="156700">PA Catheter</button>
        </div>
      </div>
    </div>

    <!-- Specialized Monitoring -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Specialized Monitoring</span>
        <div class="yn-toggle">
          <button class="active-no" data-yn="mon" data-val="no">No</button>
          <button data-yn="mon" data-val="yes">Yes</button>
        </div>
      </div>
      <div class="card-body hidden" id="body-mon">
        <div class="chips">
          <button class="chip" data-group="mon" data-val="1256341">CSF Drain</button>
          <button class="chip" data-group="mon" data-val="156708">IONM</button>
          <button class="chip" data-group="mon" data-val="156707">TEE</button>
        </div>
      </div>
    </div>

    <!-- Neuraxial Blockade -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Neuraxial Blockade Site</span>
        <div class="yn-toggle">
          <button class="active-no" data-yn="neuraxial" data-val="no">No</button>
          <button data-yn="neuraxial" data-val="yes">Yes</button>
        </div>
      </div>
      <div class="card-body hidden" id="body-neuraxial">
        <div class="chips">
          <button class="chip" data-group="neuraxial" data-val="156722">Lumbar</button>
          <button class="chip" data-group="neuraxial" data-val="156720">T1-7</button>
          <button class="chip" data-group="neuraxial" data-val="156721">T8-12</button>
          <button class="chip" data-group="neuraxial" data-val="156719">Cervical</button>
          <button class="chip" data-group="neuraxial" data-val="156723">Caudal</button>
        </div>
      </div>
    </div>

    <!-- Peripheral Nerve Block Site -->
    <div class="card">
      <div class="card-header">
        <span class="card-label">Peripheral Nerve Block Site</span>
        <div class="yn-toggle">
          <button class="active-no" data-yn="pnb" data-val="no">No</button>
          <button data-yn="pnb" data-val="yes">Yes</button>
        </div>
      </div>
      <div class="card-body hidden" id="body-pnb">
        <div class="chips">
          <button class="chip" data-group="pnb-site" data-val="1911477">Adductor Canal</button>
          <button class="chip" data-group="pnb-site" data-val="156730">Ankle</button>
          <button class="chip" data-group="pnb-site" data-val="156734">Axillary</button>
          <button class="chip" data-group="pnb-site" data-val="1911478">Erector Spinae Plane</button>
          <button class="chip" data-group="pnb-site" data-val="156735">Femoral</button>
          <button class="chip" data-group="pnb-site" data-val="156732">Infraclavicular</button>
          <button class="chip" data-group="pnb-site" data-val="156731">Interscalene</button>
          <button class="chip" data-group="pnb-site" data-val="156737">Lumbar Plexus</button>
          <button class="chip" data-group="pnb-site" data-val="156739">Paravertebral</button>
          <button class="chip" data-group="pnb-site" data-val="156729">Popliteal</button>
          <button class="chip" data-group="pnb-site" data-val="1911476">Quadratus Lumborum</button>
          <button class="chip" data-group="pnb-site" data-val="156738">Retrobulbar</button>
          <button class="chip" data-group="pnb-site" data-val="156740">Saphenous</button>
          <button class="chip" data-group="pnb-site" data-val="156736">Sciatic</button>
          <button class="chip" data-group="pnb-site" data-val="156733">Supraclavicular</button>
          <button class="chip" data-group="pnb-site" data-val="1911475">TAP</button>
          <button class="chip" data-group="pnb-site" data-val="1256340">Other</button>
        </div>
      </div>
    </div>

  </main>

  <!-- FOOTER -->
  <footer id="footer">
    <button id="btn-clear" onclick="clearForm()">Clear</button>
    <button id="btn-save" onclick="saveCase()">Save Case</button>
  </footer>
</div>

<!-- SAVED CASES PANEL -->
<div id="cases-panel" class="panel hidden">
  <div class="panel-header">
    <h2>Saved Cases</h2>
    <button class="panel-close" onclick="closePanel()">×</button>
  </div>
  <div class="panel-body" id="cases-list"></div>
  <div class="panel-actions">
    <button onclick="exportJSON()">Export JSON</button>
    <button onclick="exportCSV()">Export CSV</button>
    <button onclick="importJSON()">Import JSON</button>
    <button class="danger" onclick="deleteAllCases()">Delete All</button>
  </div>
</div>

<!-- Hidden file input for import -->
<input type="file" id="import-input" accept=".json" style="display:none" onchange="handleImport(event)">

<!-- Toast -->
<div id="toast"></div>

<script>
/* JS added in subsequent tasks */
</script>
</body>
</html>
```

- [ ] Open `app/case_log.html` in a browser and verify:
  - Dark background renders
  - All section cards are visible and scroll correctly
  - Footer (Clear + Save Case) is fixed at bottom
  - Header badge is visible
  - Chips render as pills
  - Yes/No toggles render in card headers
  - No JS errors in console (empty script block is fine)

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add case_log.html static HTML structure and full CSS"
```

---

### Task 4: Add JS — core behavior (chips, toggles, expanders, pre-selections, clear)

**Files:**
- Modify: `app/case_log.html` — replace `/* JS added in subsequent tasks */` with full JS block

- [ ] Replace the `<script>` block content with the following (this is the first JS block; subsequent tasks append more functions):

```javascript
// ── Supervisor map (name → id) ──
const SUPERVISORS = {
  'Adkins, Jakob':'743216','Angert, Kevin':'738774','Ariani, Kayvan':'650569',
  'Axelrod, Mac':'743489','Bissessar, Ravi':'650551','Bryskin, Robert':'650444',
  'Capone, Nicholas':'755003','Chacon, Joshua':'743217','Cole, Britten':'741070',
  'Davidovich, Isaac':'650553','Doyle, Charles':'746882','Eberhardt, Kara':'650473',
  'Fan, John':'736431','Freiberg, Stephen':'650545','Gallo, Elimio':'755005',
  'Geubelle, Gregory':'741066','Gonzalez Ciccarelli, Luis':'743219','Grodin, Benjamin':'751637',
  'Gutierrez, Marc':'748654','Hadaway, Jonathan':'744373','Hansen, Bradley':'726834',
  'Hong, Andrew':'746884','Hulsey, Alina':'742742','Idigo, Nnaemeka':'741069',
  'Kaiser, Eric':'753976','Kamdar, Jay':'746885','Kumar, Vikas':'752636',
  'Mansfield, Frederick':'650548','Maziad, Jennifer':'741068','Merrell, Matthew':'748656',
  'Michaels, Robert':'650461','Moorjani, Arun':'742437','Newbern, Matthew':'745309',
  'Norris, Frederick':'745303',"O'Hara, Brian":'741071','Olin, Douglas':'726836',
  'Parisian, David':'752635','Phillips, Justin':'748655','Radmall, Brandon':'744372',
  'Rasmussen, Aaron':'742362','Rosemeier, Frank':'741065','Schroeder, Gregory':'748657',
  'Sefton, William':'745306','Silvestrini-Suarez, Marco':'746883','Solby, Bryan':'752634',
  'Spalding, Howard':'651090','Stewart, Douglas':'650558','Stine, Todd':'738764',
  'Stoner, Matthew':'746886','Strickland, Jeffrey':'744374','Tao, David':'742743',
  'Tongson, Sebastian':'755008','Warner, Norman':'743218','Weinstein, Adam':'650546',
  'Weltman, Nathan':'650554','Wieland, Tommy':'726840','Wilkhu, Harshdeep':'752645'
};

// ── Chip handler ──
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const group = chip.dataset.group;
    const isSingle = chip.dataset.single === 'true';
    if (isSingle) {
      document.querySelectorAll(`.chip[data-group="${group}"]`).forEach(c => c.classList.remove('selected'));
    }
    chip.classList.toggle('selected');
    handleAutoSelect(chip);
  });
});

// ── Yes/No toggle handler ──
document.querySelectorAll('[data-yn]').forEach(btn => {
  btn.addEventListener('click', () => {
    const yn = btn.dataset.yn;
    const val = btn.dataset.val;
    const pair = document.querySelectorAll(`[data-yn="${yn}"]`);
    pair.forEach(b => { b.classList.remove('active-yes', 'active-no'); });
    btn.classList.add(val === 'yes' ? 'active-yes' : 'active-no');
    const body = document.getElementById(`body-${yn}`);
    if (body) body.classList.toggle('hidden', val !== 'yes');
  });
});

// ── Expander handler ──
document.querySelectorAll('.expander-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const isHidden = target.classList.toggle('hidden');
    btn.textContent = isHidden
      ? btn.textContent.replace('−', '+')
      : btn.textContent.replace('+', '−');
  });
});

// ── Auto-selection rules ──
function handleAutoSelect(chip) {
  if (!chip.classList.contains('selected')) return;
  const val = chip.dataset.val;

  if (val === '1256336') {
    // DLT → expand Procedure > Other, select Intrathoracic Non-Cardiac
    setYN('proc-other', true);
    autoSelect('156683');
  }
  if (val === '156689' || val === '156687') {
    // Intracranial → expand Specialized Monitoring, select IONM
    setYN('mon', true);
    autoSelect('156708');
  }
}

function setYN(yn, toYes) {
  const yesBtn = document.querySelector(`[data-yn="${yn}"][data-val="yes"]`);
  const noBtn  = document.querySelector(`[data-yn="${yn}"][data-val="no"]`);
  if (!yesBtn || !noBtn) return;
  yesBtn.classList.toggle('active-yes', toYes);
  yesBtn.classList.toggle('active-no', false);
  noBtn.classList.toggle('active-no', !toYes);
  noBtn.classList.toggle('active-yes', false);
  const body = document.getElementById(`body-${yn}`);
  if (body) body.classList.toggle('hidden', !toYes);
}

function autoSelect(val) {
  const chip = document.querySelector(`.chip[data-val="${val}"]`);
  if (!chip) return;
  chip.classList.add('selected', 'auto-selected');
}

// ── Pre-selections on load ──
function applyDefaults() {
  // Date → today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('case-date').value = today;
  // Site → AdventHealth
  document.getElementById('site-select').value = '51592';
  // Case year → CA-1
  document.getElementById('year-select').value = '1';
  // Anesthesia → General Maintenance
  const gm = document.querySelector('.chip[data-val="1256330"]');
  if (gm) gm.classList.add('selected');
}

// ── Clear form ──
function clearForm() {
  // Deselect all chips
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected', 'auto-selected'));
  // Reset all Yes/No toggles to No
  document.querySelectorAll('[data-yn]').forEach(btn => {
    btn.classList.remove('active-yes', 'active-no');
    if (btn.dataset.val === 'no') btn.classList.add('active-no');
  });
  // Hide all toggle bodies
  document.querySelectorAll('[id^="body-"]').forEach(b => b.classList.add('hidden'));
  // Clear text inputs
  document.getElementById('case-id').value = '';
  // Re-apply defaults
  applyDefaults();
  loadStickySuper();
}

// ── Toast ──
function showToast(msg, duration = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── Init ──
applyDefaults();
```

- [ ] Open the file in a browser and verify:
  - Chips toggle selected state on tap
  - Yes/No toggles show/hide card bodies correctly
  - Expanders reveal hidden chips
  - Date defaults to today
  - General Maintenance chip is pre-selected
  - "Clear" resets everything and re-applies defaults

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add core JS — chips, toggles, expanders, pre-selections, clear"
```

---

### Task 5: Add JS — sticky supervisor

**Files:**
- Modify: `app/case_log.html` — add functions before the closing `</script>` tag

- [ ] Add these functions before `</script>`:

```javascript
// ── Sticky supervisor ──
function loadStickySuper() {
  const stored = localStorage.getItem('acgme_last_supervisor');
  if (!stored) return;
  try {
    const { id, name } = JSON.parse(stored);
    const input = document.getElementById('supervisor-input');
    input.value = name;
    input.dataset.supervisorId = id;
    document.getElementById('supervisor-sticky').style.display = 'inline-flex';
  } catch (_) {}
}

function saveStickySuper(name, id) {
  localStorage.setItem('acgme_last_supervisor', JSON.stringify({ id, name }));
}

document.getElementById('supervisor-input').addEventListener('change', function () {
  const name = this.value.trim();
  const id = SUPERVISORS[name];
  if (id) {
    this.dataset.supervisorId = id;
    saveStickySuper(name, id);
    document.getElementById('supervisor-sticky').style.display = 'inline-flex';
  } else {
    this.dataset.supervisorId = '';
    document.getElementById('supervisor-sticky').style.display = 'none';
  }
});
```

- [ ] Find the `applyDefaults();` call at the bottom of the script block and change the init section to:
```javascript
applyDefaults();
loadStickySuper();
```

- [ ] Open the file in a browser and verify:
  - Typing and selecting an attending from the datalist shows the STICKY badge
  - Reloading the page restores the supervisor and badge
  - Selecting a new attending updates stored value

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add sticky supervisor persistence"
```

---

### Task 6: Add JS — buildCase() and Save Case

**Files:**
- Modify: `app/case_log.html` — add before `</script>`

- [ ] Add before `</script>`:

```javascript
// ── Collect form state into case object ──
function buildCase() {
  const dateVal = document.getElementById('case-date').value;
  if (!dateVal) { showToast('Date is required'); return null; }

  const superInput = document.getElementById('supervisor-input');
  const superName  = superInput.value.trim();
  const superId    = superInput.dataset.supervisorId || SUPERVISORS[superName] || '';
  if (!superId) { showToast('Select a supervisor from the list'); return null; }

  const ageChip = document.querySelector('.chip[data-group="age"].selected');
  if (!ageChip) { showToast('Patient age is required'); return null; }

  function getChips(group) {
    return [...document.querySelectorAll(`.chip[data-group="${group}"].selected`)].map(c => c.dataset.val);
  }

  function getSingle(group) {
    const c = document.querySelector(`.chip[data-group="${group}"].selected`);
    return c ? c.dataset.val : null;
  }

  return {
    id: Date.now(),
    case_date: dateVal,
    case_id: document.getElementById('case-id').value.trim(),
    case_year: document.getElementById('year-select').value,
    site: document.getElementById('site-select').value,
    supervisor: superId,
    supervisor_name: superName,
    patient_age: ageChip.dataset.val,
    life_threat: getSingle('life-threat'),
    difficult_airway: getSingle('difficult-airway'),
    asa: getChips('asa'),
    anesthesia: getChips('anesthesia'),
    airway: getChips('airway'),
    proc: getChips('proc'),
    vasc: getChips('vasc'),
    mon: getChips('mon'),
    neuraxial: getChips('neuraxial'),
    pnb_site: getChips('pnb-site'),
    lung_iso: getChips('lung-iso')
  };
}

// ── Save Case ──
async function saveCase() {
  const c = buildCase();
  if (!c) return;
  await storeCase(c);
  updateBadge();
  showToast('Case saved');
  clearForm();
}
```

Note: `storeCase` and `updateBadge` are defined in the next task. The file will not be fully functional until Task 7 is complete.

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add buildCase and saveCase functions"
```

---

### Task 7: Add JS — IndexedDB + localStorage storage layer

**Files:**
- Modify: `app/case_log.html` — add before `</script>`

- [ ] Add before `</script>` (place this BEFORE the buildCase block so `storeCase` is defined when `saveCase` calls it):

```javascript
// ── Storage layer ──
const DB_NAME = 'acgme_cases_db';
const DB_STORE = 'cases';
const LS_KEY   = 'acgme_cases';
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(DB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = () => resolve(null); // fallback to LS
  });
}

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(_) { return []; }
}

function lsSave(cases) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cases)); } catch(_) {}
}

function idbGetAll() {
  if (!db) return Promise.resolve([]);
  return new Promise(resolve => {
    const tx  = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

function idbPut(c) {
  if (!db) return Promise.resolve();
  return new Promise(resolve => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(c);
    tx.oncomplete = resolve;
    tx.onerror    = resolve;
  });
}

function idbDelete(id) {
  if (!db) return Promise.resolve();
  return new Promise(resolve => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = resolve;
  });
}

async function storeCase(c) {
  await idbPut(c);
  const all = await idbGetAll();
  lsSave(all);
}

async function deleteCase(id) {
  await idbDelete(id);
  const all = await idbGetAll();
  lsSave(all);
}

async function loadAllCases() {
  const idb = await idbGetAll();
  const ls  = lsLoad();
  if (idb.length >= ls.length) return idb;
  // LS has more — reconcile: merge by id, write back to IDB
  const merged = Object.values(
    [...idb, ...ls].reduce((m, c) => { m[c.id] = c; return m; }, {})
  );
  for (const c of merged) await idbPut(c);
  lsSave(merged);
  console.log(`[storage] reconciled: IDB ${idb.length}, LS ${ls.length} → merged ${merged.length}`);
  return merged;
}

// ── Init storage and reconcile on load ──
openDB().then(async () => {
  await loadAllCases();
  updateBadge();
  renderCasesList();
});
```

- [ ] Note: `updateBadge` and `renderCasesList` are defined in the next two tasks. The `openDB().then(...)` call at the bottom will cause console errors until those tasks are done — that is expected.

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add IndexedDB + localStorage dual-layer storage with reconciliation"
```

---

### Task 8: Add JS — saved cases panel, backup badge, export/import

**Files:**
- Modify: `app/case_log.html` — add before `</script>`

- [ ] Add before `</script>`:

```javascript
// ── Readable labels for case tags ──
const LABELS = {
  '51592':'AdventHealth','55630':'Pain Mgmt',
  '33':'12-65yr','34':'≥65yr',
  '156628':'ASA1','156632':'ASA2','156634':'ASA3','156636':'ASA4','156630':'ASA5','156631':'ASA6',
  '156629':'1E','156633':'2E','156635':'3E','156637':'4E','156626':'5E',
  '46':'Non-Trauma LTP','134':'Trauma LTP',
  '1256330':'Gen Maint','156641':'MAC','1256331':'Spinal','1256332':'Epidural','156646':'CSE',
  '156648':'SS-PNB','156647':'Cont-PNB',
  '156654':'Oral ETT','1256333':'SGA','1256334':'DL','1256335':'VL','156655':'Nasal ETT',
  '2298046':'Flex Bronch','2298047':'Awake','156650':'Mask','156666':'Jet Vent','1256337':'Other Airway',
  '156674':'Bronch Blocker','1256336':'DLT','148':'Anticipated DA','149':'Unanticipated DA',
  '156682':'Cardiac w/o CPB','156681':'Cardiac+CPB',
  '156685':'Endovasc','156684':'Open Vessel',
  '156688':'IC Endovasc','156689':'IC Nonvasc Open','156687':'IC Vasc Open',
  '156692':'C-Section','156686':'C-Section HR','156690':'Vag Delivery','156691':'Vag Delivery HR',
  '156683':'Intrathoracic',
  '1256338':'A-Line','1256339':'CVL','156693':'US-Guided','156700':'PA Cath',
  '1256341':'CSF Drain','156708':'IONM','156707':'TEE',
  '156722':'Lumbar','156720':'T1-7','156721':'T8-12','156719':'Cervical','156723':'Caudal',
  '1911477':'Adductor Canal','156730':'Ankle','156734':'Axillary','1911478':'ESP',
  '156735':'Femoral','156732':'Infraclavicular','156731':'Interscalene',
  '156737':'Lumbar Plexus','156739':'Paravertebral','156729':'Popliteal',
  '1911476':'QL Block','156738':'Retrobulbar','156740':'Saphenous','156736':'Sciatic',
  '156733':'Supraclavicular','1911475':'TAP','1256340':'Other PNB'
};

function label(val) { return LABELS[val] || val; }

// ── Backup badge ──
function updateBadge() {
  loadAllCases().then(cases => {
    const lastCount = parseInt(localStorage.getItem('acgme_last_export_count') || '0');
    const unsaved = Math.max(0, cases.length - lastCount);
    const el = document.getElementById('badge');
    const countEl = document.getElementById('badge-count');
    countEl.textContent = cases.length;
    el.className = 'badge';
    if (unsaved >= 10) el.classList.add('alert');
    else if (unsaved >= 5) el.classList.add('warn');
  });
}

// ── Panel open/close ──
function openPanel() {
  renderCasesList();
  document.getElementById('cases-panel').classList.remove('hidden');
}
function closePanel() {
  document.getElementById('cases-panel').classList.add('hidden');
}

// ── Render saved cases ──
async function renderCasesList() {
  const cases = await loadAllCases();
  const list  = document.getElementById('cases-list');
  if (cases.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:24px">No saved cases</p>';
    return;
  }
  const sorted = [...cases].sort((a, b) => b.id - a.id);
  list.innerHTML = sorted.map(c => {
    const allVals = [
      c.site, c.patient_age,
      ...(c.asa || []), ...(c.anesthesia || []), ...(c.airway || []),
      ...(c.lung_iso || []),
      c.life_threat ? [c.life_threat] : [],
      c.difficult_airway ? [c.difficult_airway] : [],
      ...(c.proc || []), ...(c.vasc || []), ...(c.mon || []),
      ...(c.neuraxial || []), ...(c.pnb_site || [])
    ].flat().filter(Boolean);
    const tags = allVals.map(v => `<span class="case-tag">${label(v)}</span>`).join('');
    return `
      <div class="case-card">
        <div class="case-card-header">
          <span class="case-date-label">${c.case_date}${c.case_id ? ' · ' + c.case_id : ''}</span>
          <button class="case-delete" onclick="confirmDeleteCase(${c.id})">×</button>
        </div>
        <div style="font-size:12px;color:var(--text-dim)">${c.supervisor_name || '—'}</div>
        <div class="case-tags">${tags}</div>
      </div>`;
  }).join('');
}

async function confirmDeleteCase(id) {
  if (!confirm('Delete this case?')) return;
  await deleteCase(id);
  updateBadge();
  renderCasesList();
}

async function deleteAllCases() {
  const cases = await loadAllCases();
  if (cases.length === 0) { showToast('No cases to delete'); return; }
  if (!confirm(`Delete all ${cases.length} cases? This cannot be undone.`)) return;
  if (!confirm('Are you sure? All cases will be permanently deleted.')) return;
  for (const c of cases) await deleteCase(c.id);
  lsSave([]);
  updateBadge();
  renderCasesList();
}

// ── Export JSON ──
async function exportJSON() {
  const cases = await loadAllCases();
  const json  = JSON.stringify(cases, null, 2);
  const fname = `acgme_cases_${new Date().toISOString().split('T')[0]}.json`;
  await deliverFile(json, fname, 'application/json');
  localStorage.setItem('acgme_last_export_count', String(cases.length));
  updateBadge();
  showToast(`Exported ${cases.length} cases`);
}

// ── Export CSV ──
async function exportCSV() {
  const cases = await loadAllCases();
  const headers = ['date','case_id','site','supervisor','patient_age','asa','anesthesia','airway','proc','vasc','mon','neuraxial','pnb_site'];
  const rows = cases.map(c => [
    c.case_date, c.case_id || '', c.site, c.supervisor_name,
    c.patient_age,
    (c.asa||[]).join('|'), (c.anesthesia||[]).join('|'),
    (c.airway||[]).join('|'), (c.proc||[]).join('|'),
    (c.vasc||[]).join('|'), (c.mon||[]).join('|'),
    (c.neuraxial||[]).join('|'), (c.pnb_site||[]).join('|')
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const csv   = [headers.join(','), ...rows].join('\n');
  const fname = `acgme_cases_${new Date().toISOString().split('T')[0]}.csv`;
  await deliverFile(csv, fname, 'text/csv');
  localStorage.setItem('acgme_last_export_count', String(cases.length));
  updateBadge();
  showToast(`Exported ${cases.length} cases as CSV`);
}

// ── Platform-aware file delivery ──
async function deliverFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  // Web Share API (mobile)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: mimeType })] })) {
    try {
      await navigator.share({ files: [new File([blob], filename, { type: mimeType })], title: filename });
      return;
    } catch(e) { if (e.name !== 'AbortError') console.warn('Share failed:', e); }
  }
  // File System Access API (desktop Chrome)
  if (window.showSaveFilePicker) {
    try {
      const ext  = filename.split('.').pop();
      const fh   = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Export', accept: { [mimeType]: ['.' + ext] } }] });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch(e) { if (e.name !== 'AbortError') console.warn('File picker failed:', e); }
  }
  // Standard download fallback
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Import JSON ──
function importJSON() {
  document.getElementById('import-input').click();
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';
  try {
    const text     = await file.text();
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) { showToast('Invalid JSON format'); return; }
    const existing = await loadAllCases();
    const existIds = new Set(existing.map(c => c.id));
    const newCases = imported.filter(c => c.id && !existIds.has(c.id));
    for (const c of newCases) await storeCase(c);
    updateBadge();
    renderCasesList();
    showToast(`Imported ${newCases.length} new case(s)`);
  } catch(e) {
    showToast('Import failed: invalid JSON');
  }
}
```

- [ ] Verify by opening the file in browser:
  - Tap the badge → saved cases panel slides up (empty state shows "No saved cases")
  - Fill form, Save Case → badge count increments, panel shows new case with tags
  - Export JSON → downloads/shares a JSON file
  - Export CSV → downloads/shares a CSV file
  - Import JSON → merges without duplicates (import same file twice, count unchanged)
  - Delete case → removes from panel and badge decrements
  - Delete All (double confirm) → clears everything

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: add saved cases panel, backup badge, export JSON/CSV, import"
```

---

### Task 9: Add JS — service worker registration

**Files:**
- Modify: `app/case_log.html` — add after `loadStickySuper()` init call

- [ ] Add after the `loadStickySuper();` line at the bottom of the script:

```javascript
// ── Service worker registration ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service_worker.js')
      .then(r => console.log('[SW] registered, scope:', r.scope))
      .catch(e => console.warn('[SW] registration failed:', e));
  });
}
```

- [ ] Verify: open app via a local server (required for SW — not via `file://`):
```powershell
# From project root, serve the app/ directory
npx serve app -l 3000
```
  - Open http://localhost:3000/case_log.html
  - Check DevTools → Application → Service Workers: registered and active
  - Throttle to Offline in DevTools → reload: app loads from cache

- [ ] Commit:
```
git add app/case_log.html
git commit -m "feat: register service worker for offline support"
```

---

### Task 10: Final web app verification

- [ ] Open http://localhost:3000/case_log.html on desktop Chrome and run through the checklist:
  - [ ] Date defaults to today
  - [ ] General Maintenance pre-selected
  - [ ] Supervisor datalist shows all attendings; STICKY badge appears after selection
  - [ ] Yes/No toggles show/hide content correctly
  - [ ] ASA "+ Other" expander works
  - [ ] "+ Other airway options" expander works
  - [ ] Select DLT → Procedure > Other opens, Intrathoracic Non-Cardiac gets purple glow
  - [ ] Select Nonvasc Open or Vascular Open → Specialized Monitoring opens, IONM gets purple glow
  - [ ] Save Case requires date, supervisor, patient age — shows toast if missing
  - [ ] Save Case clears form and increments badge
  - [ ] Badge turns amber at 5 unsaved, red at 10 unsaved
  - [ ] Export JSON downloads correctly
  - [ ] Export CSV downloads correctly and is comma-separated with headers
  - [ ] Import JSON adds new cases, skips duplicates

- [ ] Commit:
```
git add app/
git commit -m "feat: complete web app — all sections, storage, export/import, PWA"
```

---

## Phase 2: Playwright Automation Script

---

### Task 11: Write automation/submit.js

**Files:**
- Write: `automation/submit.js`

- [ ] Write the complete `automation/submit.js`:

```javascript
#!/usr/bin/env node
'use strict';

const { chromium } = require('playwright');
const fs           = require('fs');
const path         = require('path');
const readline     = require('readline');

// ── Args ──
const args = process.argv.slice(2);
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

// ── Paths ──
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

// ── Readable case summary ──
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

function summarize(c) {
  const lines = [
    `  Date:        ${c.case_date}${c.case_id ? ' (ID: ' + c.case_id + ')' : ''}`,
    `  Supervisor:  ${c.supervisor_name}`,
    `  Site:        ${label(c.site)}`,
    `  Age:         ${label(c.patient_age)}`,
    `  ASA:         ${labels(c.asa)}`,
    `  Anesthesia:  ${labels(c.anesthesia)}`,
    `  Airway:      ${labels(c.airway)}`,
  ];
  if ((c.lung_iso||[]).length)        lines.push(`  Lung Iso:    ${labels(c.lung_iso)}`);
  if (c.life_threat)                  lines.push(`  Life-threat: ${label(c.life_threat)}`);
  if (c.difficult_airway)             lines.push(`  Diff Airway: ${label(c.difficult_airway)}`);
  if ((c.proc||[]).length)            lines.push(`  Procedure:   ${labels(c.proc)}`);
  if ((c.vasc||[]).length)            lines.push(`  Vasc Access: ${labels(c.vasc)}`);
  if ((c.mon||[]).length)             lines.push(`  Monitoring:  ${labels(c.mon)}`);
  if ((c.neuraxial||[]).length)       lines.push(`  Neuraxial:   ${labels(c.neuraxial)}`);
  if ((c.pnb_site||[]).length)        lines.push(`  PNB Site:    ${labels(c.pnb_site)}`);
  return lines.join('\n');
}

// ── Form date formatter: "2026-05-24" → "5/24/2026" ──
function toAcgmeDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

// ── Fill and submit a single case ──
const ACGME_URL   = 'https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert';
const DATE_FIELD  = '0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32';
const CASEID_FIELD= '241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4';

async function fillCase(page, c) {
  await page.goto(ACGME_URL, { waitUntil: 'domcontentloaded' });

  // Text fields
  await page.fill(`[name="${DATE_FIELD}"]`, toAcgmeDate(c.case_date));
  if (c.case_id) await page.fill(`[name="${CASEID_FIELD}"]`, c.case_id);

  // Selects
  await page.selectOption('[name="ProcedureYear"]', c.case_year);
  await page.selectOption('[name="Institutions"]',  c.site);
  await page.selectOption('[name="Attendings"]',    c.supervisor);
  await page.selectOption('[name="PatientTypes"]',  c.patient_age);

  // Checkboxes and radios by element id
  async function checkById(val) {
    try {
      const el = page.locator(`#${CSS.escape ? CSS.escape(val) : val}`).first();
      const checked = await el.isChecked().catch(() => null);
      if (checked === false) await el.check();
    } catch(e) { console.warn(`  [warn] could not check id="${val}": ${e.message}`); }
  }

  for (const v of (c.asa||[]))       await checkById(v);
  for (const v of (c.anesthesia||[])) await checkById(v);
  for (const v of (c.airway||[]))    await checkById(v);
  for (const v of (c.lung_iso||[]))  await checkById(v);
  for (const v of (c.proc||[]))      await checkById(v);
  for (const v of (c.vasc||[]))      await checkById(v);
  for (const v of (c.mon||[]))       await checkById(v);
  for (const v of (c.neuraxial||[])) await checkById(v);
  for (const v of (c.pnb_site||[])) await checkById(v);
  if (c.life_threat)    await checkById(c.life_threat);
  if (c.difficult_airway) await checkById(c.difficult_airway);
}

async function submitForm(page) {
  // Click submit button (adjust selector if ACGME form changes)
  const submitBtn = page.locator('input[type="submit"], button[type="submit"]').first();
  await submitBtn.click();
  // Wait for navigation or success indicator
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  // Check for error message
  const errEl = page.locator('.validation-summary-errors, .error-message').first();
  const hasErr = await errEl.isVisible().catch(() => false);
  if (hasErr) {
    const errText = await errEl.textContent().catch(() => 'Unknown error');
    throw new Error(`Form validation error: ${errText.trim()}`);
  }
}

// ── Check login ──
async function ensureLoggedIn(page) {
  await page.goto(ACGME_URL, { waitUntil: 'domcontentloaded' });
  // If we got redirected to a login page, the URL will differ
  const url = page.url();
  if (url.includes('/login') || url.includes('/Login') || url.includes('signin')) {
    console.log('\n⚠  Not logged in to ACGME. Please log in in the browser window that just opened.');
    console.log('   Waiting up to 5 minutes for login...\n');
    await page.waitForURL(u => !u.includes('login') && !u.includes('signin'), { timeout: 300000 });
    console.log('✓ Login detected. Continuing.\n');
  }
}

// ── Readline prompt ──
function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ── Main ──
(async () => {
  const allCases   = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const submitted  = readJSON(SUBMITTED, []);
  const submittedIds = new Set(submitted.map(s => s.id));
  const pending    = allCases.filter(c => !submittedIds.has(c.id));

  if (pending.length === 0) {
    console.log('All cases in this file have already been submitted. Nothing to do.');
    process.exit(0);
  }
  console.log(`\nACGME Case Submitter`);
  console.log(`────────────────────`);
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
      console.log(`\n── Case ${i + 1} of ${pending.length} ──────────────────────────`);
      console.log(summarize(c));
      console.log('');

      try {
        await fillCase(page, c);
      } catch(e) {
        console.error(`  ✗ Error filling form: ${e.message}`);
        const ans = await prompt(rl, '  Retry fill? (r = retry, s = skip, q = quit): ');
        if (ans.trim().toLowerCase() === 'r') { i--; continue; }
        if (ans.trim().toLowerCase() === 'q') break;
        skipped++;
        continue;
      }

      const ans = await prompt(rl, '  Press Enter to submit, s to skip, q to quit: ');
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

      try {
        await submitForm(page);
        console.log('  ✓ Submitted.');
        appendJSON(SUBMITTED, { id: c.id, case_date: c.case_date, submitted_at: new Date().toISOString() });
        submitted_count++;
      } catch(e) {
        console.error(`  ✗ Submission failed: ${e.message}`);
        appendJSON(FAILED, { case: c, error: e.message, failed_at: new Date().toISOString() });
        failed++;
      }
    }
  } finally {
    rl.close();
    await browser.close();
  }

  console.log(`\n── Summary ──────────────────────────────────`);
  console.log(`Submitted: ${submitted_count}`);
  console.log(`Failed:    ${failed}${failed > 0 ? '  (see data/failed_cases.json)' : ''}`);
  console.log(`Skipped:   ${skipped}`);
  console.log('');
})();
```

- [ ] Verify syntax is valid:
```powershell
node --check automation/submit.js
```
  Expected: no output (no errors)

- [ ] Commit:
```
git add automation/submit.js
git commit -m "feat: add Playwright batch submission script"
```

---

### Task 12: Final commit and README update

**Files:**
- Modify: `README.md`

- [ ] Update `README.md` with usage instructions:

```markdown
# ACGME Case Log Tool

Fast case entry + batch submission for the ACGME ADS portal.

## Web App

Open `app/case_log.html` in a browser, or serve locally:

```bash
npx serve app -l 3000
```

For PWA install (iOS): open in Safari → Share → Add to Home Screen.
For PWA install (Android/Chrome): tap "Add to Home Screen" from browser menu.

## Batch Submission

1. Export cases from the web app (JSON format)
2. Make sure you are logged into ACGME in a browser session
3. Run:

```bash
node automation/submit.js --file data/cases_2026-05-24.json
```

The script opens Chromium, fills each case, and pauses for your review before submitting.

## Requirements

- Node.js 18+
- `npm install` (installs Playwright)
```

- [ ] Final commit:
```
git add README.md
git commit -m "docs: update README with usage instructions"
```

---

## Self-Review Notes

- **Spec coverage:** All 18 form sections covered in HTML. All auto-selection rules in `handleAutoSelect`. Dual-layer storage with reconciliation in Task 7. Export JSON + CSV + platform detection in Task 8. Import + merge in Task 8. Backup badge in Task 8. Playwright script covers all fields, login check, readline prompts, submitted_log, failed_cases in Task 11.
- **Type consistency:** `storeCase`, `deleteCase`, `loadAllCases` defined in Task 7 before they are called. `updateBadge`, `renderCasesList` defined in Task 8 before the `openDB().then(...)` init completes — note: Task 7 commits before Task 8, so the file in Task 7's committed state will have a minor console error on load (calling `updateBadge` before defined). This resolves fully after Task 8.
- **Lung isolation chips** use `data-group="lung-iso"` and are stored in `c.lung_iso` — the `buildCase` function collects this correctly with `getChips('lung-iso')`.
- **submit.js CSS.escape**: numeric IDs like `156628` are valid CSS identifiers and don't need escaping; the `CSS.escape` usage is defensive for future safety.
