import {refreshCrmAlerts} from './crm_alerts';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/confirmed_sheet`;
const read=async(f:string)=>JSON.parse(await readFile(f,'utf8'));
const plan=await read(`${dir}/applied_audit.json`),before=await read(`${root}/practitioners_data.json`),after=structuredClone(before);
await writeFile(`${dir}/app_before.json`,JSON.stringify(before,null,2));
await refreshCrmAlerts(after);
const observed=after.flatMap((p:any,i:number)=>Object.keys(p).filter(k=>JSON.stringify(p[k])!==JSON.stringify(before[i][k])).map(field=>({name:p.name,field,before:before[i][field],after:p[field]})));
await writeFile(`${dir}/observed_crm_deltas.json`,JSON.stringify(observed,null,2));
const keys=['upcoming_leave_client_notice','upcoming_leave_show_from','upcoming_leave_hide_after'];
// This targeted task explicitly authorizes only the confirmed sheet subset.
// A concurrent CRM-only notice on an unconfirmed row is held, never overwritten
// in CRM, and reported for parent review before the next unrestricted sync.
const held=observed.filter((c:any)=>!plan.some((p:any)=>p.appName===c.name));
for(let i=0;i<after.length;i++)if(!plan.some((p:any)=>p.appName===after[i].name))for(const key of keys)after[i][key]=before[i][key];
await writeFile(`${dir}/held_unconfirmed_crm_deltas.json`,JSON.stringify(held,null,2));
const changed=after.filter((p:any,i:number)=>JSON.stringify(p)!==JSON.stringify(before[i])).map((p:any)=>p.name);assert.equal(changed.length,3);
for(let i=0;i<before.length;i++){for(const key of Object.keys(before[i]))if(!keys.includes(key))assert.deepEqual(after[i][key],before[i][key],`${before[i].name}.${key}`);const expected=plan.find((p:any)=>p.appName===before[i].name);if(!expected)assert.deepEqual(after[i],before[i]);else {assert.equal(after[i].upcoming_leave_client_notice,expected.update.Upcoming_leave_client_notice);assert.equal(after[i].upcoming_leave_show_from,expected.update.Show_notice_from);assert.equal(after[i].upcoming_leave_hide_after,expected.update.Hide_notice_after);}}
for(const f of ['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json']){assert.deepEqual(await read(`${root}/${f}`),before);await writeFile(`${root}/${f}`,JSON.stringify(after,null,2));}
const ts=await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),stamp=ts.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)![1],photos=await read(`${root}/practitioners_photos.json`);
const generated=`export const PRACTITIONERS_DATA = ${JSON.stringify(after.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null})),null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;
for(const f of ['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'])await writeFile(`${root}/${f}`,generated);
await writeFile(`${dir}/app_sync_result.json`,JSON.stringify({matched:after.length,changed,fieldChanges:9,availabilityLastUpdated:stamp,protectedDataUnchanged:true},null,2));console.log(JSON.stringify({changed,stamp}));
