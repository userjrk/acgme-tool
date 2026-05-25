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
