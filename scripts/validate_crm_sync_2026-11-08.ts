import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mapCrmNotes} from './crm_alerts';
import {mapCrmUpcomingLeave} from './crm_upcoming_leave';
import {APPROVED_LEAVE} from './crm_leave_approvals';
import {suppressKristaIntake} from './practitioner_intake_pause';
import {buildEmailHtml,parseAvailability} from '../apps/practitioner-availability/utils/emailBuilder';
import {activeUpcomingLeave,upcomingLeaveEmailHtml,escapeLeaveHtml} from '../apps/practitioner-availability/utils/upcomingLeave';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/sync_2026-11-08`,backup=`${root}/backups/pre_crm_sync_2026-11-08`;
const read=async(f:string)=>JSON.parse(await readFile(f,'utf8'));
const data=await read(`${root}/practitioners_data.json`),before=await read(`${backup}/practitioners_data.json`),report=await read(`${root}/crm_sync_report_2026-11-08.json`);
let checks=0;const eq=(a:any,b:any)=>{assert.deepEqual(a,b);checks++;};const ok=(x:any)=>{assert(x);checks++;};
eq(data.length,25);eq(report.matched.length,25);eq(report.changes,[]);
for(let i=0;i<data.length;i++)for(const k of Object.keys(data[i]))eq(data[i][k],before[i][k]);
for(const f of ['practitioners_data.json','deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'])eq(await readFile(`${root}/${f}`,'utf8'),await readFile(`${backup}/${f}`,'utf8'));
for(const f of ['apps/practitioner-availability/practitionersData.ts','deploy/src/practitionersData.ts','practitioners_photos.json'])eq(await readFile(`${root}/${f}`,'utf8'),await readFile(`${backup}/${f}`,'utf8'));
eq(data.filter((p:any)=>p.upcoming_leave_client_notice).length,17);
const records=[...(await read(`${dir}/sources/contacts.json`)).data];for(const p of (await read(`${dir}/sources/josh.json`)).data)if(!records.some((q:any)=>q.id===p.id))records.push(p);
for(const m of report.matched){const crm=records.find((c:any)=>c.id===m.id),p=data.find((c:any)=>c.name===m.name);for(const [k,v] of Object.entries(mapCrmNotes(crm)))eq(p[k],v);ok(!Object.hasOwn(crm,'Date_of_Birth'));}
const empty={id:'fixture',Full_Name:'Test',Intake_Alert_Notes_Internal:null,Intake_Alert_Notes:null,Upcoming_leave_client_notice:null,Show_notice_from:null,Hide_notice_after:null};eq(mapCrmNotes(empty),{alert:'',client_note:'',upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''});
for(const [id,a] of Object.entries(APPROVED_LEAVE)){const c={id,Upcoming_leave_client_notice:a.notice,Show_notice_from:a.show,Hide_notice_after:a.hide};eq(mapCrmUpcomingLeave(c).upcoming_leave_client_notice,a.notice);eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:a.notice+' UNAPPROVED'}).upcoming_leave_client_notice,'');eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:''}).upcoming_leave_client_notice,'');}
const now=new Date('2026-11-08T12:00:00Z');
const f={upcoming_leave_client_notice:'<script> & "fixture"\nSeparate period',upcoming_leave_show_from:'2026-11-08',upcoming_leave_hide_after:'2026-11-08'};
eq(activeUpcomingLeave(f,new Date('2026-11-07T12:59:59Z')),'');eq(activeUpcomingLeave(f,new Date('2026-11-07T13:00:00Z')),f.upcoming_leave_client_notice);eq(activeUpcomingLeave(f,new Date('2026-11-08T12:59:59Z')),f.upcoming_leave_client_notice);eq(activeUpcomingLeave(f,new Date('2026-11-08T13:00:00Z')),'');
for(const bad of ['2026-02-30','2026-13-01','not a date'])eq(activeUpcomingLeave({...f,upcoming_leave_hide_after:bad},now),'');eq(activeUpcomingLeave({...f,upcoming_leave_show_from:'2027-01-01'},now),'');eq(activeUpcomingLeave({...f,upcoming_leave_show_from:'',upcoming_leave_hide_after:''},now),f.upcoming_leave_client_notice);
ok(upcomingLeaveEmailHtml(f,now).includes('&lt;script&gt; &amp; &quot;fixture&quot;'));ok(upcomingLeaveEmailHtml(f,now).includes('bgcolor="#FBF7F4"'));ok(upcomingLeaveEmailHtml(f,now).includes('border-left:3px solid #B58AA0'));
const selected=data.filter((p:any)=>['Dr Maddie Brygel','Kiira Gavralas','Poorna Selvaraja','Karen Pereira York'].includes(p.name));eq(selected.length,4);
const html=buildEmailHtml('Preview only','','PsychologyCare Team',selected.map((p:any)=>({...p,availabilityLocations:p.locations,alert:'SECRET STAFF SENTINEL',Leave_Reason:'SECRET REASON',Date_of_Birth:'DOB SENTINEL',practitioner_age:'AGE SENTINEL'})),undefined,false,{},now);
eq((html.match(/data-upcoming-leave="client"/g)||[]).length,4);for(const p of selected){for(const line of p.upcoming_leave_client_notice.split(/\r?\n/))ok(html.includes(escapeLeaveHtml(line)));if(p.client_note)ok(html.includes(p.client_note));}
for(const text of ['SECRET STAFF SENTINEL','SECRET REASON','DOB SENTINEL','AGE SENTINEL','data-staff-age'])ok(!html.includes(text));
const paused=data.find((p:any)=>p.name==='Dr Krista De Castella');eq(paused,suppressKristaIntake(paused));ok(!buildEmailHtml('Preview','','Team',[{...selected[0],name:paused.name,availabilityLocations:selected[0].locations}],undefined,false,{},now).includes('data-upcoming-leave'));
eq(parseAvailability('Monday at 9am (Weekly: Starting 9 Nov)\nTuesday at 10am (Fortnightly: Starting 10 Nov)\nWednesday at 11am (Monthly: Starting 11 Nov)').monthly,[]);
for(const p of data)for(const key of Object.keys(p))ok(!/^(age|dob|date_of_birth|practitioner_age|personal_age)$/i.test(key));
const ts=await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8');ok(ts.includes('6 Nov 2026 6:04am'));
for(const f of ['netlify.toml','src/utils/emailBuilder.ts','apps/practitioner-availability/utils/emailBuilder.ts','src/App.tsx','src/app.tsx','src/FindPractitioner.tsx']){const baseline=await read(`${dir}/sources/github_${f.replaceAll('/','__')}.json`);const local=f.startsWith('apps/')?`${root}/${f}`:`${root}/deploy/${f}`;eq(await readFile(local,'utf8'),baseline.content);}
const stamp=ts.match(/AVAILABILITY_LAST_UPDATED = "([^"]+)"/)?.[1];
await writeFile(`${dir}/email_preview.html`,html);
const result={passed:true,checks,matched:25,changes:report.changes.length,noticeCount:17,timestamp:stamp,canonicalSha256:createHash('sha256').update(await readFile(`${root}/practitioners_data.json`)).digest('hex'),availabilityUnchanged:true,allDataFieldsUnchanged:true,notesAndLeaveMatchFreshCrm:true,noDobFetched:true,noClientPrivacyLeakage:true,netlifyAndEmailSourcesUnchanged:true};
await writeFile(`${dir}/validation.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
