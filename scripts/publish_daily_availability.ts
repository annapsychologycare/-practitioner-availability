import { invokeTool } from '@tasklet/tools/v2';
import { readFileSync, writeFileSync } from 'node:fs';
const base = '/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
const result = JSON.parse(readFileSync('/tmp/import_result.json', 'utf8'));
if (!result.ok || !result.totalSlots) throw new Error('Invalid or empty import; refusing to publish');
const before = JSON.parse(readFileSync('/tmp/practitioners_before_import.json', 'utf8'));
const after = JSON.parse(readFileSync(`${base}/practitioners_data.json`, 'utf8'));
const strip = (p:any) => { const {availability, confirmed_slots, locations, alert, client_note, upcoming_leave_client_notice, upcoming_leave_show_from, upcoming_leave_hide_after, ...rest} = p; return {...rest, locations: (locations ?? []).map((l:any)=>{const {availability,...r}=l;return r;})}; };
if (JSON.stringify(before.map(strip)) !== JSON.stringify(after.map(strip))) throw new Error('Unexpected non-availability changes');
const r = await invokeTool({toolName:'github_push_to_branch',connectionId:'conn_nvshm6rz3kzncg0nh4vk',args:{
  owner:'annapsychologycare',repo:'-practitioner-availability',branch:'main',
  commitMessage:`Availability update via Zanda API — ${result.timestamp}`,
  files:[
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
    {repoPath:'scripts/crm_alerts.ts',localPath:`${base}/scripts/crm_alerts.ts`},
    {repoPath:'scripts/crm_upcoming_leave.ts',localPath:`${base}/scripts/crm_upcoming_leave.ts`},
    {repoPath:'scripts/crm_leave_approvals.ts',localPath:`${base}/scripts/crm_leave_approvals.ts`},
    {repoPath:'src/crm_leave_approvals.ts',localPath:`${base}/deploy/src/crm_leave_approvals.ts`},
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
