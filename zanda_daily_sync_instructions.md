# Daily Zanda availability sync — current entrypoints

Read current `scripts/import_availability_api.ts`, its current approved Zanda connection declarations, and recent availability evidence before running. Do not execute older Python/page-count workflows or use embedded credentials.

- Fetch/validate sufficient complete Zanda pages using the approved API connection and current importer rules. Do not weaken completeness or overlap safeguards.
- The importer calls `refreshCrmAlerts` from `scripts/crm_alerts.ts` before writing. This fetches separate internal/client notes plus all three approved upcoming-leave fields through `scripts/crm_upcoming_leave.ts`, including blank clearing and Josh's direct fallback. The mandatory `crm_leave_approvals.ts` exact-signature guard withholds unconfirmed/newly edited notices without editing CRM. Refresh its approval snapshot only after a fresh authorized Confirmed correct sheet read; publish/mirror the dependency with mapper. Amy remains unconfirmed and must not leak on an ordinary daily refresh.
- Upcoming-leave field authority and Melbourne date/render/send behavior are documented in `workflows/upcoming_leave_notices.md`. Never derive a client notice from HR leave reasons/status or internal notes.
- Preserve approved hours, fees, photos, membership, Krista pause and existing notices. CRM-only tasks must not reimport Zanda or change AVAILABILITY_LAST_UPDATED.
- Synchronize canonical/four deploy JSON consumers and both generated TS copies, rebuild Tasklet and production app, publish with `scripts/publish_daily_availability.ts` using the approved GitHub connection. That publisher permits only availability plus the five CRM note/leave fields. It publishes the new helper dependency as well as crm_alerts.
- Build/show Tasklet preview when the preview tool is available; never claim its host preview rebuilt when the tool is unavailable. Verify Netlify JSON and SPA after propagation. Save evidence and report blockers. No client emails.
