# ACGME Case Log Tool

A personal productivity tool for anesthesia residents to capture and automatically submit case logs to the ACGME ADS portal.

---

## The Problem

Logging cases into ACGME ADS after every OR day is slow. The portal is clunky on mobile, requires clicking through long dropdowns, and if you fall behind, catching up is painful. Cases get forgotten.

## The Solution

**Step 1 — Capture fast.**
Open `app/case_log.html` on your phone or laptop right after a case. Tap through chips to record what you did in under 30 seconds. Hit Save. Done.

**Step 2 — Submit in bulk.**
Once a week, export your saved cases as a JSON file and run the automation script. It opens ACGME in your browser (where you're already logged in), fills each case, and waits for your confirmation before submitting.

---

## Quick Start

### Web App
Just open `app/case_log.html` in any browser. No installation needed.
- Works offline
- Saves to browser localStorage automatically
- Export JSON backup from the saved cases panel

### Automation Script
```bash
# Install dependencies (one time)
npm install

# Run the submission script
node automation/submit.js --file data/cases_2026-05-24.json
```

You must be logged into ACGME in the same browser profile before running.

---

## Project Structure

```
acgme-tool/
├── app/
│   └── case_log.html       # The case entry web app
├── automation/
│   └── submit.js           # Playwright submission script
├── data/                   # Your exported JSON files (not synced to GitHub)
├── docs/
│   ├── CONTEXT.md          # Full background and design notes
│   ├── FORM_SPEC.json      # ACGME form field mapping
│   └── ROADMAP.md          # Planned features
├── CLAUDE.md               # Briefing file for Claude Code sessions
└── README.md               # This file
```

---

## Privacy & Data Safety

- Case data (JSON files) is **never pushed to GitHub** — the `data/` folder is gitignored
- The automation script talks directly to ACGME using your existing browser session
- No third-party servers involved at any point

---

## Built With

- Vanilla HTML/CSS/JS (web app — zero dependencies)
- Node.js + Playwright (automation)

---

## Development

This project is built and maintained using Claude Code.
See `CLAUDE.md` for the full technical briefing used in each session.
See `docs/ROADMAP.md` for planned features and known issues.
