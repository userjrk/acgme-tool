# Installing the ACGME Case Submitter Extension

## One-time setup (5 minutes)

1. Download the extension:
   Go to github.com/userjrk/acgme-tool
   Click Code → Download ZIP
   Unzip the file
   Find the extension/ folder inside

2. Open Chrome extensions:
   Type chrome://extensions in your address bar
   Press Enter

3. Enable Developer Mode:
   Toggle the switch in the top-right corner of the page
   It should turn blue

4. Load the extension:
   Click "Load unpacked"
   Navigate to and select the extension/ folder
   Click Select Folder

5. Pin to toolbar:
   Click the puzzle piece icon in Chrome toolbar
   Find "ACGME Case Submitter"
   Click the pin icon

## Using it each week

1. Log into ACGME at apps.acgme.org
2. Navigate to the Case Log entry page
3. Click the extension icon in your toolbar
4. Click "Select JSON export"
5. Find your exported JSON file from the Case Log app
6. Choose your mode:
   - Review each case (recommended): extension fills one
     case at a time, you review and click Submit & Next
   - Auto-submit: extension submits all cases automatically
7. Click the submit button and follow the prompts

## Submission modes explained

Review mode (recommended):
The extension fills the ACGME form with one case,
then waits for you to review it and click Submit & Next.
You can see exactly what was filled before it submits.
Best for: weekly submission, first time using the tool.

Auto mode:
The extension submits all cases without pausing.
Best for: when you trust the data and want hands-off speed.

## Troubleshooting

"Not on ACGME" shows in the popup:
→ Navigate to apps.acgme.org and log in first

Cases show as "Already submitted":
→ These were submitted in a previous session and are
  being skipped to prevent duplicates. This is correct.

A case shows as Failed:
→ Export the submission report and check the reason.
  Usually means a field changed on the ACGME form.
  Contact the app maintainer with the report.

A case filled incorrectly in review mode:
→ Click Skip, edit the case in the Case Log app,
  re-export JSON, and resubmit.

## After updates

When the extension is updated, repeat steps 2-4.
Your submission history and settings are preserved.
