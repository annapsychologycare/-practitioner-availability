import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {applyCrmWorkingHours,WORKING_HOURS_FIELDS} from './crm_working_hours';
import {mapCrmNotes} from './crm_alerts';
import {assertInternalAppMembership,isInternalPractitioner} from './internal_practitioner_guard';
import approved from './internal_practitioners.json';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/crm-refresh-2026-11-24-1801`,load=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const report=await load(`${dir}/reconciliation.json`),before=await load(`${report.backupDirectory}/practitioners_data.json`),data=await load(`${root}/practitioners_data.json`),records=(await load(`${dir}/contacts.json`)).result.data;
let checks=0;const same=(a:any,b:any,msg='')=>{assert.deepEqual(a,b,msg);checks++;};
assertInternalAppMembership(data);same(records.length,24);assert(records.every(isInternalPractitioner));
const expected=structuredClone(before),coverage=applyCrmWorkingHours(expected,records);
same(coverage.filter((h:any)=>h.status==='crm_authoritative').length,22);same(coverage.filter((h:any)=>h.status==='paused').length,1);same(coverage.filter((h:any)=>h.status==='held_blank').map((h:any)=>h.name),['Meg Edelman']);
same(report.changes.length,20);assert(report.changes.every((c:any)=>c.field==='working_hours'));
for(const p of data){const old=before.find((q:any)=>q.name===p.name),c=records.find((c:any)=>c.id===approved.find(a=>a.name===p.name)?.id);for(const k of new Set([...Object.keys(old),...Object.keys(p)]))same(p[k],k==='working_hours'?expected.find((q:any)=>q.name===p.name)[k]:old[k],`${p.name}/${k}`);for(const [k,v] of Object.entries(mapCrmNotes(c)))same(p[k],v,`${p.name}/${k}`);}
same(data.filter((p:any)=>p.upcoming_leave_client_notice).length,16);
for(const name of ['Brigid Blanckenberg','Dr Christine Deftereos'])same(data.find((p:any)=>p.name===name).upcoming_leave_client_notice,'');
for(const f of ['deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'])same(await load(`${root}/${f}`),data,f);
const ts=await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),oldTs=await readFile(`${report.backupDirectory}/apps/practitioner-availability/practitionersData.ts`,'utf8');
for(const re of [/export const AVAILABILITY_LAST_UPDATED = [^;]+;/,/export const AVAILABILITY_IMPORT_WINDOW = [^;]+;/])same(ts.match(re)?.[0],oldTs.match(re)?.[0]);
for(const f of ['deploy/src/practitionersData.ts','practitionersData.ts','deploy/practitionersData.ts'])same(await readFile(`${root}/${f}`,'utf8'),ts);
const metadata=(await load(`${dir}/metadata.json`)).result.fields,prior=(await load(`${root}/crm-hours-2026-11-24/metadata.json`)).result.fields;
const candidates=metadata.filter((f:any)=>/working.*(day|hour)|\bhours?\b|availability|schedule/i.test(f.field_label+' '+f.api_name)).map((f:any)=>({label:f.field_label,api:f.api_name,type:f.data_type}));
for(const f of metadata){const old=prior.find((p:any)=>p.id===f.id);if(old){same(f.api_name,old.api_name);same(f.data_type,old.data_type);}}
const mappings=WORKING_HOURS_FIELDS.map(([api,location])=>({api,location,label:metadata.find((f:any)=>f.api_name===api)?.field_label,populated:records.filter((c:any)=>c[api]?.trim()).length}));
await writeFile(`${dir}/hours-coverage.json`,JSON.stringify(coverage,null,2));
await writeFile(`${dir}/metadata-hours-candidates.json`,JSON.stringify({mappings,candidates,unresolved:coverage.filter((h:any)=>h.status==='held_blank')},null,2));
await writeFile(`${dir}/validation.json`,JSON.stringify({checks,profiles:24,changes:20,crmHoursPopulated:23,applied:22,paused:1,unresolved:['Meg Edelman'],notices:16,timestamp:report.preserved.availabilityLastUpdated,mappings,candidates},null,2));
console.log({checks,mappings,candidates,held:coverage.filter((h:any)=>h.status==='held_blank')});
