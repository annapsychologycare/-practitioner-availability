# Approved upcoming-leave notices — 4 November 2026

## Authority and fields
Contacts `Upcoming_leave_client_notice` → `upcoming_leave_client_notice`.
Contacts `Show_notice_from` → `upcoming_leave_show_from`.
Contacts `Hide_notice_after` → `upcoming_leave_hide_after`.

Only these approved client fields govern this separate section. Never derive client text from HR reasons, status, internal notes, or general leave fields. Null/blank clears local values. Missing fields abort import rather than silently retaining stale text. No live examples have been entered; all three fields currently blank for the 25 matched practitioners.

## Scheduling and display
Dates are date-only YYYY-MM-DD, inclusive in Australia/Melbourne, independent of browser timezone. Blank dates are unbounded; blank text hides. Invalid calendar dates, invalid types, or reversed ranges hide. `utils/upcomingLeave.ts` evaluates dates every render; open staff/email views update every second and on focus/resume. Copy and send explicitly regenerate HTML using the current time. Email places one escaped Upcoming leave section after that practitioner's availability. Existing internal/client notes remain separate. Krista pause suppresses all three leave fields as well as existing withheld notes/availability.

## Shared sync support
`scripts/crm_upcoming_leave.ts` is the only CRM mapping. `mapCrmNotes` in `scripts/crm_alerts.ts` includes it, so weekly CRM reconciliation and the daily API importer both refresh the exact same fields, including blank clearing. Account search must be complete; Josh's direct-record fallback is retained. All 25 existing members must match uniquely. The daily publisher explicitly permits these CRM-controlled field changes without permitting arbitrary profile changes.

Use current full CRM reconciliation based on `scripts/apply_crm_sync_2026-11-04.ts`, adapting dated source/backup locations and reading live evidence first. It now permits established mapped fields including all three leave fields; do not execute against historical snapshots missing the new CRM fields. The old Python importer is not authoritative. Refreshing CRM alone must not fetch Zanda, change availability or its timestamp, overwrite approved hours, fees or photos, remove approved general client notices, or unpause Krista.

Canonical JSON, four deploy JSON consumers, Tasklet TS, deploy/src TS and source components/helpers must stay synchronized. Publish both src and apps source paths, generated TS/JSON and established bundles. Include `scripts/crm_upcoming_leave.ts` whenever publishing `scripts/crm_alerts.ts`; keep deploy/src helper mirrors synchronized. Never change forbidden netlify.toml settings or the separate Fee Schedule app.

## Tests
Run `bun scripts/test_upcoming_leave.ts` from the work root. Fixtures are local only. Covers Melbourne midnight inclusive boundaries, unbounded dates, invalid/reversed ranges, whitespace text, escaping, multiple practitioners, expiry on email regeneration, internal/HR leakage, Krista pause, blank mapping and all existing data/photos/timestamp preservation. Build both Tasklet IIFE and Vite production app. Verify production JSON hash and production asset, then use an unsent email preview. No client emails are authorized by this feature.
