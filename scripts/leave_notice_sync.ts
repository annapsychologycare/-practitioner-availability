// Targeted shared CRM note/leave refresh. Does NOT fetch Zanda or change fees/hours.
// Weekly full CRM sync maps mapCrmNotes; daily Zanda import refreshes the same helper.
import {refreshCrmAlerts} from './crm_alerts';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {invokeTool} from '@tasklet/tools/v2';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04`;
export const codePaths=['types.ts','CRMSyncTab.tsx','ManageAvailability.tsx','components/PractitionerNotes.tsx','components/UpcomingLeave.tsx','components/SendClientModal.tsx','utils/upcomingLeave.ts','utils/useNoticeClock.ts','utils/emailBuilder.ts','utils/practitionerIntakePause.ts'];
const files=['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'];
const tsFiles=['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'];
await mkdir(`${dir}/before`,{recursive:true});
for(const f of [...files,...tsFiles,'practitioners_photos.json']) {await mkdir(`${dir}/before/${f.substring(0,f.lastIndexOf('/'))}`,{recursive:true});await copyFile(`${root}/${f}`,`${dir}/before/${f}`,2);}
const before=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8')),after=structuredClone(before);
assert.equal(before.length,25);
const changed=await refreshCrmAlerts(after);
const allowed=['alert','client_note','upcoming_leave_client_notice','upcoming_leave_show_from','upcoming_leave_hide_after'];
for(const [i,p] of after.entries())for(const key of Object.keys(before[i]))if(!allowed.includes(key))assert.deepEqual(p[key],before[i][key],`Protected field ${p.name}.${key}`);
// CRM schema was just added; do not invent notice text or dates.
assert(after.every((p:any)=>!p.upcoming_leave_client_notice&&!p.upcoming_leave_show_from&&!p.upcoming_leave_hide_after));
for(const f of files){const rows=JSON.parse(await readFile(`${root}/${f}`,'utf8'));assert.deepEqual(rows,before,`Consumer baseline ${f}`);await writeFile(`${root}/${f}`,JSON.stringify(after,null,2));}
const originalTs=await readFile(`${root}/${tsFiles[0]}`,'utf8'),stamp=originalTs.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)![1];
const photos=JSON.parse(await readFile(`${root}/practitioners_photos.json`,'utf8'));
const generated=`export const PRACTITIONERS_DATA = ${JSON.stringify(after.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null})),null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;
for(const f of tsFiles)await writeFile(`${root}/${f}`,generated);
for(const f of codePaths)await copyFile(`${root}/apps/practitioner-availability/${f}`,`${root}/deploy/src/${f}`);
await copyFile(`${root}/scripts/crm_upcoming_leave.ts`,`${root}/deploy/src/crm_upcoming_leave.ts`);
const repoPaths=[...codePaths.map(f=>`src/${f}`),...codePaths.map(f=>`apps/practitioner-availability/${f}`),'src/practitioners_data.json','practitioners_data.json','public/practitioners_data.json','netlify/functions/practitioners-data.json','src/practitionersData.ts','practitionersData.ts','apps/practitioner-availability/practitionersData.ts','netlify.toml'];
await mkdir(`${dir}/remote`,{recursive:true});
await Promise.all(repoPaths.map(async(repoPath)=>{const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_get_file_content',args:{owner:'annapsychologycare',repo:'-practitioner-availability',ref:'main',repoPath}});await writeFile(`${dir}/remote/${repoPath.replaceAll('/','__')}.json`,JSON.stringify(r.ok?await r.json():{error:r.error}));}));
await writeFile(`${dir}/sync_result.json`,JSON.stringify({changed,practitioners:after.length,fieldsAdded:3,availabilityLastUpdated:stamp,noLiveNotices:true,codePaths},null,2));
console.log(JSON.stringify({changed,practitioners:after.length,stamp}));
