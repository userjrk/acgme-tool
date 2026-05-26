# Roadmap

Ideas, planned features, and known issues. Updated as the project grows.

---

## Now — Core Functionality

- [x] Web app: fast case entry with chip-based UI
- [x] Web app: localStorage persistence
- [x] Web app: JSON export / import
- [x] Web app: CSV export
- [x] Web app: backup reminder badge
- [x] Form spec documented (field IDs, values, submit endpoint)
- [x] Playwright script: read JSON and submit cases to ACGME
- [x] Playwright script: pause between cases for user review
- [x] Playwright script: mark cases as submitted in JSON
- [x] PWA support (manifest + service worker, installable on iOS/Android)
- [x] IndexedDB redundant storage (primary) + localStorage (mirror)
- [x] Web Share API on iOS for JSON/CSV export
- [x] GitHub Pages deployment
- [x] Google Sheets integration (sync on each save)
- [x] Resident name field (sticky, program-wide)
- [x] Edit saved cases (✏️ button, full form repopulation, Update Case)
- [x] Chrome extension — review mode + auto mode
- [x] Extension install page (app/install.html)
- [x] Design references archived in docs/design-references/
- [ ] End-to-end test with real ACGME session

---

## Up Next

- [ ] Test Chrome extension against live ACGME portal
- [ ] Verify Google Sheets sync is receiving data
- [ ] Program-wide rollout to other residents
- [ ] Case statistics dashboard
- [ ] ACGME minimum tracker

---

## Later — Bigger Ideas

- [ ] **Mobile PWA**: package the HTML app as an installable app on iPhone/Android home screen so it feels native
- [ ] **Multi-device sync**: move from localStorage to a lightweight cloud sync (could use a private GitHub Gist or Cloudflare KV) so cases entered on phone are available on laptop
- [ ] **Auto-export on save**: optionally write each new case immediately to a file in a watched OneDrive/iCloud folder — eliminates the manual backup step
- [ ] **Batch submission scheduling**: run the Playwright script on a schedule (e.g., Sunday night) so submission is truly automatic

---

## Known Issues / Limitations

- localStorage is browser and device specific — if you clear browser data, unsaved cases are lost. Always export JSON before clearing.
- The automation script requires manual login to ACGME first — there is no way to automate login without storing credentials, which is intentionally avoided.
- ACGME may change their form field IDs without notice — if the script breaks, re-inspect the form and update `docs/FORM_SPEC.json`.

---

## Design Principles

1. **No data loss.** Every save goes to localStorage immediately. JSON backup is always one tap away.
2. **No lock-in.** Data stays in standard JSON. The tool can be abandoned and the data still used elsewhere.
3. **Resident controls every submission.** The script never submits without a pause for review.
4. **Simple to hand off.** A fellow resident should be able to pick this up with just the README.
