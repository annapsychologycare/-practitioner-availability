# Daily Availability Import — Zanda API

## Purpose
Runs every morning to fetch the next 8 weeks of practitioner availability from the Zanda API
and publish it to the practitioner availability app on Netlify/GitHub.

## Steps

### 1. Run the import script
```
cd /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/scripts && bun -i import_availability_api.ts
```
- Captures stdout as JSON summary (ok, matched, unmatched, slots, totalSlots)
- stderr contains progress logs — ignore in final output
- On error: email anna@psychologycare.com.au with the error message and stop
- The importer also refreshes practitioner notices from CRM `Intake_Alert_Notes` using `scripts/crm_alerts.ts`. Text after `|` is client-facing; unmarked notes are internal only and must not erase an existing banner. Keep `crm_alerts.ts` beside the importer and publish both scripts. Alert changes from this CRM refresh are expected in the daily publish guard.

### 2. Rebuild the bundle
Copy latest source files to /tmp/prac-build/ then rebuild:
```
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/*.tsx /tmp/prac-build/
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/practitionersData.ts /tmp/prac-build/
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/emailTemplateConfig.ts /tmp/prac-build/
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/constants.ts /tmp/prac-build/
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/types.ts /tmp/prac-build/
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/package.json /tmp/prac-build/
cp -r /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/utils /tmp/prac-build/utils
cp -r /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/components /tmp/prac-build/components
cd /tmp/prac-build && bun install --silent && bun build app.tsx --bundle --format iife --outfile bundle.js
```
Then copy bundle back:
```
cp /tmp/prac-build/bundle.js /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/bundle.js
cp /tmp/prac-build/bundle.js /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/deploy/src/bundle.js
```

### 3. Push to GitHub
Use connection: conn_nvshm6rz3kzncg0nh4vk
Tool: github_push_to_branch
Repo: annapsychologycare / -practitioner-availability, branch: main
Commit message: "Availability update via Zanda API — {date}"
Files to push:
- src/practitioners_data.json → /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/practitioners_data.json
- src/practitionersData.ts → /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/deploy/src/practitionersData.ts
- bundle.js → /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/deploy/src/bundle.js
- public/bundle.js → /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/deploy/src/bundle.js

### 4. Email summary

Run the canonical email script which reads /tmp/import_result.json and sends via Gmail:
```
cd /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/scripts && bun -i build_send_email.ts
```

This script handles all formatting, colour-coding, and sending automatically.
If it fails or doesn't exist, fall back to the manual HTML template below.

Send to: anna@psychologycare.com.au
Via Gmail connection: conn_nrjy2ygpjb7gn16jk3et
Tool: gmail_send_message
Subject: "Availability Update — {date} ({N} slots across {M} practitioners)"

IMPORTANT: Use scripted tool calling via invokeTool (import from @tasklet/tools/v2). Read the HTML file as a string with readFileSync and pass it as `bodyHtml`. Never pass a file path as the bodyHtml value — it must be the actual HTML content string.

Use the following HTML template exactly (fill in the variables):

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
  .container { max-width: 620px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #2C244C; color: white; padding: 28px 32px; }
  .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
  .header p { margin: 0; font-size: 14px; opacity: 0.8; }
  .body { padding: 28px 32px; }
  .summary-box { background: #f7f3f5; border-left: 4px solid #8D5273; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px; font-size: 14px; color: #333; }
  .summary-box strong { font-size: 15px; }
  .summary-box .sub { margin-top: 6px; color: #666; font-size: 13px; }
  h2 { font-size: 16px; color: #2C244C; margin: 0 0 12px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #2C244C; color: white; text-align: left; padding: 10px 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:nth-child(even) td { background: #faf8fb; }
  .prac-name { font-weight: 600; color: #2C244C; }
  .footer { padding: 16px 32px; font-size: 12px; color: #999; border-top: 1px solid #eee; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Availability Update — {DATE e.g. "5 Aug 2026"}</h1>
    <p>Updated via Zanda API at {TIME e.g. "6:01am"}</p>
  </div>
  <div class="body">
    <div class="summary-box">
      <strong>{N} availability slots across {M} practitioners</strong> — next 8 weeks ({START_DATE} – {END_DATE})<br>
      <div class="sub">{WEEKLY_COUNT} weekly spots · {FORTNIGHTLY_COUNT} fortnightly spots · {MONTHLY_COUNT} monthly spots</div>
      <div class="sub">{TOTAL_APPOINTMENTS} pending appointments fetched · {UNMATCHED} unmatched practitioners</div>
    </div>
    {IF UNMATCHED > 0: add a red-bordered warning box listing unmatched names}
    <h2>Practitioners with Availability</h2>
    <table>
      <thead><tr><th>Practitioner</th><th>Location</th><th>Slot</th></tr></thead>
      <tbody>

        ROW COLOUR LOGIC — all practitioners in one alphabetical list (by last name).
        Each slot row is coloured based on its frequency:
          - Weekly slot   → green background:  background:#e8f5e9; border-left: 3px solid #4caf50;
          - Fortnightly slot → purple background: background:#f3e5f5; border-left: 3px solid #9c27b0;
          - Monthly slot  → blue background:   background:#e3f2fd; border-left: 3px solid #2196f3;

        Detect frequency by checking whether the slot string contains "(Weekly:", "(Fortnightly:", or "(Monthly:".

        {FOR EACH PRACTITIONER (sorted by last name):}
        {FOR EACH SLOT of that practitioner:}

        If slot contains "(Weekly:":
        <tr style="background:#e8f5e9;">
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;border-left:3px solid #4caf50;font-weight:600;color:#2C244C;">{NAME on first row only, else blank}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{LOCATION}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{SLOT}</td>
        </tr>

        If slot contains "(Fortnightly:":
        <tr style="background:#f3e5f5;">
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;border-left:3px solid #9c27b0;font-weight:600;color:#2C244C;">{NAME on first row only, else blank}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{LOCATION}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{SLOT}</td>
        </tr>

        If slot contains "(Monthly:":
        <tr style="background:#e3f2fd;">
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;border-left:3px solid #2196f3;font-weight:600;color:#2C244C;">{NAME on first row only, else blank}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{LOCATION}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #eee;vertical-align:top;">{SLOT}</td>
        </tr>

        {END FOR}
        {END FOR}

      </tbody>
    </table>
  </div>
  <div class="footer">Updated via Zanda API. Netlify will deploy automatically.</div>
</div>
</body>
</html>
```

Counts to compute from the slots array:
- WEEKLY_COUNT = number of slots where slot string contains "(Weekly:"
- FORTNIGHTLY_COUNT = number of slots where slot string contains "(Fortnightly:"
- MONTHLY_COUNT = number of slots where slot string contains "(Monthly:"

Slot format: "{Day}s at {time} ({Weekly|Fortnightly|Monthly}: Starting {D Mon})" e.g. "Tuesdays at 1pm (Weekly: Starting 1st Sept)"
Location format: "Greville St, Prahran" / "Burke Rd, Camberwell" / "Telehealth"
Practitioner name: show only on the FIRST row for each practitioner; leave blank for subsequent rows of the same practitioner.

IMPORTANT: Gmail does not support `<style>` blocks — convert ALL CSS to inline `style="..."` attributes before sending. Do NOT use class-based CSS in the email HTML.

## Error handling
- If the import script returns ok:false or non-zero exit, email Anna with the error and do not push
- If bundle build fails, email Anna and do not push
- If GitHub push fails, email Anna noting files were updated locally but not pushed

## Key rules
- Do NOT email if everything worked silently (email IS the confirmation) — always send the summary
- Preserve AVAILABILITY_LAST_UPDATED timestamp (the import script handles this)
- Do not use node_bundler = "esbuild" or global timeout in netlify.toml
- Availability data in practitioners_data.json uses newline-separated strings (the script handles this)
