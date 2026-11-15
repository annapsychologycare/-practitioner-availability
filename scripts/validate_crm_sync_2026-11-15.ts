import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mapCrmNotes} from './crm_alerts';
import {mapCrmUpcomingLeave} from './crm_upcoming_leave';
import {APPROVED_LEAVE} from './crm_leave_approvals';
import {suppressKristaIntake} from './practitioner_intake_pause';
import {buildEmailHtml,parseAvailability} from '../apps/practitioner-availability/utils/emailBuilder';
import {activeUpcomingLeave,escapeLeaveHtml} from '../apps/practitioner-availability/utils/upcomingLeave';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/crm-sync-2026-11-15`,backup=`${root}/backups/pre_crm_crm-sync-2026-11-15`;
const read=async(f:string)=>JSON.parse(await readFile(f,'utf8'));
const data=await read(`${root}/practitioners_data.json`),before=await read(`${backup}/practitioners_data.json`),report=await read(`${dir}/reconciliation.json`);
let checks=0;const eq=(a:any,b:any)=>{assert.deepEqual(a,b);checks++;};const ok=(x:any)=>{assert(x);checks++;};
eq(data.length,25);eq(report.matched.length,25);
for(let i=0;i<data.length;i++)for(const k of Object.keys(data[i]))if(!report.changes.some((c:any)=>c.name===data[i].name&&c.field===k))eq(data[i][k],before[i][k]);
for(const c of report.changes){const p=data.find((p:any)=>p.name===c.name);eq(p[c.field],c.new);eq(before.find((p:any)=>p.name===c.name)[c.field],c.old);}
for(const f of ['deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'])eq(await read(`${root}/${f}`),data);
eq(await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),await readFile(`${root}/deploy/src/practitionersData.ts`,'utf8'));
eq(await readFile(`${root}/practitioners_photos.json`,'utf8'),await readFile(`${backup}/practitioners_photos.json`,'utf8'));
eq(data.filter((p:any)=>p.upcoming_leave_client_notice).length,18);eq(Object.keys(APPROVED_LEAVE).length,18);
const records=[...(await read(`${dir}/sources/contacts.json`)).data,...(await read(`${dir}/sources/josh.json`)).data];
const held=[];
for(const m of report.matched){const crm=records.find((c:any)=>c.id===m.id),p=data.find((c:any)=>c.name===m.name);for(const [k,v] of Object.entries(mapCrmNotes(crm)))eq(p[k],v);ok(!Object.hasOwn(crm,'Date_of_Birth'));if(crm.Upcoming_leave_client_notice&&!mapCrmUpcomingLeave(crm).upcoming_leave_client_notice&&p.name!=='Dr Krista De Castella')held.push({name:p.name,id:crm.id,notice:crm.Upcoming_leave_client_notice,show:crm.Show_notice_from,hide:crm.Hide_notice_after});}
for(const [id,a] of Object.entries(APPROVED_LEAVE)){const c={id,Upcoming_leave_client_notice:a.notice,Show_notice_from:a.show,Hide_notice_after:a.hide};eq(mapCrmUpcomingLeave(c).upcoming_leave_client_notice,a.notice);eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:a.notice+' UNAPPROVED'}).upcoming_leave_client_notice,'');eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:''}).upcoming_leave_client_notice,'');}
const now=new Date('2026-11-15T12:00:00Z'),selected=data.filter((p:any)=>['Alex Barry','Dr Maddie Brygel','Kiira Gavralas','Poorna Selvaraja'].includes(p.name));eq(selected.length,4);
const html=buildEmailHtml('Preview only','','PsychologyCare Team',selected.map((p:any)=>({...p,availabilityLocations:p.locations,alert:'SECRET STAFF SENTINEL',Leave_Reason:'SECRET REASON',practitioner_age:'AGE SENTINEL'})),undefined,false,{},now);
eq((html.match(/data-upcoming-leave="client"/g)||[]).length,4);for(const p of selected)for(const line of p.upcoming_leave_client_notice.split(/\r?\n/))ok(html.includes(escapeLeaveHtml(line)));
for(const text of ['SECRET STAFF SENTINEL','SECRET REASON','AGE SENTINEL','data-staff-age'])ok(!html.includes(text));
ok(html.includes('bgcolor="#FBF7F4"'));ok(html.includes('border-left:3px solid #B58AA0'));
const paused=data.find((p:any)=>p.name==='Dr Krista De Castella');eq(paused,suppressKristaIntake(paused));
eq(parseAvailability('Monday at 9am (Weekly: Starting 16 Nov)\nTuesday at 10am (Fortnightly: Starting 17 Nov)\nWednesday at 11am (Monthly: Starting 18 Nov)').monthly,[]);
for(const p of data)for(const key of Object.keys(p))ok(!/^(age|dob|date_of_birth|practitioner_age|personal_age)$/i.test(key));
const ts=await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),oldts=await readFile(`${backup}/apps/practitioner-availability/practitionersData.ts`,'utf8');
eq(ts.match(/AVAILABILITY_LAST_UPDATED = "([^"]+)"/)?.[1],oldts.match(/AVAILABILITY_LAST_UPDATED = "([^"]+)"/)?.[1]);
for(const f of ['netlify.toml','src/utils/emailBuilder.ts','apps/practitioner-availability/utils/emailBuilder.ts','src/App.tsx','src/app.tsx','src/FindPractitioner.tsx']){const baseline=await read(`${dir}/sources/github_${f.replaceAll('/','__')}.json`);eq(await readFile(f.startsWith('apps/')?`${root}/${f}`:`${root}/deploy/${f}`,'utf8'),baseline.content);}
await writeFile(`${dir}/email_preview.html`,html);
const result={passed:true,checks,matched:25,changedPractitioners:new Set(report.changes.map((c:any)=>c.name)).size,changes:report.changes.length,noticeCount:18,heldNotices:held,timestamp:report.preserved.availabilityLastUpdated,canonicalSha256:createHash('sha256').update(await readFile(`${root}/practitioners_data.json`)).digest('hex'),availabilityUnchanged:true,otherFieldsUnchanged:true,noDobFetched:true};
await writeFile(`${dir}/validation.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
