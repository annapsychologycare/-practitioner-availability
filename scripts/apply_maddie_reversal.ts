import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {mapCrmNotes} from './crm_alerts';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/maddie_january_reversal`;
const c=JSON.parse(await readFile(`${dir}/crm_fields.json`,'utf8')),notes=mapCrmNotes(c);
assert.equal(notes.alert,'');assert.equal(notes.client_note,'');
const files=['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'];
const tsFiles=['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'];
const helpers=['scripts/apply_crm_sync_2026-11-08.ts','scripts/apply_crm_sync_2026-11-15.ts'];
for(const f of [...files,...tsFiles,...helpers,'apps/practitioner-availability/bundle.js','deploy/src/bundle.js']){await mkdir(path.dirname(`${dir}/before/${f}`),{recursive:true});await copyFile(`${root}/${f}`,`${dir}/before/${f}`);}
let checks=0;const deltas=[];
for(const f of files){const data=JSON.parse(await readFile(`${root}/${f}`,'utf8')),old=structuredClone(data),p=data.find((p:any)=>p.name==='Dr Maddie Brygel');
for(const [k,v]of Object.entries(notes)){if(p[k]!==v)deltas.push({file:f,name:p.name,field:k,old:p[k],new:v});p[k]=v;}
for(let i=0;i<data.length;i++)for(const k of Object.keys(data[i])){if(data[i].name==='Dr Maddie Brygel'&&k==='client_note')continue;assert.deepEqual(data[i][k],old[i][k],`${f}:${data[i].name}:${k}`);checks++;}
assert.equal(p.working_hours,'Mondays, Tuesdays, Thursdays and Fridays, 8am to 2pm — Prahran or Telehealth.');assert.equal(data.filter((p:any)=>p.upcoming_leave_client_notice).length,18);await writeFile(`${root}/${f}`,JSON.stringify(data,null,2));}
const data=JSON.parse(await readFile(`${root}/${files[0]}`,'utf8')),prior=await readFile(`${root}/${tsFiles[0]}`,'utf8'),stamp=prior.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)?.[1];assert(stamp);
const photos=JSON.parse(await readFile(`${root}/practitioners_photos.json`,'utf8'));
const generated=`export const PRACTITIONERS_DATA = ${JSON.stringify(data.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null})),null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;for(const f of tsFiles)await writeFile(`${root}/${f}`,generated);
for(const f of helpers){const s=await readFile(`${root}/${f}`,'utf8');assert(s.includes("assert(maddie.client_note.includes('11 January 2027'));"));await writeFile(`${root}/${f}`,s.replace("assert(maddie.client_note.includes('11 January 2027'));","// Anna reversed the January move: CRM notes remain authoritative, including blank clearing.\nassert.equal(maddie.client_note, mapCrmNotes(records.find((c:any)=>c.id==='50438000008264032')).client_note);"));}
const p=data.find((p:any)=>p.name==='Dr Maddie Brygel');const html=buildEmailHtml('Preview only','','Anna',[{...p,alert:'STAFF-PRIVATE-SENTINEL',availabilityLocations:p.locations}]);assert(!html.includes('STAFF-PRIVATE'));assert(!html.includes('11 January 2027'));assert(!html.includes('will move to Camberwell'));assert(html.includes(p.upcoming_leave_client_notice));assert(html.includes(p.working_hours));await writeFile(`${dir}/email_preview.html`,html);
assert(deltas.every(x=>x.name===p.name&&x.field==='client_note'));assert.equal(deltas.length,5);
await writeFile(`${dir}/validation.json`,JSON.stringify({checks,deltas,stamp,leaveNotices:18,hours:p.working_hours,noSlotsChanged:true,internalNotesBlank:true,clientNotesBlank:true},null,2));console.log({checks,changedCanonicalFields:1,stamp,leaveNotices:18});
