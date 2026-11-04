import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {APPROVED_LEAVE} from './crm_leave_approvals';
import {mapCrmUpcomingLeave} from './crm_upcoming_leave';
import {activeUpcomingLeave,upcomingLeaveEmailHtml,escapeLeaveHtml} from '../apps/practitioner-availability/utils/upcomingLeave';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/poorna_leave_2026-11-05`;
const read=async(f:string)=>JSON.parse(await readFile(`${root}/${f}`,'utf8'));
const data=await read('practitioners_data.json'),before=await read('poorna_leave_2026-11-05/data_before.json'),crm=await read('poorna_leave_2026-11-05/crm_client_fields.json');
let checks=0;const eq=(a:any,b:any)=>{assert.deepEqual(a,b);checks++;};
for(let i=0;i<data.length;i++)for(const k of new Set([...Object.keys(data[i]),...Object.keys(before[i])]))if(!(data[i].name===crm.name&&k==='upcoming_leave_client_notice'))eq(data[i][k],before[i][k]);
eq(data.filter((p:any)=>p.upcoming_leave_client_notice).length,17);
for(const f of ['deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'])eq(await read(f),data);
eq(await readFile(`${root}/apps/practitioner-availability/practitionersData.ts`,'utf8'),await readFile(`${root}/deploy/src/practitionersData.ts`,'utf8'));
eq(await readFile(`${root}/scripts/crm_leave_approvals.ts`,'utf8'),await readFile(`${root}/deploy/src/crm_leave_approvals.ts`,'utf8'));
for(const [id,a] of Object.entries(APPROVED_LEAVE)){
 const c={id,Upcoming_leave_client_notice:a.notice,Show_notice_from:a.show,Hide_notice_after:a.hide};
 eq(mapCrmUpcomingLeave(c),{upcoming_leave_client_notice:a.notice,upcoming_leave_show_from:a.show,upcoming_leave_hide_after:a.hide});
 eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:a.notice+' unapproved'}).upcoming_leave_client_notice,'');
 eq(mapCrmUpcomingLeave({...c,Upcoming_leave_client_notice:''}).upcoming_leave_client_notice,'');
}
const p=data.find((p:any)=>p.name===crm.name),now=new Date('2026-11-05T00:00:00Z');
eq(p.upcoming_leave_client_notice,crm.Upcoming_leave_client_notice);eq(mapCrmUpcomingLeave(crm).upcoming_leave_client_notice,crm.Upcoming_leave_client_notice);
eq(activeUpcomingLeave(p,new Date('2027-01-11T12:59:59Z')),p.upcoming_leave_client_notice);eq(activeUpcomingLeave(p,new Date('2027-01-11T13:00:00Z')),'');
eq(activeUpcomingLeave({...p,upcoming_leave_show_from:'2027-02-01'},now),'');eq(activeUpcomingLeave({...p,upcoming_leave_hide_after:'invalid'},now),'');
const input={...p,availabilityLocations:p.locations.map((l:any)=>({location:l.location??l.name,availability:l.availability})),alert:'SECRET INTERNAL FIXTURE',Leave_Reason:'SECRET LEAVE REASON'};
const html=buildEmailHtml('Client','','PsychologyCare Team',[input],undefined,false,{},now);
assert(html.includes(escapeLeaveHtml(p.upcoming_leave_client_notice)));checks++;
for(const s of ['SECRET INTERNAL FIXTURE','SECRET LEAVE REASON','14 December 2026','data-staff-age']){assert(!html.includes(s));checks++;}
assert(html.includes('bgcolor="#FBF7F4"')&&html.includes('border-left:3px solid #B58AA0'));checks++;
eq((html.match(/data-upcoming-leave="client"/g)||[]).length,1);
eq(upcomingLeaveEmailHtml({...p,name:'Dr Krista De Castella',upcoming_leave_client_notice:''},now),'');
assert(upcomingLeaveEmailHtml({upcoming_leave_client_notice:'<script> & "text"'},now).includes('&lt;script&gt; &amp; &quot;text&quot;'));checks++;
const paused=buildEmailHtml('Client','','Team',[{...input,name:'Dr Krista De Castella'}],undefined,false,{},now);assert(!paused.includes('data-upcoming-leave'));checks++;
await writeFile(`${dir}/poorna_email_preview.html`,`<!doctype html><html><head><meta charset="utf-8"><title>Poorna leave — unsent preview</title></head><body>${html}</body></html>`);
await writeFile(`${dir}/tests.json`,JSON.stringify({checks,passed:true,notice:p.upcoming_leave_client_notice,show:p.upcoming_leave_show_from,hide:p.upcoming_leave_hide_after},null,2));console.log(JSON.stringify({checks,passed:true}));
