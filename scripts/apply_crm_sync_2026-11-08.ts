import {isInternalPractitioner,assertInternalAppMembership} from './internal_practitioner_guard';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {mapCrmNotes} from './crm_alerts';
import {LEAVE_CRM_FIELDS} from './crm_upcoming_leave';
import {applyIntakePauses,suppressKristaIntake} from './practitioner_intake_pause';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/sync_2026-11-08`,backup=`${root}/backups/pre_crm_sync_2026-11-08`;
const load=async(f:string)=>JSON.parse(await readFile(f,'utf8')),unwrap=(x:any)=>x.result??x;
const norm=(s:string)=>s.toLowerCase().replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/^nicholas burden$/,'nick burden').replace(/^pete steele$/,'peter steele');
const contacts=unwrap(await load(`${dir}/sources/contacts.json`)),feeResult=unwrap(await load(`${dir}/sources/fees.json`));assert(!contacts.info.more_records&&!feeResult.info.more_records);
const records=contacts.data.filter(isInternalPractitioner);
for(const j of unwrap(await load(`${dir}/sources/josh.json`)).data)if(isInternalPractitioner(j)&&!records.some((x:any)=>x.id===j.id))records.push(j);
const priorSource=unwrap(await load(`${root}/sync_2026-11-04/sources/contacts.json`));
const priorRecords=priorSource.data;
for(const j of unwrap(await load(`${root}/sync_2026-11-04/sources/josh.json`)).data)if(!priorRecords.some((x:any)=>x.id===j.id))priorRecords.push(j);
const jsonFiles=['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'];
const tsFiles=['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts'];
for(const f of [...jsonFiles,...tsFiles,'apps/practitioner-availability/bundle.js','deploy/src/bundle.js','practitioners_photos.json']){await mkdir(path.dirname(`${backup}/${f}`),{recursive:true});await copyFile(`${root}/${f}`,`${backup}/${f}`,2);}
const data=await load(`${root}/practitioners_data.json`),before=structuredClone(data);assertInternalAppMembership(data);assert.equal(data.length,25);
const changes:any[]=[],matched:any[]=[],warnings:any[]=[],review:any[]=[],feeChecks:any[]=[];
const apply=(p:any,field:string,value:any,source:string)=>{assert(Object.hasOwn(p,field),`Missing actual app field ${field}`);if(JSON.stringify(p[field])!==JSON.stringify(value)){changes.push({name:p.name,field,old:p[field],new:value,source});p[field]=structuredClone(value);}};
// Full reconciliation of verified fields. Preserve approved bios/service scope and existing field representation.
const mappings:any={Education:{field:'qualifications',convert:(v:any)=>typeof v==='string'?v.trim():''},Religions_Groups_I_have_a_strong_understanding:{field:'religions_groups',convert:(v:any)=>(v??[]).join(', ')},Clinical_Interests:{field:'presentations',convert:(v:any)=>v},Modalities:{field:'modalities',convert:(v:any)=>(v??[]).map((m:string)=>m==='EMDR (Eye Movement Desensitisation and Reprocessing)'?'Eye Movement Desensitisation and Reprocessing (EMDR)':m)},Bio:{field:'bio',convert:(v:any)=>v?.trim()},Short_Bio:{field:'short_bio',convert:(v:any)=>v?.trim()},Pronouns:{field:'pronouns',convert:(v:any)=>v?.trim()},Client_Types:{field:'client_types',convert:(v:any)=>v},Ages:{field:'age_range',convert:(v:any)=>v},Languages_I_am_fluent_in:{field:'languages',convert:(v:any)=>v?.trim()},Style_of_Therapy:{field:'style',convert:(v:any)=>(v??[]).filter((s:string)=>!['female','male','non binary','transgender','agender'].includes(s.toLowerCase())).join(', ')}};
for(const p of data){
 const found=records.filter((c:any)=>norm(c.Full_Name)===norm(p.name));assert.equal(found.length,1,`Unique CRM match required ${p.name}`);const c=found[0],prior=priorRecords.find((x:any)=>x.id===c.id);assert(prior);matched.push({name:p.name,crmName:c.Full_Name,id:c.id});
 for(const [source,mapping] of Object.entries(mappings) as any){
  if(p.name==='Nicholas Kleeman'&&source==='Short_Bio'){if(c[source]?.trim()!==p.short_bio)warnings.push({name:p.name,field:'short_bio',action:'Preserved approved app bio'});continue;}
  if(p.name==='Dr Krista De Castella'&&['Clinical_Interests','Modalities'].includes(source)){warnings.push({name:p.name,source,action:'Preserved approved service scope pending review'});continue;}
  let next=mapping.convert(c[source]);if(source==='Languages_I_am_fluent_in'&&Array.isArray(p.languages)&&typeof next==='string')next=next.split(/[,;]/).map((x:string)=>x.trim()).filter(Boolean);if(next==null||next===''||(Array.isArray(next)&&!next.length)){review.push({name:p.name,source,action:'Blank non-note profile value preserved pending review'});continue;}apply(p,mapping.field,next,`Contacts.${source}`);
 }
 // Verified actual classification fields: existing title contains all CRM Modality labels;
 // therapist_type contains its first label. Never change Alex's approved exception.
 if(JSON.stringify(c.Modality)!==JSON.stringify(prior.Modality)){
  if(p.name==='Alex Barry')warnings.push({name:p.name,action:'Approved classification exception preserved'});
  else {assert(Array.isArray(c.Modality)&&c.Modality.length);apply(p,'title',c.Modality.join(', '),'Contacts.Modality');apply(p,'therapist_type',c.Modality[0],'Contacts.Modality[0]');}
 }
 // Synchronize only existing exact-equivalent aliases when their canonical field changed.
 for(const [actual,alias] of [['short_bio','shortBio'],['therapist_type','therapistType'],['age_range','ageGroups'],['client_types','clientTypes']]){
  if(Object.hasOwn(p,alias)&&changes.some(x=>x.name===p.name&&x.field===actual)){
   const previous=before.find((x:any)=>x.name===p.name);assert(JSON.stringify(previous[alias])===JSON.stringify(previous[actual])||JSON.stringify(previous[alias])===JSON.stringify(p[actual]),`Non-equivalent alias ${p.name}.${alias}`);apply(p,alias,p[actual],`Existing alias of ${actual}`);
  }
 }
 // Separate fields are authoritative, including blank clears, with the explicit Krista suppression.
 const notes=mapCrmNotes(c);for(const [field,value] of Object.entries(notes))apply(p,field,value,`Contacts.${field==='alert'?'Intake_Alert_Notes_Internal':field==='client_note'?'Intake_Alert_Notes':LEAVE_CRM_FIELDS[field as keyof typeof LEAVE_CRM_FIELDS]}`);
 const fee=feeResult.data.find((x:any)=>x.id===c.Fee_Schedule?.id);assert(fee&&fee.Active,`Fee schedule ${p.name}`);
 const proposed=`B/H: $${fee.Business_Hours_Fee}\nA/H: $${fee.After_Hours_Fee}${fee.Fee_Notes?'\n'+fee.Fee_Notes.trim():''}`;
 const feeChanged=p.fees!==proposed||p.medicare_rebate!==String(fee.Medicare_Rebate);
 apply(p,'fees',proposed,'Fee_Schedules');apply(p,'medicare_rebate',String(fee.Medicare_Rebate),'Fee_Schedules.Medicare_Rebate');
 if(p.name==='Dr Krista De Castella'){assert.equal(fee.id,'50438000014686005');assert.equal(fee.Business_Hours_Fee,275);assert.equal(fee.After_Hours_Fee,315);assert(fee.Fee_Notes.includes('$345'));warnings.push({name:p.name,fields:['presentations','modalities'],action:'Preserved prior approved values; unresolved CRM psychedelic service-scope conflict. Intake remains paused.'});}
 feeChecks.push({name:p.name,scheduleId:fee.id,changed:feeChanged});
 if(p.name==='Kiira Gavralas'&&p.client_note.includes('Chiara'))warnings.push({name:p.name,field:'client_note',action:'Preserved authoritative CRM verbatim; existing wrong-name wording needs review.'});
}
applyIntakePauses(data);
assert(changes.every(c=>[...Object.values(mappings).map((m:any)=>m.field),'shortBio','title','therapist_type','therapistType','ageGroups','clientTypes','alert','client_note',...Object.keys(LEAVE_CRM_FIELDS),'fees','medicare_rebate'].includes(c.field)), 'Only established mapped fields allowed');
for(const p of before){const q=data.find((x:any)=>x.name===p.name);for(const field of Object.keys(p))if(!changes.some(c=>c.name===p.name&&c.field===field))assert.deepEqual(q[field],p[field],`${p.name}:${field}`);for(const l of q.locations)assert.equal(typeof l.availability,'string');}
const consumerChanges=[];
for(const f of jsonFiles){const rows=await load(`${root}/${f}`),deltas=[];assert.equal(rows.length,25);for(const change of changes){const p=rows.find((x:any)=>x.name===change.name);assert(p&&Object.hasOwn(p,change.field));if(JSON.stringify(p[change.field])!==JSON.stringify(change.new)){deltas.push({...change,old:p[change.field]});p[change.field]=structuredClone(change.new);}}await writeFile(`${root}/${f}`,JSON.stringify(rows,null,2));consumerChanges.push({file:f,changes:deltas});}
const ts=await readFile(`${backup}/${tsFiles[0]}`,'utf8'),stamp=ts.match(/export const AVAILABILITY_LAST_UPDATED = "([^"]+)";/)?.[1];assert(stamp);const photos=await load(`${root}/practitioners_photos.json`);assert.equal(Object.keys(photos).length,25);
const withPhotos=data.map((p:any)=>({...p,photo_b64:photos[p.name]??p.photo_b64??null}));assert(withPhotos.every((p:any)=>p.photo_b64));
const generated=`export const PRACTITIONERS_DATA = ${JSON.stringify(withPhotos,null,2)};\nexport const practitionersData = PRACTITIONERS_DATA;\nexport const AVAILABILITY_LAST_UPDATED = "${stamp}";\n`;for(const f of tsFiles)await writeFile(`${root}/${f}`,generated);
const krista=data.find((p:any)=>p.name==='Dr Krista De Castella');assert.deepEqual(krista,suppressKristaIntake(krista));
const maddie=data.find((p:any)=>p.name==='Dr Maddie Brygel');assert(maddie.client_note.includes('11 January 2027'));assert.equal(maddie.working_hours,before.find((p:any)=>p.name===maddie.name).working_hours);
const ignoredContacts=records.filter((c:any)=>!matched.some(x=>x.id===c.id)).map((c:any)=>({name:c.Full_Name,id:c.id,action:'Not an existing app practitioner; not added'}));
const report={date:'2026-11-08',trigger:'Scheduled Sunday 8 Nov 2026 23:00 Melbourne weekly CRM-only sync',status:'Local sync complete; build/publish pending',matched,noMatches:[],changes,unchanged:data.filter((p:any)=>!changes.some(c=>c.name===p.name)).map((p:any)=>p.name),warnings,review,ignoredContacts,consumerChanges,feeChecks,sourceCounts:{accountContacts:contacts.info.count,joshDirect:true,feeSchedules:feeResult.data.length,complete:true},preserved:{availabilityLastUpdated:stamp,availabilityRefetched:false,photos:25,membership:25,appManagedHours:true,alexClassificationException:true,kristaPause:true,maddieClientNotice:true,clientAge60PlusAndConditionalPrahranStairs:'App code untouched; regression checks pending'},backupDirectory:backup};
await writeFile(`${root}/crm_sync_report_2026-11-08.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({changes:changes.map(x=>({name:x.name,field:x.field,new:x.new})),stamp,matched:matched.length,ignoredContacts,warnings},null,2));
