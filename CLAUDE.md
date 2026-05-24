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
A single HTML file, no dependencies, works offline.
Resident fills out a case after each OR day using tap-friendly chip buttons.
Hitting "Save Case" stores the entry in browser localStorage.
At end of week, exports a JSON backup file.

**Part 2 — Automation Script** (`automation/submit.js`)
Reads the exported JSON file.
Opens the ACGME ADS portal in a browser where the user is already logged in.
Fills and submits each case one at a time.
Pauses between cases for user review before proceeding.

---

## Project Structure

```
acgme-tool/
├── CLAUDE.md                  ← you are here
├── README.md                  ← human overview
├── docs/
│   ├── CONTEXT.md             ← extended background and design decisions
│   ├── FORM_SPEC.json         ← full ACGME form field/value mapping
│   └── ROADMAP.md             ← future features
├── app/
│   └── case_log.html          ← standalone web app, no build step needed
├── automation/
│   └── submit.js              ← Playwright submission script
├── data/                      ← JSON exports from the web app (gitignored)
└── .gitignore
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
| Patient Age | `PatientTypes` |
| ASA, Anesthesia, Airway, etc. | checkbox by element ID = the value string |

Full mapping in `docs/FORM_SPEC.json`.

### Default Values (pre-selected in web app, expected in most cases)
- Site: `51592` (AdventHealth Orlando)
- Case Year: `1` (CA-1)
- Anesthesia: `1256330` (General Maintenance)
- Patient Age: `33` (12–65 yr) or `34` (≥65 yr)

---

## JSON Case Format

Each saved case looks like this:

```json
{
  "id": 1716580000000,
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

## Auto-Selection Rules (built into web app, must be respected in script)

| Trigger | Auto-action |
|---|---|
| DLT (`1256336`) selected | Auto-select Intrathoracic Non-Cardiac (`156683`) |
| Intracranial Nonvasc Open (`156689`) selected | Auto-select IONM (`156708`) |
| Intracranial Vascular Open (`156687`) selected | Auto-select IONM (`156708`) |

---

## Tech Stack

- **Web app:** Vanilla HTML/CSS/JS, zero dependencies, single file
- **Automation:** Node.js + Playwright
- **Storage:** Browser localStorage + JSON file export
- **Version control:** GitHub (private repo)

---

## Current Status

- [x] Web app built and functional
- [x] Form spec documented
- [x] Project structure established
- [ ] Playwright script — in progress
- [ ] End-to-end test with real ACGME session
- [ ] README finalized

---

## Key Decisions Made

- **No server, no database.** Everything runs locally. No data leaves the machine except to ACGME directly.
- **JSON as the handoff format** between web app and automation script. Human-readable, easy to inspect.
- **User stays in control.** Script pauses between submissions. No bulk fire-and-forget.
- **Patient data stays off GitHub.** The `data/` folder is gitignored.

---

## When Resuming Work

Always start by reading this file and `docs/CONTEXT.md`.
Check `docs/ROADMAP.md` for what was planned next.
Ask John what has changed or what he wants to work on today.
