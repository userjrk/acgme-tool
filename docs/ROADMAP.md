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
- [ ] Playwright script: read JSON and submit cases to ACGME
- [ ] Playwright script: pause between cases for user review
- [ ] Playwright script: mark cases as submitted in JSON
- [ ] End-to-end test with real ACGME login session

---

## Next — Quality of Life

- [ ] Web app: notes/free-text field per case (not submitted, just for personal reference)
- [ ] Web app: duplicate last case button (for days with similar back-to-back cases)
- [ ] Web app: edit a saved case before exporting
- [ ] Web app: case counter by category (how many generals, how many spinals this month)
- [ ] Automation: dry-run mode that logs what would be submitted without actually submitting
- [ ] Automation: resume from a partially completed batch (skip already-submitted cases)

---

## Later — Bigger Ideas

- [ ] **Mobile PWA**: package the HTML app as an installable app on iPhone/Android home screen so it feels native
- [ ] **Case statistics dashboard**: visualize case mix over time — cases by type, attending, ASA status, procedure category — useful for tracking toward ACGME minimums
- [ ] **ACGME minimum tracker**: overlay required case numbers per category against what's been logged so far
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
