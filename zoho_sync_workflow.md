# Zoho Sync Workflow

Run every Sunday 11pm Melbourne time (and on demand via "sync from Zoho" in chat).

## Step 1 — Fetch from Zoho CRM

Search Zoho Contacts using:
  criteria: `(Account_Name:equals:PsychologyCare)`

**NOT** Contact_Type — Anna identifies practitioners by Account_Name = PsychologyCare.
This correctly captures everyone including practitioners whose Contact_Type is blank (e.g. Joshua Kugel).

Save the result records array to `/tmp/zoho_raw_data.json` as a JSON array.

Non-practitioner contacts in the result (Admin PsychologyCare, Anna Donaldson - Client, Charlotte Davenport, etc.) are filtered automatically by skip_names in the sync script.

## Step 2 — Run sync script

```
python3 /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/sync_from_zoho.py
```

Result is written to `/tmp/zoho_sync_result.json` with keys:
- `log` — human-readable summary
- `changed` — list of practitioner names that had field changes
- `changes_log` — dict of {name: {field: [old, new]}} for changed fields
- `unchanged` — list of names with no changes
- `skipped` — names with no Zoho match (preserved as-is)

## Step 3 — Sync deploy files

### CRM alert requirement
`Contacts.Intake_Alert_Notes` is the source for practitioner notices. Text before `|` is internal only; text after `|` is approved for client availability email banners. For a client-only notice start with `| `. Do not publish unmarked internal notes. Preserve existing app alerts when CRM is blank or unmarked. To explicitly remove a client banner, leave `internal wording |` in CRM.

Before regenerating app TypeScript/bundles, refresh these notes using `refreshCrmAlerts` in `/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/scripts/crm_alerts.ts`. It also fetches Joshua Kugel directly if the account search omits him. The daily Zanda importer now performs this refresh automatically. Use live CRM values, not an older snapshot, and preserve unrelated profile fields and AVAILABILITY_LAST_UPDATED.

After sync_from_zoho.py runs, copy updated `practitionersData.ts` to deploy:
```
cp /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/apps/practitioner-availability/practitionersData.ts /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/deploy/src/practitionersData.ts
```
Also update practitioners-data.json for Netlify functions:
```python
python3 /tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work/update_practitioners_json.py  # if exists, else extract from TS
```

## Step 4 — Push to GitHub

Clone repo, copy deploy folder contents, commit and push.
Commit message: `chore: Sunday Zoho sync — {N} practitioners matched`

## Step 5 — Email audit to anna@psychologycare.com.au

Subject: `Zoho Sync Report — {date}`

Include in email:
- Total matched from Zoho
- **Which practitioners had field changes** and exactly which fields changed (from `changes_log`)
- Who was unchanged
- Who had no Zoho match (preserved as-is)
- Any errors or warnings
