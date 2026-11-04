import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
import {upcomingLeaveEmailHtml,escapeLeaveHtml} from '../apps/practitioner-availability/utils/upcomingLeave';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/reconfirmed_1343`;
const rows=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8'));

const selected=rows.filter((p:any)=>/Belinda Pacella|Karen Pereira York/.test(p.name));
assert.equal(selected.length,2);
const data=selected.map((p:any)=>({...p,availabilityLocations:p.locations}));
const now=new Date('2026-11-04T04:00:00Z');
const html=buildEmailHtml('Client','','PsychologyCare Team',data,undefined,false,{},now);
assert.equal((html.match(/data-upcoming-leave="client"/g)||[]).length,2);
for(const p of selected){
  for(const line of p.upcoming_leave_client_notice.split(/\r?\n/))assert(html.includes(escapeLeaveHtml(line)));
  if(p.alert)assert(!html.includes(p.alert));
}
const section=upcomingLeaveEmailHtml({upcoming_leave_client_notice:'<img src=x onerror=alert(1)> & "test"\nSecond period'},now);
assert(section.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;test&quot;'));
assert(!section.includes('<img'));
assert(section.includes('bgcolor="#FBF7F4"'));
assert(section.includes('border-left:3px solid #B58AA0'));
assert(section.includes('line-height:22px'));
assert(!/display:flex|display:grid|<style|<svg/.test(section));
assert.equal((section.match(/<p style=/g)||[]).length,3);
assert.equal(upcomingLeaveEmailHtml({...data[0],upcoming_leave_hide_after:'2026-11-03'},now),'');
assert.equal(upcomingLeaveEmailHtml({...data[0],upcoming_leave_client_notice:''},now),'');
assert.equal(await readFile(`${root}/apps/practitioner-availability/utils/upcomingLeave.ts`,'utf8'),await readFile(`${root}/deploy/src/utils/upcomingLeave.ts`,'utf8'));
await writeFile(`${dir}/belinda_karen_email_preview.html`,`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PsychologyCare leave notice email preview</title></head><body style="margin:0;">${html}</body></html>`);
await writeFile(`${dir}/design_test_result.json`,JSON.stringify({passed:true,practitioners:selected.map((p:any)=>p.name),noDataChanges:true,checks:['real-template','exact-source-wording','two-practitioners','escaping','table-inline-email-styles','multiple-lines','expiry','blank','internal-note-separation','mirrors']},null,2));
console.log('Email design checks passed; real-template preview saved.');
