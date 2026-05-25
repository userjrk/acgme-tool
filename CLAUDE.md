# ACGME Tool — Claude Code Briefing

This file is read automatically by Claude Code at the start of every session.
Do not delete it. Update it as the project evolves.

---

## Who This Is For

John, CA-1 anesthesia resident at AdventHealth Orlando.
Built to solve one problem: logging cases into the ACGME ADS portal is slow and tedious.
This tool makes entry fast (web app) and submission automatic (Playwright script).

---

## What This Project Does

**Part 1 — Web App** (`app/case_log.html`)
A single HTML file, no dependencies. Deployed on GitHub Pages.
Resident fills out a case after each OR day using tap-friendly chip buttons.
Hitting "Save Case" stores the entry in IndexedDB (primary) + localStorage (mirror).
Exports JSON and CSV backups. Syncs each saved case to Google Sheets.

**Live URL:** `https://userjrk.github.io/acgme-tool/app/case_log.html`

**Part 2 — Automation Script** (`automation/submit.js`)
Reads the exported JSON file.
Opens the ACGME ADS portal in a browser where the user is already logged in.
Fills and submits each case one at a time.
Pauses between cases for user review before proceeding.

---

## Project Structure

```
acgme-tool/
├── CLAUDE.md                        ← you are here
├── README.md                        ← human overview
├── index.html                       ← redirects / to app/case_log.html
├── docs/
│   ├── CONTEXT.md                   ← extended background and design decisions
│   ├── FORM_SPEC.json               ← full ACGME form field/value mapping
│   ├── ROADMAP.md                   ← future features
│   └── GOOGLE_SHEETS_SETUP.md      ← Google Sheets integration guide
├── app/
│   ├── case_log.html                ← standalone web app (the live app)
│   ├── case_log_reference.html      ← reference design (source of truth)
│   ├── manifest.json                ← PWA manifest
│   ├── service_worker.js            ← cache-first offline support
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── automation/
│   └── submit.js                    ← Playwright submission script
├── data/                            ← JSON exports (gitignored)
└── .gitignore
```

---

## Web App Features

- **Resident name field** — sticky, program-wide, persisted in localStorage as `acgme_resident_name`
- **Supervisor field** — sticky, last used value persisted as `acgme_last_supervisor`
- **Chip UI** — tap-friendly, 44px minimum tap targets, dark theme
- **Storage** — IndexedDB primary + localStorage mirror, reconciled on load
- **Google Sheets sync** — `sendToSheets()` fires on each save (fire-and-forget, non-blocking)
- **Export** — JSON (Web Share on iOS) + CSV, download fallback on desktop
- **PWA** — installable on iOS (Safari → Add to Home Screen) and Android

### Google Sheets Config (in case_log.html script, near top)
```js
const SHEETS_CONFIG = {
  enabled: true,
  url: 'https://script.google.com/macros/s/AKfycbwT7tkwK4lkWusT1x49DiGA0LpT9YJI7XuCMdy-erL1XLnWJhM3o46oFROd8KnDxXDz/exec',
};
```

---

## ACGME Form Technical Details

**Submission endpoint:** `https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert`
**Method:** POST
**Auth:** Requires active browser session (user logs in manually before running script)

### Key Field Names

| Field | Form name |
|---|---|
| Case Date | `0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32` |
| Case ID | `241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4` |
| Case Year | `ProcedureYear` |
| Site | `Institutions` |
| Supervisor | `Attendings` |
| Patient Age | `PatientTypes` (select, not checkbox) |
| ASA, Anesthesia, Airway, etc. | checkbox by element ID = the value string |

Full mapping in `docs/FORM_SPEC.json`.

### Default Values (pre-selected in web app)
- Site: `51592` (AdventHealth Orlando)
- Case Year: `1` (CA-1)
- Anesthesia: `1256330` (General Maintenance)

---

## JSON Case Format

```json
{
  "id": 1716580000000,
  "resident_name": "John Doe",
  "case_date": "2026-05-24",
  "case_id": "",
  "case_year": "1",
  "site": "51592",
  "supervisor": "741070",
  "supervisor_name": "Cole, Britten",
  "patient_age": "33",
  "life_threat": null,
  "difficult_airway": null,
  "asa": ["156634"],
  "anesthesia": ["1256330"],
  "airway": ["156654"],
  "proc": [],
  "vasc": [],
  "mon": [],
  "neuraxial": [],
  "pnb_site": []
}
```

---

## Auto-Selection Rules

| Trigger | Auto-action |
|---|---|
| DLT (`1256336`) selected | Auto-expand proc_other, select Intrathoracic Non-Cardiac (`156683`) |
| Intracranial Nonvasc Open (`156689`) selected | Auto-expand mon, select IONM (`156708`) |
| Intracranial Vascular Open (`156687`) selected | Auto-expand mon, select IONM (`156708`) |

---

## Tech Stack

- **Web app:** Vanilla HTML/CSS/JS, zero dependencies, single file, GitHub Pages
- **Storage:** IndexedDB + localStorage dual-layer with reconciliation
- **Sheets sync:** Google Apps Script web app (POST, no-cors)
- **Automation:** Node.js + Playwright
- **Version control:** GitHub (`userjrk/acgme-tool`, public)

---

## Current Status

- [x] Web app built, deployed to GitHub Pages
- [x] Google Sheets sync enabled
- [x] PWA — installable on iOS and Android
- [x] Form spec documented
- [x] Playwright submission script complete
- [ ] End-to-end test with real ACGME session

---

## Key Decisions Made

- **No server, no database.** Everything runs locally or via GitHub Pages static hosting.
- **No PHI.** Only procedure codes, attending names, dates, and site are stored/synced.
- **JSON as the handoff format** between web app and automation script.
- **User stays in control.** Script pauses between submissions. No bulk fire-and-forget.
- **Patient data stays off GitHub.** The `data/` folder is gitignored.

---

## When Resuming Work

Always start by reading this file. Ask John what has changed or what he wants to work on today.
