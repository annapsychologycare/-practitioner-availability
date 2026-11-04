# Staff authentication and private practitioner ages

## Boundary
The published matching/intake/email app remains public and operational. Optional staff sign-in secures **new age data only**. Do not describe existing staff-looking tabs or internal notes as newly private. Public canonical JSON, photo sidecar, generated TS, all public bundles and matching/email payloads must never gain DOB or personal-age properties.

Production origin: https://pc-prac-availability.netlify.app. Netlify Identity registration is invite-only with email confirmation required. Initial authorized user is Anna, anna@psychologycare.com.au, Identity ID `62034e21-7b19-4dd4-b092-20fe230108bf`, administrator-controlled role `staff-age`. All four conditions (verified session, exact ID/email, confirmed email, trusted role) are checked server-side. Domain membership or user_metadata roles are not sufficient. New staff require explicit approval and policy change.

`staff-session` uses the supported @netlify/identity SDK server-side for individual login, invitation acceptance, refresh and logout. No DIY password check or shared secret, no browser-localStorage token code. Supported SDK Secure/SameSite cookies are used; this integration does not claim an additional HttpOnly hardening beyond the SDK. POSTs require canonical same-origin Origin and JSON. Private endpoints return no-store/private headers. Preview/non-production origins fail closed. Invitation/recovery hashes are immediately removed from browser history and kept only in transient form state.

`staff-ages` is server-authorized before accessing private Netlify Blobs. Store `private-staff-age-snapshots`, key `current`, contains **age-only** data; no DOB/names/CRM notes. No CORS exemption. GET returns only public practitioner IDs + age for a snapshot whose asOfDay equals current Melbourne day. Otherwise no ages/refreshRequired. PUT is Anna-only same-origin, validated and complete-replacement; rejected payloads do not alter existing data. Private age state is cleared on logout, visibility change and session check failure; it is never merged into Practitioner objects.

Netlify environment flag `STAFF_PRIVATE_ACCESS_ENABLED` is scoped to Functions only: production `true`, Deploy Previews/branch/preview runners/local `false`. It is a nonsecret feature switch, not an authentication credential. Netlify's build-only CONTEXT variable is not relied on at function runtime. No netlify.toml changes.

## Initial activation / release gate
Empty protected infrastructure can be deployed without private data. Anna must accept the invitation, set her own password in the site form and sign in herself. Agent must never request passwords/tokens in chat. Verify live signed-in authorized path, session logout/expiry, and no-token/forged-token failures before reading/importing real DOB-derived ages. No real sensitive snapshot has been loaded during infrastructure setup.

## Ongoing CRM sync: explicit current limitation
**Existing daily/weekly public availability/CRM jobs remain unchanged. They do NOT automatically refresh private ages.** Never put DOB/ages into those public mappers or push helpers.

Private refresh requires an authenticated Anna browser session. A separately authorized private preparation step may read CRM Date_of_Birth, calculate age for today's Australia/Melbourne date, output `{asOfDay:"YYYY-MM-DD",ages:[{id:"public practitioner ID",age:integer}]}` outside every app/deploy/repository directory, then import with the signed-in staff panel. Never log DOB or place it in reports. Invalid/future/missing/blank DOB is omitted; complete replacement removes a previous age. Must verify actual ID mapping against existing CRM reconciliation, not fuzzy match names. Do not invent client `Ages` mapping. Current code intentionally accepts only IDs in current public practitioner list.

The endpoint expires the whole snapshot each Melbourne midnight, so a daily refreshed age is necessary (no stale birthday age). This is **manual authenticated import until a separately approved secure scheduled update credential/provider mechanism is configured**. If session/refresh is unavailable, public jobs continue unaffected and private ages disappear next day; report missing refresh rather than silently promise automation. No plaintext service/session tokens in scripts/repo. A future unattended mechanism requires separate approval/configuration and must remain age-only, server-private and fail closed.

## Sources/tests
Server policy/functions: deploy/netlify/lib/staff-policy.ts; deploy/netlify/functions/staff-session.ts and staff-ages.ts. Mirrored components: apps/practitioner-availability/components/StaffAccess.tsx and deploy/src/components/StaffAccess.tsx. Only matching result cards use StaffAge; compare/client email/copy/send/external matching prompts do not access the private context.

Tests: scripts/test_staff_access.ts, existing confirmed-leave/design/stairs regressions. Publication must preserve canonical data hash, availability timestamp, 17 approved leave notices, pause, hours, fees and photos; netlify.toml is unchanged.
