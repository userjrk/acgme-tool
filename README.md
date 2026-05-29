# ACGME Case Log Tool

## Live App

Open on any device: https://userjrk.github.io/acgme-tool/app/case_log.html

iPhone: open in Safari → Share → Add to Home Screen

Android: open in Chrome → Add to Home Screen

---

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

## Chrome Extension

Automatically fills and submits your saved cases to the ACGME portal.

Install page: https://userjrk.github.io/acgme-tool/app/install.html

- **Review mode** (recommended): fills one case at a time, you review and click Submit & Next
- **Auto mode**: submits all cases without pausing
- **Detect manual submit** (ON/OFF toggle): detects when you submit the ACGME form directly
- **Resubmit override**: re-queue previously submitted cases via checkbox + Apply button
- **Session persistence**: popup restores state if closed and reopened mid-session

Visit the install page for setup instructions and the latest download:
https://userjrk.github.io/acgme-tool/app/install.html

## Program-Wide Use

Share the live app URL with other residents in the program:
https://userjrk.github.io/acgme-tool/app/case_log.html

Each resident enters their name once — it sticks. All cases sync to the shared Google Sheet automatically.
Setup guide: docs/GOOGLE_SHEETS_SETUP.md

## Requirements

- Node.js 18+
- `npm install` (installs Playwright)
