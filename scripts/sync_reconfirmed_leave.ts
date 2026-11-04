import {refreshCrmAlerts} from './crm_alerts';
import {APPROVED_LEAVE} from './crm_leave_approvals';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/reconfirmed`;
const read=async(f:string)=>JSON.parse(await readFile(f,'utf8'));
const before=await read(`${dir}/app_before.json`),after=structuredClone(before),plan=await read(`${dir}/plan.json`);
await refreshCrmAlerts(after);
const keys=['upcoming_leave_client_notice','upcoming_leave_show_from','upcoming_leave_hide_after'];
const changes=after.flatMap((p:any,i:number)=>Object.keys(p).filter(k=>JSON.stringify(p[k])!==JSON.stringify(before[i][k])).map(field=>({name:p.name,field,before:before[i][field],after:p[field]})));
for(let i=0;i<before.length;i++)for(const k of Object.keys(before[i]))if(!keys.includes(k))assert.deepEqual(after[i][k],before[i][k],`${before[i].name}.${k}`);
assert.equal(changes.length,21);assert.equal(new Set(changes.map((c:any)=>c.name)).size,7);
for(const p of after){const a=Object.values(APPROVED_LEAVE).find(a=>a.name===p.name);if(a){assert.equal(p.upcoming_leave_client_notice,a.notice);assert.equal(p.upcoming_leave_show_from,a.show);assert.equal(p.upcoming_leave_hide_after,a.hide);}else assert(!p.upcoming_leave_client_notice,`Unconfirmed published ${p.name}`);}
for(const f of ['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json']){assert.deepEqual(await read(`${root}/${f}`),before);await writeFile(`${root}/${f}`,JSON.stringify(after,null,2));}
const ts=await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),stamp=ts.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)![1],photos=await read(`${root}/practitioners_photos.json`);
const generated=`export const PRACTITIONERS_DATA = ${JSON.stringify(after.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null})),null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;
for(const f of ['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'])await writeFile(`${root}/${f}`,generated);
await copyFile(`${root}/scripts/crm_upcoming_leave.ts`,`${root}/deploy/src/crm_upcoming_leave.ts`);
await writeFile(`${dir}/app_sync_result.json`,JSON.stringify({matched:after.length,changedPractitioners:7,fieldChanges:changes,confirmedTotal:plan.selected,availabilityLastUpdated:stamp,protectedDataUnchanged:true},null,2));console.log(JSON.stringify({matched:after.length,changed:7,fields:changes.length,confirmed:plan.selected,stamp}));
