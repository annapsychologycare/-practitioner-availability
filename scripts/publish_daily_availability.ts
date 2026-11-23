import {assertAvailabilityWindow} from './availability_horizon';
import { invokeTool } from '@tasklet/tools/v2';
import { readFileSync, writeFileSync } from 'node:fs';
const base = '/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
const result = JSON.parse(readFileSync('/tmp/import_result.json', 'utf8'));
assertAvailabilityWindow(result.dateRange);
if (!result.ok || !result.totalSlots) throw new Error('Invalid or empty import; refusing to publish');
const before = JSON.parse(readFileSync('/tmp/practitioners_before_import.json', 'utf8'));
const after = JSON.parse(readFileSync(`${base}/practitioners_data.json`, 'utf8'));
const strip = (p:any) => { const {availability, confirmed_slots, locations, alert, client_note, upcoming_leave_client_notice, upcoming_leave_show_from, upcoming_leave_hide_after, ...rest} = p; return {...rest, locations: (locations ?? []).map((l:any)=>{const {availability,...r}=l;return r;})}; };
if (JSON.stringify(before.map(strip)) !== JSON.stringify(after.map(strip))) throw new Error('Unexpected non-availability changes');
const r = await invokeTool({toolName:'github_push_to_branch',connectionId:'conn_nvshm6rz3kzncg0nh4vk',args:{
  owner:'annapsychologycare',repo:'-practitioner-availability',branch:'main',
  commitMessage:`Availability update via Zanda API — ${result.timestamp}`,
  files:[
    {repoPath:'scripts/test_horizon_integration.ts',localPath:`${base}/scripts/test_horizon_integration.ts`},
    {repoPath:'src/utils/emailBuilder.ts',localPath:`${base}/deploy/src/utils/emailBuilder.ts`},
    {repoPath:'apps/practitioner-availability/utils/emailBuilder.ts',localPath:`${base}/apps/practitioner-availability/utils/emailBuilder.ts`},
    {repoPath:'scripts/availability_horizon.ts',localPath:`${base}/scripts/availability_horizon.ts`},
    {repoPath:'scripts/test_availability_horizon.ts',localPath:`${base}/scripts/test_availability_horizon.ts`},
    {repoPath:'scripts/test_full_refresh.ts',localPath:`${base}/scripts/test_full_refresh.ts`},
    {repoPath:'scripts/validate_availability_refresh.ts',localPath:`${base}/scripts/validate_availability_refresh.ts`},
    {repoPath:'scripts/publish_daily_availability.ts',localPath:`${base}/scripts/publish_daily_availability.ts`},
    {repoPath:'src/availability_horizon.ts',localPath:`${base}/deploy/src/availability_horizon.ts`},
    {repoPath:'src/utils/availabilityHorizon.ts',localPath:`${base}/deploy/src/utils/availabilityHorizon.ts`},
    {repoPath:'src/utils/useAvailabilityPolicy.ts',localPath:`${base}/deploy/src/utils/useAvailabilityPolicy.ts`},
    {repoPath:'apps/practitioner-availability/utils/availabilityHorizon.ts',localPath:`${base}/apps/practitioner-availability/utils/availabilityHorizon.ts`},
    {repoPath:'apps/practitioner-availability/utils/useAvailabilityPolicy.ts',localPath:`${base}/apps/practitioner-availability/utils/useAvailabilityPolicy.ts`},
    {repoPath:'src/App.tsx',localPath:`${base}/deploy/src/App.tsx`},
    {repoPath:'src/FindPractitioner.tsx',localPath:`${base}/deploy/src/FindPractitioner.tsx`},
    {repoPath:'src/Compare.tsx',localPath:`${base}/deploy/src/Compare.tsx`},
    {repoPath:'src/components/SendClientModal.tsx',localPath:`${base}/deploy/src/components/SendClientModal.tsx`},
    {repoPath:'apps/practitioner-availability/components/SendClientModal.tsx',localPath:`${base}/apps/practitioner-availability/components/SendClientModal.tsx`},
    {repoPath:'apps/practitioner-availability/AdHocAvailabilityTab.tsx',localPath:`${base}/apps/practitioner-availability/AdHocAvailabilityTab.tsx`},
    {repoPath:'src/practitioners_data.json',localPath:`${base}/practitioners_data.json`},
    {repoPath:'practitionersData.ts',localPath:`${base}/deploy/src/practitionersData.ts`},
    {repoPath:'practitioners_data.json',localPath:`${base}/deploy/practitioners_data.json`},
    {repoPath:'public/practitioners_data.json',localPath:`${base}/deploy/public/practitioners_data.json`},
    {repoPath:'netlify/functions/practitioners-data.json',localPath:`${base}/deploy/netlify/functions/practitioners-data.json`},
    {repoPath:'src/practitionersData.ts',localPath:`${base}/deploy/src/practitionersData.ts`},
    {repoPath:'bundle.js',localPath:`${base}/deploy/src/bundle.js`},
    {repoPath:'public/bundle.js',localPath:`${base}/deploy/src/bundle.js`},
    {repoPath:'src/bundle.js',localPath:`${base}/deploy/src/bundle.js`},
    {repoPath:'apps/practitioner-availability/app.tsx',localPath:`${base}/apps/practitioner-availability/app.tsx`},
    {repoPath:'apps/practitioner-availability/FindPractitioner.tsx',localPath:`${base}/apps/practitioner-availability/FindPractitioner.tsx`},
    {repoPath:'apps/practitioner-availability/practitionersData.ts',localPath:`${base}/apps/practitioner-availability/practitionersData.ts`},
    {repoPath:'apps/practitioner-availability/bundle.js',localPath:`${base}/apps/practitioner-availability/bundle.js`},
    {repoPath:'scripts/import_availability_api.ts',localPath:`${base}/scripts/import_availability_api.ts`},
    {repoPath:'scripts/krista_availability_override.ts',localPath:`${base}/scripts/krista_availability_override.ts`},
    {repoPath:'scripts/practitioner_intake_pause.ts',localPath:`${base}/scripts/practitioner_intake_pause.ts`},
    {repoPath:'scripts/internal_practitioner_guard.ts',localPath:`${base}/scripts/internal_practitioner_guard.ts`},
    {repoPath:'scripts/internal_practitioners.json',localPath:`${base}/scripts/internal_practitioners.json`},
    {repoPath:'src/internal_practitioner_guard.ts',localPath:`${base}/deploy/src/internal_practitioner_guard.ts`},
    {repoPath:'src/internal_practitioners.json',localPath:`${base}/deploy/src/internal_practitioners.json`},
    {repoPath:'scripts/crm_alerts.ts',localPath:`${base}/scripts/crm_alerts.ts`},
    {repoPath:'scripts/build_send_email.ts',localPath:`${base}/scripts/build_send_email.ts`},
    {repoPath:'scripts/availability_email_review.ts',localPath:`${base}/scripts/availability_email_review.ts`},
    {repoPath:'scripts/test_availability_email_review.ts',localPath:`${base}/scripts/test_availability_email_review.ts`},
    {repoPath:'workflows/daily_availability_import.md',localPath:`${base}/workflows/daily_availability_import.md`},
    {repoPath:'scripts/crm_upcoming_leave.ts',localPath:`${base}/scripts/crm_upcoming_leave.ts`},
    {repoPath:'scripts/crm_leave_approvals.ts',localPath:`${base}/scripts/crm_leave_approvals.ts`},
    {repoPath:'src/crm_leave_approvals.ts',localPath:`${base}/deploy/src/crm_leave_approvals.ts`},
    {repoPath:'src/CRMSyncTab.tsx',localPath:`${base}/deploy/src/CRMSyncTab.tsx`},
    {repoPath:'apps/practitioner-availability/CRMSyncTab.tsx',localPath:`${base}/apps/practitioner-availability/CRMSyncTab.tsx`},
    {repoPath:'src/practitioners_photos.json',localPath:`${base}/deploy/src/practitioners_photos.json`},
    {repoPath:'apps/practitioner-availability/practitioners_photos.json',localPath:`${base}/apps/practitioner-availability/practitioners_photos.json`},
    {repoPath:'scripts/test_internal_practitioner_guard.ts',localPath:`${base}/scripts/test_internal_practitioner_guard.ts`},
    {repoPath:'scripts/apply_crm_sync_2026-11-08.ts',localPath:`${base}/scripts/apply_crm_sync_2026-11-08.ts`},
    {repoPath:'scripts/apply_crm_sync_2026-11-15.ts',localPath:`${base}/scripts/apply_crm_sync_2026-11-15.ts`},
    {repoPath:'src/app.tsx',localPath:`${base}/deploy/src/app.tsx`},
    {repoPath:'zoho_sync_workflow.md',localPath:`${base}/zoho_sync_workflow.md`},
    // Approved replacement connection routing, mirrored sources only.
    {repoPath:'src/import_availability_api.ts',localPath:`${base}/deploy/src/import_availability_api.ts`},
    {repoPath:'src/AdHocAvailabilityTab.tsx',localPath:`${base}/deploy/src/AdHocAvailabilityTab.tsx`},
  ]
}});
if (!r.ok) throw new Error(r.error);
const published=await r.json();
writeFileSync(`${base}/availability_publish_latest.json`,JSON.stringify(published,null,2));
writeFileSync(`${base}/availability_import_latest.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(published));
