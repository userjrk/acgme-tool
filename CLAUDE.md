# ACGME Tool — Claude Code Briefing

This file is read automatically by Claude Code at the start of every session.
Do not delete it. Update it as the project evolves.

---

## Critical Working Rules

This project has multiple working features used in a 
real clinical setting. Breaking existing functionality 
is worse than not fixing new things.

Before touching ANY file:
1. Read it completely first
2. Identify exactly what needs to change
3. Make only the targeted change — nothing else
4. Do not refactor, rename, or reorganize code 
   that is not directly related to the current task

Before each commit:
- Verify the specific feature you changed still works
- Verify features in adjacent files are not broken
- If you are unsure whether a change is safe, STOP
  and explain the risk before proceeding

Files with working features — touch with extreme care:
- app/case_log.html — live PWA used daily
- extension/popup.js — submission logic, state persistence
- extension/content.js — ACGME form filling
- extension/background.js — tab monitoring, messaging
- automation/submit.js — Playwright batch script

If a session is interrupted mid-task:
- Read CLAUDE.md and the task prompt again from scratch
- Check git log to see what was already completed
- Check git diff to see any uncommitted partial changes
- Do NOT assume prior state — verify everything
- Commit completed work before starting the next section

One section at a time. Commit after each. Never batch 
multiple sections into one commit.

## Service Worker Cache Version Rule

Every time app/case_log.html is modified and pushed,
the cache version key in app/service_worker.js MUST
be updated to match the current version number.

Format: 'acgme-cache-v{VERSION}'
Example: 'acgme-cache-v1.4.0'

This ensures existing PWA users automatically receive
the latest version of the app without reinstalling.

Failure to update the cache version means users on
older installs will continue running stale code and
will not see new features or bug fixes.

This is a required step in every commit that touches
app/case_log.html — treat it the same as updating
the version number in extension/manifest.json.

---
##Tools and Access 
  - gh CLI: installed and authenticated as userjrk,
    use for all GitHub releases and asset uploads
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
**Install page:** `https://userjrk.github.io/acgme-tool/app/install.html`

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
│   ├── GOOGLE_SHEETS_SETUP.md       ← Google Sheets integration guide
│   └── design-references/           ← approved UI reference designs
│       ├── README.md
│       ├── case_log_reference.html
│       ├── popup_reference.html
│       └── edit_reference.html
├── app/
│   ├── case_log.html                ← standalone web app (the live app)
│   ├── install.html                 ← Chrome extension install page
│   ├── manifest.json                ← PWA manifest
│   ├── service_worker.js            ← cache-first offline support
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── extension/                       ← Chrome extension (MV3)
│   ├── manifest.json
│   ├── popup.html / popup.js        ← extension popup UI + logic
│   ├── content.js                   ← fills ACGME form fields
│   ├── background.js                ← service worker, handles navigation
│   ├── styles.css
│   ├── generate-icons.js            ← run once to regenerate PNG icons
│   ├── INSTALL.md
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
├── automation/
│   └── submit.js                    ← Playwright submission script
├── data/                            ← JSON exports (gitignored, .gitkeep committed)
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
- **Edit saved cases** — ✏️ button in saved cases panel repopulates the full form; Save button becomes "Update Case ✏️"; Cancel Edit restores clean state
- **Chrome extension** — `extension/` folder, MV3
  - Review mode (default): fills one case at a time, shows preview card, resident clicks "Submit & Next" or "Skip"
  - Auto mode: submits all cases sequentially without pausing
  - Submitted IDs tracked in `chrome.storage.local` to prevent duplicate submissions
- **Extension install page** — `app/install.html`, live at `https://userjrk.github.io/acgme-tool/app/install.html`
- **Design references** — approved UI reference files archived in `docs/design-references/`

### Google Sheets Config
Google Sheets URL: see `app/case_log.html` SHEETS_CONFIG (not stored in docs for security)

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
- [x] Edit saved cases (✏️ button, full form repopulation)
- [x] Chrome extension — review mode + auto mode
- [x] Extension install page (`app/install.html`)
- [x] Design references archived in `docs/design-references/`
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
