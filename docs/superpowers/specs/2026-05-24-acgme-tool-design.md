# ACGME Tool — Design Spec
**Date:** 2026-05-24
**Status:** Approved

---

## Overview

A two-part tool for anesthesia residents to log and submit surgical cases to the ACGME ADS portal:

1. **Web App** (`app/case_log.html`) — mobile-first PWA for fast case entry using chip-based UI. Works offline. Stores cases in IndexedDB + localStorage. Exports JSON and CSV.
2. **Playwright Script** (`automation/submit.js`) — reads exported JSON, opens ACGME portal in Chromium, fills and submits each case with user review between each submission.

No server. No database. No PHI. Everything runs locally.

---

## File Structure

```
acgme-tool/
├── app/
│   ├── case_log.html       — single HTML file, all CSS + JS inline
│   ├── manifest.json       — PWA manifest
│   ├── service_worker.js   — cache-first offline support
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── automation/
│   └── submit.js
├── data/                   — gitignored
├── docs/
│   ├── FORM_SPEC.json      — proper JSON field/value mapping (rebuilt from build prompt)
│   ├── CONTEXT.md
│   ├── ROADMAP.md
│   └── superpowers/specs/  — design docs
├── CLAUDE.md
├── README.md
├── package.json
└── .gitignore
```

`manifest.json` and `service_worker.js` are siblings to `case_log.html` (required by PWA spec — service worker scope is directory-bound).

---

## Part 1 — Web App

### Tech Constraints
- Single HTML file, no build step, no framework, no bundler
- All CSS and JS inline
- Google Fonts via `<link>` (cached by service worker)
- Zero external runtime dependencies
- Minimum tap target: 44×44px everywhere
- No hover-dependent interactions

### Layout
- **Header:** sticky, app name + backup badge (case count since last export)
- **Body:** scrollable, section cards with sticky labels
- **Footer:** fixed bottom bar, Clear and Save Case buttons

### UI Components

**Chips:** `<button>` elements styled as pill shapes. Toggle `.selected` class on tap. Auto-selected chips also get `.auto-selected` (purple glow). Multi-select unless noted as single-select (radio behavior).

**Yes/No toggles:** Paired `<button>` elements in card header acting as a segmented control. One always active. Default No. Content beneath is `display:none` until Yes is active.

**Expanders:** A `+ label` link that reveals additional chips inline within a card. Used for ASA emergency variants and "Other airway options".

**Saved Cases Panel:** Full-screen overlay that slides up from the bottom when the header badge is tapped. Has close button. Cases shown in reverse chronological order with all selected values as readable tag labels. Actions: delete, export JSON, export CSV, import JSON, delete all (double confirm).

### Pre-selections on Fresh Form
- Site: AdventHealth Orlando (51592)
- Case Year: CA-1 (1)
- Anesthesia: General Maintenance (1256330)
- Life-threatening pathology: No
- Lung isolation / difficult airway: No
- All procedure category Yes/No toggles: No
- Specialized vascular access: No
- Specialized monitoring: No
- Neuraxial blockade: No
- Peripheral nerve block: No
- Date: today's date
- Patient Age: none pre-selected (user must choose)

### Sticky Supervisor
Last used supervisor value and name persisted in `localStorage` as `acgme_last_supervisor`. On fresh form load, supervisor field is pre-filled with last value and shows a green **STICKY** badge. User can overwrite.

### Auto-Selection Rules
Fire on every platform including iOS Safari. Additive only — deselecting trigger does NOT remove auto-selection.

| Trigger | Action |
|---------|--------|
| DLT (1256336) selected | Set Procedure > Other toggle to Yes. Select Intrathoracic Non-Cardiac (156683). Show purple glow. |
| Intracranial Nonvasc Open (156689) selected | Set Specialized Monitoring toggle to Yes. Select IONM (156708). Show purple glow. |
| Intracranial Vascular Open (156687) selected | Set Specialized Monitoring toggle to Yes. Select IONM (156708). Show purple glow. |

### Visual Design
- Dark theme: `background: #0a0c10`, `surface: #12151c`, `accent: #4fc3f7`
- Fonts: DM Mono + Syne (Google Fonts)
- Auto-selection glow: purple (`#a78bfa` or similar)
- Backup badge: neutral → amber (5+ cases) → red (10+ cases)

---

## Part 2 — Storage

### Dual-Layer Architecture
- **Layer 1 (primary):** IndexedDB — database `acgme_cases_db`, store `cases`
- **Layer 2 (mirror):** localStorage key `acgme_cases`

**On save:** Write to IndexedDB first, then mirror to localStorage.

**On delete:** Remove from both layers.

**On load (reconciliation):** Open both stores, compare by case count, merge by union on `id`, write winner back to both. If IndexedDB unavailable (iOS private mode), fall back to localStorage silently. Log reconciliation result to console.

**Backup badge tracking:** `localStorage` key `acgme_last_export_count` stores the case count at last export. Badge delta = current count − last export count.

### JSON Case Format
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

`life_threat`: null (No) or a value string (e.g., `"46"`). Single value, not array.
`difficult_airway`: null (No) or a value string (e.g., `"148"`). Single value, not array.

---

## Part 3 — Export / Import

### Export Formats
- **JSON:** Full case array, filename `acgme_cases_YYYY-MM-DD.json`
- **CSV:** One row per case, multi-value fields joined with `|`, filename `acgme_cases_YYYY-MM-DD.csv`
  - Columns: `date, case_id, site, supervisor_name, patient_age, asa, anesthesia, airway, proc, vasc, mon, neuraxial, pnb_site`

### Platform Strategy
- **Mobile (iOS/Android):** `navigator.share()` if available → standard `<a download>` blob URL fallback
- **Desktop Chrome:** `window.showSaveFilePicker` if available → blob download fallback
- **All others:** blob download

### Import
- User selects a JSON file
- Parse and merge with existing cases by union on `id` (no duplicates)
- Show count of newly added cases

---

## Part 4 — PWA

### manifest.json
```json
{
  "name": "ACGME Case Log",
  "short_name": "Case Log",
  "display": "standalone",
  "background_color": "#0a0c10",
  "theme_color": "#4fc3f7",
  "start_url": "./case_log.html",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### iOS Meta Tags (in case_log.html)
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Case Log">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

### service_worker.js
Cache-first strategy. On `install`: cache `case_log.html`, `manifest.json`, and Google Fonts URLs. On `fetch`: return cached response if available, else network. Degrade gracefully on iOS < 16.4 (service worker not supported — app still works, just not fully offline on first visit).

### Icons
Simple lettermark icons (canvas-drawn "A" on `#4fc3f7` background) generated as two PNG files: 192×192px and 512×512px, via a small Node script run once. Stored in `app/icons/`.

---

## Part 5 — Playwright Automation Script

### Usage
```
node automation/submit.js --file data/cases_2026-05-24.json
```

### Flow
1. Parse `--file` argument, read and validate JSON
2. Read `data/submitted_log.json` (create if missing), filter out already-submitted case IDs
3. Launch Chromium via Playwright (non-headless)
4. Navigate to `https://apps.acgme.org/ads/CaseLogs/CaseEntry/Insert`
5. Check for logged-in state (look for known element); if not found, print instructions and wait up to 5 minutes with a countdown
6. For each unsubmitted case:
   - Fill all form fields (text inputs by `name` attribute, checkboxes/radios by `id`, selects by `name`)
   - Print readable case summary to terminal
   - readline prompt: `Press Enter to submit, 's' to skip, 'q' to quit:`
   - **Enter:** submit form, wait for success indicator, append to `data/submitted_log.json`
   - **s:** skip, continue to next case
   - **q:** stop immediately, print summary
   - On failure: append to `data/failed_cases.json`, continue
7. Print final tally: X submitted, Y failed, Z skipped

### Field Filling Strategy
- Case date: fill by `name` attribute (`0aa470cf...`), format `M/D/YYYY`
- Case ID: fill by `name` attribute (`241b5737...`)
- Case year: select by `name` attribute `ProcedureYear`, value `"1"`
- Site: select by `name` attribute `Institutions`
- Supervisor: select by `name` attribute `Attendings`
- Patient age: check checkbox by `id` matching the value string
- All other fields (asa, anesthesia, airway, proc, vasc, mon, neuraxial, pnb_site): check checkboxes by `id` matching each value string
- life_threat: check radio by `id` if not null
- difficult_airway: check radio by `id` if not null

### Log Files (in data/)
- `submitted_log.json`: `[{ "id": 123, "submitted_at": "2026-05-24T..." }, ...]`
- `failed_cases.json`: `[{ "case": {...}, "error": "...", "failed_at": "..." }, ...]`

Source JSON file is never modified.

---

## Form Fields Reference

All field IDs sourced from build prompt. Full mapping in `docs/FORM_SPEC.json`.

### Key Field Names (ACGME form)
| Field | Form attribute |
|-------|---------------|
| Case date | `name="0aa470cfec674edb8dfea78bae7c6db66d00275bb229ac151f877a914c53ab32"` |
| Case ID | `name="241b5737466b842c64632223ab521623e1f224192dba83882fe0672ba38c7be4"` |
| Case year | `name="ProcedureYear"` |
| Site | `name="Institutions"` |
| Supervisor | `name="Attendings"` |
| Patient age | `name="PatientTypes"` |
| All checkboxes | `id="{value}"` |

---

## Build Order

1. Scaffold file structure (`app/`, `automation/`, `data/`, `docs/`)
2. Rebuild `docs/FORM_SPEC.json` as proper JSON from build prompt data
3. Build `app/case_log.html` — full UI, pre-selections, toggles, expanders, auto-selection rules, bottom bar
4. Add PWA support — `manifest.json`, `service_worker.js`, iOS meta tags, icons
5. Implement storage — IndexedDB primary, localStorage mirror, reconciliation on load
6. Implement export/import — JSON + CSV, Web Share on mobile, File System Access on desktop
7. Build `automation/submit.js`
8. Commit after each major step

---

## Out of Scope

- Multi-device sync
- Case statistics dashboard
- ACGME minimum tracker
- Auto-export on save
- Batch submission scheduling
- Edit saved case (roadmap item)
- Duplicate last case button (roadmap item)
