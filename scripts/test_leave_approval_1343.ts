import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {APPROVED_LEAVE} from './crm_leave_approvals';
import {mapCrmUpcomingLeave} from './crm_upcoming_leave';
import {mapCrmNotes} from './crm_alerts';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/reconfirmed_1343`;
let checks=0;const eq=(a:any,b:any)=>{assert.deepEqual(a,b);checks++;};
const empty={upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''};
for(const [id,a]of Object.entries(APPROVED_LEAVE)){
 const crm={id,Upcoming_leave_client_notice:a.notice,Show_notice_from:a.show,Hide_notice_after:a.hide};
 eq(mapCrmUpcomingLeave(crm),{upcoming_leave_client_notice:a.notice,upcoming_leave_show_from:a.show,upcoming_leave_hide_after:a.hide});
 for(const k of ['Upcoming_leave_client_notice','Show_notice_from','Hide_notice_after'])eq(mapCrmUpcomingLeave({...crm,[k]:'unapproved edit'}),empty);
 eq(mapCrmUpcomingLeave({...crm,id:'unapproved-id'}),empty);
 eq(mapCrmUpcomingLeave({...crm,Upcoming_leave_client_notice:null}).upcoming_leave_client_notice,'');
}
const amy={id:'50438000001633178',Full_Name:'Amy Bortz',Upcoming_leave_client_notice:'Amy will be unavailable from 18th Dec 2026 to 8th Jan 2027',Show_notice_from:'2026-11-04',Hide_notice_after:null,Intake_Alert_Notes:'',Intake_Alert_Notes_Internal:'SECRET INTERNAL'};
eq(mapCrmUpcomingLeave(amy),empty);eq(mapCrmNotes(amy).upcoming_leave_client_notice,'');
const data=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8'));
eq(data.filter((p:any)=>p.upcoming_leave_client_notice).length,Object.keys(APPROVED_LEAVE).length);
const pracs=data.map((p:any)=>({...p,availabilityLocations:(p.locations??[]).map((l:any)=>({location:l.name,availability:l.availability}))}));
const html=buildEmailHtml('Test','','Staff',pracs,undefined,false,{},new Date('2026-11-04T03:00:00Z'));
eq((html.match(/data-upcoming-leave="client"/g)||[]).length,Object.keys(APPROVED_LEAVE).length);
for(const text of ['Sick/ Personal','Holidays:','Annual Leave:','Telehealth Only:','SECRET INTERNAL','Amy will be unavailable']){assert(!html.includes(text));checks++;}
const plan=JSON.parse(await readFile(`${dir}/plan.json`,'utf8'));
eq(plan.plans.filter((p:any)=>p.ignoredTelehealthOnly.length).length,2);
eq(plan.plans.find((p:any)=>p.appName==='Karen Pereira York').ranges.length,2);
assert(!data.find((p:any)=>p.name==='Joshua Kugel').upcoming_leave_client_notice.includes('November'));checks++;
await writeFile(`${dir}/test_email_all.html`,html);await writeFile(`${dir}/approval_test_result.json`,JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks}));
