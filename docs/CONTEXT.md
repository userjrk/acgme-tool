# ACGME Case Log Automator — Project Context

## Goal
Automatically submit saved case log entries to the ACGME ADS portal
(https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert) using browser automation.

## Input
A JSON file exported from the case entry web app. Each entry looks like:
{
  "id": 1234567890,
  "resident_name": "John Doe",
  "case_date": "2026-05-24",
  "case_id": "optional epic #",
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

## ACGME Form Field Mapping
All field IDs/names come from the form spec (see FORM_SPEC.json).
The form POST endpoint is: https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert

Key fields:
- case_date → field name: 0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32 (format M/D/YYYY)
- case_id   → field name: 241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4
- case_year → field name: ProcedureYear (value: "1")
- site      → field name: Institutions (value: "51592" = AdventHealth)
- supervisor→ field name: Attendings
- patient_age → field name: PatientTypes
- ASA checkboxes → field id = the value itself (e.g. id="156634")
- anesthesia, airway, proc, vasc, mon, neuraxial, pnb_site → checkbox by id

## Constraints
- Requires active ACGME login session (cookies) — user logs in manually first
- CSRF tokens likely required — browser automation (Playwright) is the right tool
- One case submitted at a time; user reviews before each submit
- After submission, script should pause and wait for user confirmation before next case

## Preferred Stack
Node.js + Playwright — user runs locally, already authenticated in browser

## Submission Options
Two ways to submit cases:
1. **Playwright script** (`automation/submit.js`) — run locally with exported JSON file
2. **Chrome extension** (`extension/`) — loads JSON in popup, fills and submits from within the browser session

## Files
- FORM_SPEC.json — full field/value mapping from original form schema
- cases_YYYY-MM-DD.json — exported case data from the web app
- automation/submit.js — Node.js + Playwright batch submission script
- extension/ — Chrome extension (MV3) for in-browser submission