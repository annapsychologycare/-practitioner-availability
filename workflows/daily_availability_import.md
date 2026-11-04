# Daily Availability Import — Zanda API

## Purpose and boundaries
Run the complete morning refresh and publish practitioner availability. Import/app data retains Weekly, Fortnightly and Monthly. **Email presentation is different** (Anna, 5 November 2026): main email lists/counts Weekly and Fortnightly ONLY, deduplicated rows AND counts. This supersedes every older instruction to list Monthly or show all location rows separately.

## Connection and dates
- Active Zanda `conn_eps1awzjskk2nv579hf9` / `remote_http_call`, GET only. Old connection revoked. Read current CONNECTION.md and TOOLS.d.ts before calling. Never put credentials in files.
- Preserve tested importer date filters and cursor pagination, pageSize=50. Melbourne tomorrow through today+56 days inclusive; never today. Fresh runs clear stale checkpoints; recover only verified same-run checkpoints.
- Daily/targeted importers and AdHocAvailabilityTab mirrors use active connection. Ad-hoc standalone UI additionally needs the host `window.tasklet.invokeTool` bridge; connection routing alone does not restore it. Targeted importer dates are explicit; update before reuse.

## 1. Guard and import
Read existing sources before overwriting. Run `scripts/check_refresh_baseline.ts` and current `scripts/guard_daily_sources.ts` baseline check before importing. Preserve latest published CRM profile metadata, confirmed leave notices/styling, staff-auth/recovery/private infrastructure, working hours, Kiira/Maddie/Josh restrictions, Krista intake pause, David no-Monthly, and calendar-driven roster. No personal ages/DOB import/publication. Do not touch Fee Schedule or `netlify.toml`.

Read `workflows/upcoming_leave_notices.md` and shared CRM mapping/approval guidance before any leave changes. Suppress unapproved notes; do not infer approvals.

Run from `scripts/`: `bun -i import_availability_api.ts`, capturing success JSON as `/tmp/import_result.json`. Persist dated import evidence; importer also saves `availability_raw_latest.json` (private local occurrence evidence, never publish raw records).

Importer refreshes separate CRM fields via `crm_alerts.ts`: `Intake_Alert_Notes_Internal` → staff-only `alert`; `Intake_Alert_Notes` → `client_note`. Blank CRM values clear notes. Never use legacy notes/pipe fallback or expose staff notes to client outputs. Preserve approved leave mapping/suppression.

On importer error notify Anna and stop without publication. Do not reuse stale success JSON.

## 2. Synchronize, validate, build
Synchronize all canonical/app/deploy/root JSON/TypeScript representations, preserving location-level newline strings and unrelated metadata. Run `scripts/validate_availability_refresh.ts` and applicable leave/profile guards.

Build BOTH:
- Standalone: stage current app `*.tsx`, `practitionersData.ts`, `emailTemplateConfig.ts`, `constants.ts`, `types.ts`, package.json, `utils/`, `components/` in `/tmp/prac-build`; install dependencies and `bun build app.tsx --bundle --format iife --outfile bundle.js`. Copy output to app `bundle.js` and deploy `src/bundle.js`. Include current leave dependencies.
- Active Vite: root `index.html` → `src/App.tsx`. Build current deploy sources using an isolated `/tmp` staging directory if mounted installs are slow. Standalone build alone does not deploy active UI changes. Keep root `practitionersData.ts` synchronized.

## 3. Publish and verify
GitHub `conn_nvshm6rz3kzncg0nh4vk`, repo `annapsychologycare/-practitioner-availability`, branch `main`. Read guidance/declaration first.

Use guarded `scripts/publish_daily_availability.ts`; its current file list is authoritative (not historical 4/17-file lists). It includes leave dependencies, routing mirrors and canonical email/review/test/workflow files. Verify read-back of all published files and protected source/infrastructure. Verify actual Netlify live timestamp, JSON SHA-256 and active bundle hash before success email. Push success alone is insufficient. Do not change `netlify.toml`.

## 4. Canonical email and consolidation review (Anna-approved 5 November)
Run `bun test ./scripts/test_availability_email_review.ts` from work/ before sending. Run `scripts/build_send_email.ts`, which uses `availability_email_review.ts`:
- Reads `/tmp/import_result.json` (or explicit `IMPORT_RESULT_PATH`) and `availability_raw_latest.json` (or `RAW_EVIDENCE_PATH`); windows must match. Never prefer stale `/tmp/import_result_clean.json`.
- Main list/counts: Weekly/Fortnightly only. **No Monthly main rows/counts.** One row/count per practitioner/day/start/frequency; combine alternative location/first-date labels in that row. Do not double count mirrored locations or different first dates. Main practitioner count includes only represented practitioners.
- Josh: main email Telehealth-only. Suppress duplicate clinic representations only in email, never change app data. Clinic-only unique patterns must be flagged separately with source location/first date, excluded explicitly from main count, not silently dropped or relabelled Telehealth. Flag later clinic dates; never promise they recur remotely.
- Retain inline styles, alphabetical practitioner list, green Weekly/purple Fortnightly rows. No `<style>`/class reliance. Escape source text. Do not expose general staff CRM notes.
- Review **actual occurrence evidence**, not summary first dates or free diary gaps. Opposite Fortnightly phases 7 days apart may align Weekly; Monthly here means demonstrated 28-day phases 14 days apart may align Fortnightly. Separate exact practitioner/day/start/duration/capacity-group type proxy/physical-location groups. Duplicate locations/dates cannot manufacture phases. Do not combine incompatible types/durations/locations.
- Require >=2 observed active Pending dates per phase, no missing internal dates and no active non-pending conflicts in the proposed finite interval. Inactive historical records are excluded, not treated as booked capacity. Report full-window missing/boundary/cancelled dates. Partial-window alignments must be labelled **limited-window only, not ongoing recurrence recommendations**, with exact evidence dates and interval. Actual clinical type, recurrence IDs/end dates and real-client bookings are not fully exposed by placeholder extraction: require Anna to verify in Zanda. Reject insufficient/gapped/conflicting pairs. Monthly source may appear ONLY in this separate review, never main availability counts/list.
- Suggestions are alerts only, NOT confirmed capacity, not added to main counts. **Never modify recurrence, Zanda, app availability, timestamp, profiles, login/private infrastructure or leave notices for this review.** Anna updates Zanda if appropriate.
- Persist JSON review, HTML and Gmail receipt. `--preview` produces artifacts without sending. `EMAIL_ARTIFACT_SUFFIX` preserves dated/ad-hoc evidence. Identical-content send ledger prevents blind duplicate sends; investigate before retrying ambiguous send results.

Send full slot-by-slot HTML to **anna@psychologycare.com.au**, Gmail `conn_nrjy2ygpjb7gn16jk3et` / `gmail_send_message`. Read current guidance/declaration. Script must pass actual HTML string as `bodyHtml`, not its path. Subject/headline use deduplicated Weekly/Fortnightly totals. Always send success confirmation after a full refresh; no client emails.

For an email-only policy update, use latest successful dated import/raw evidence; no fresh import, app rebuild or unrelated data deployment required. Publish only changed canonical scripts/workflow/tests through a narrowly scoped GitHub commit with read-back verification.

## Error handling
- Import/build/guard failure: notify Anna, do not push stale/unsafe data.
- Push failure: notify Anna that local files changed but were not published.
- Deployment not verified: do not claim live success; report exact blocker.
- Preserve import-generated `AVAILABILITY_LAST_UPDATED`; email-only review does not change it.
- Never use `node_bundler = "esbuild"` or global timeout in `netlify.toml`.
