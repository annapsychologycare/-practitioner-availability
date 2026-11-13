import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {APPROVED_LEAVE} from './crm_leave_approvals';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/alex_leave_targeted`;
const read=async(f:string)=>JSON.parse(await readFile(`${root}/${f}`,'utf8'));
const before=await read('alex_leave_targeted/data_before.json'),crm=await read('alex_leave_targeted/crm_client_fields.json');
assert.equal(Object.keys(APPROVED_LEAVE).length,17);assert(!APPROVED_LEAVE[crm.id]);
assert(crm.Upcoming_leave_client_notice?.trim());
for(const k of ['Show_notice_from','Hide_notice_after'])assert(/^\d{4}-\d{2}-\d{2}$/.test(crm[k]));
assert(crm.Show_notice_from<=crm.Hide_notice_after);
const updated={...APPROVED_LEAVE,[crm.id]:{name:'Alex Barry',sheetRow:0,notice:crm.Upcoming_leave_client_notice.trim(),show:crm.Show_notice_from,hide:crm.Hide_notice_after}};
const approval=`// Exact approved client-field signatures. Sheet-confirmed baseline 4 November 2026.\n// Poorna and Alex updated/added by explicit Anna targeted CRM-pull authorization.\n// sheetRow 0 means explicit user approval, not a spreadsheet row. Ordinary CRM edits remain fail-closed.\nexport const APPROVED_LEAVE: Record<string,{name:string;sheetRow:number;notice:string;show:string;hide:string}> = ${JSON.stringify(updated,null,2)};\n`;
for(const f of ['scripts/crm_leave_approvals.ts','deploy/src/crm_leave_approvals.ts'])await writeFile(`${root}/${f}`,approval);
// Separate process tests load the refreshed signature; do not rely on module cache here.
const after=structuredClone(before),matches=after.filter((p:any)=>p.name==='Alex Barry');assert.equal(matches.length,1);
Object.assign(matches[0],{upcoming_leave_client_notice:crm.Upcoming_leave_client_notice.trim(),upcoming_leave_show_from:crm.Show_notice_from,upcoming_leave_hide_after:crm.Hide_notice_after});
const changes=after.flatMap((p:any,i:number)=>Object.keys(p).filter(k=>JSON.stringify(p[k])!==JSON.stringify(before[i][k])).map(field=>({name:p.name,field,before:before[i][field],after:p[field]})));
assert.equal(changes.length,3);assert(changes.every((c:any)=>c.name==='Alex Barry'&&c.field.startsWith('upcoming_leave_')));
for(const f of ['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json']){assert.deepEqual(await read(f),before);await writeFile(`${root}/${f}`,JSON.stringify(after,null,2));}
const files=['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'];
const ts=await readFile(`${root}/${files[0]}`,'utf8'),stamp=ts.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)![1],photos=await read('practitioners_photos.json');
const withPhotos=(d:any[])=>d.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null}));
const expected=`export const PRACTITIONERS_DATA = ${JSON.stringify(withPhotos(before),null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;
assert.equal(ts,expected);assert.equal(await readFile(`${root}/${files[1]}`,'utf8'),ts);
for(const f of files)await writeFile(`${root}/${f}`,expected.replace(JSON.stringify(withPhotos(before),null,2),JSON.stringify(withPhotos(after),null,2)));
await writeFile(`${dir}/changes.json`,JSON.stringify({changes,stamp,notices:after.filter((p:any)=>p.upcoming_leave_client_notice).length},null,2));
console.log(JSON.stringify({changes,stamp}));
