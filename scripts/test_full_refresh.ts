import {availabilityHorizon} from './availability_horizon';
import {assertAvailabilityLocations} from './availability_profile_guard';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {PRACTITIONERS_DATA,AVAILABILITY_LAST_UPDATED} from '../apps/practitioner-availability/practitionersData';
import {applyKristaAvailabilityOverride} from './krista_availability_override';
import {mapCrmNotes} from './crm_alerts';
import {fetchInternalPractitioners} from './internal_practitioner_guard';
import {applyCrmWorkingHours} from './crm_working_hours';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const b='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
const before=JSON.parse(readFileSync('/tmp/practitioners_before_import.json','utf8'));
const after=JSON.parse(readFileSync(`${b}/practitioners_data.json`,'utf8'));
const result=JSON.parse(readFileSync('/tmp/import_result.json','utf8'));
const raw=JSON.parse(readFileSync(`${b}/availability_raw_latest.json`,'utf8'));
assertAvailabilityLocations(before,after,result.slots);
const strip=(p:any)=>{const {working_hours,availability,confirmed_slots,locations,alert,client_note,upcoming_leave_client_notice,upcoming_leave_show_from,upcoming_leave_hide_after,...rest}=p;return rest;};
assert.deepEqual(after.map(strip),before.map(strip),'Unrelated profiles changed');
const expected=structuredClone(before);applyCrmWorkingHours(expected,await fetchInternalPractitioners());
for(const p of after)assert.equal(p.working_hours,expected.find((q:any)=>q.name===p.name)?.working_hours,`${p.name}: CRM hours authority`);
const melbourneToday=new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Melbourne'});
const dateOffset=(n:number)=>{const d=new Date(melbourneToday+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
assert.equal(result.dateRange.from,dateOffset(1)+'T00:00:00');assert.equal(result.dateRange.to,dateOffset(availabilityHorizon().days)+'T23:59:59');
assert(raw.appointments.every((a:any)=>a.date.slice(0,10)>=dateOffset(1)&&a.date.slice(0,10)<=dateOffset(availabilityHorizon().days)));
let count=0;
for(const p of after){
 const lines=(p.locations??[]).flatMap((l:any)=>{assert.equal(typeof l.availability,'string');return l.availability?l.availability.split('\n').map((s:string)=>`${s} — ${l.location??l.name}`):[];});assert.deepEqual([...p.availability].sort(),lines.sort());count+=lines.length;
}
assert.equal(count,result.totalSlots);
for(const file of ['deploy/src/practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/netlify/functions/practitioners-data.json']){
 const copy=JSON.parse(readFileSync(`${b}/${file}`,'utf8'));
 for(const p of after){const q=copy.find((x:any)=>x.name===p.name);assert.deepEqual(q.availability,p.availability);assert.equal(q.alert,p.alert);assert.equal(q.client_note,p.client_note);for(const l of p.locations??[])assert.equal(q.locations.find((x:any)=>(x.location??x.name)===(l.location??l.name)).availability,l.availability);}
}
assert.equal(readFileSync(`${b}/apps/practitioner-availability/practitionersData.ts`,'utf8'),readFileSync(`${b}/deploy/src/practitionersData.ts`,'utf8'));
const photos=JSON.parse(readFileSync(`${b}/practitioners_photos.json`,'utf8'));
for(const p of PRACTITIONERS_DATA){const q=after.find((x:any)=>x.name===p.name);assert.deepEqual(p,{...q,photo_b64:photos[p.name]??q.photo_b64??null});}
const krista=after.find((p:any)=>p.name==='Dr Krista De Castella');assert.deepEqual(krista.availability,[]);assert.equal(krista.alert,'');assert.equal(krista.client_note,'');assert.deepEqual(applyKristaAvailabilityOverride([structuredClone(krista)],'2026-10-20'),[]);assert.deepEqual(mapCrmNotes({Full_Name:krista.name,Intake_Alert_Notes:'test',Intake_Alert_Notes_Internal:'test',Upcoming_leave_client_notice:null,Show_notice_from:null,Hide_notice_after:null}),{alert:'',client_note:'',upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''});
const josh=after.find((p:any)=>p.name==='Joshua Kugel');assert.equal(josh.client_note,before.find((p:any)=>p.name===josh.name).client_note);
for(const p of after){const html=buildEmailHtml('Test','','Anna',[{...p,availabilityLocations:p.locations,alert:'PRIVATE_INTERNAL_SENTINEL'}]);assert(!html.includes('PRIVATE_INTERNAL_SENTINEL'));}
const counts=Object.fromEntries(['Weekly','Fortnightly','Monthly'].map(f=>[f,result.slots.filter((s:string)=>s.includes(`(${f}:`)).length]));
const report={ok:true,totalSlots:count,practitioners:result.matched.length,dateRange:result.dateRange,frequencyCounts:counts,unmatched:result.unmatched,timestamp:AVAILABILITY_LAST_UPDATED,brigid:after.filter((p:any)=>p.name.includes('Brigid')).map((p:any)=>({name:p.name,slots:p.availability.length})),checks:['Profiles unchanged','Tomorrow-to-policy-horizon dates','All JSON availability/notes synchronized','TS consumers/photos preserved','Krista pause survives import and CRM','Josh hours and client note preserved']};
writeFileSync(`${b}/availability_refresh_verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
