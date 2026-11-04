import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/reconfirmed`;
const sheet=JSON.parse(await readFile(`${dir}/sheet_fresh.json`,'utf8'));assert.equal(sheet.sheet.sheetId,938400101);
const rows=Array.from({length:32},(_,i)=>{const row=i+4;return {row,...Object.fromEntries('ABCD'.split('').map(c=>[c,sheet.cells[c+row]??'']))};}).filter((r:any)=>r.A);
const selected=rows.filter((r:any)=>r.D==='Confirmed correct');
const norm=(s:string)=>s.toLowerCase().replace(/^(dr|mr|ms)\.?\s+/,'').replace(/^nicholas burden$/,'nick burden').replace(/^josh kugel$/,'joshua kugel').trim();
const app=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8'));
async function call(toolName:string,args:any){const r=await invokeTool({connectionId:'conn_pdkvmnzjcqdeb3ha13wc',toolName,args});if(!r.ok)throw Error(r.error);return await r.json() as any;}
const res=await call('zoho_crm-search-objects',{module:'Contacts',criteria:'(Account_Name:equals:PsychologyCare)'}),data=res.result??res;assert(!data.info?.more_records);const records=data.data;
if(!records.some((r:any)=>r.id==='50438000007973001')){const j=await call('zoho_crm-get-object',{module:'Contacts',recordId:'50438000007973001'});records.push((j.result??j).data[0]);}
await writeFile(`${dir}/contacts_before.json`,JSON.stringify(records,null,2));
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function iso(s:string){const m=s.match(/^(\d{2}) ([A-Z][a-z]{2}) (\d{4})$/);assert(m);const n=months.indexOf(m[2])+1;assert(n);const v=`${m[3]}-${String(n).padStart(2,'0')}-${m[1]}`;assert.equal(new Date(v+'T00:00:00Z').toISOString().slice(0,10),v);return v;}
const long=(s:string)=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(s+'T00:00:00Z'));
const plans=selected.map((row:any)=>{
 const matches=records.filter((r:any)=>norm(r.Full_Name)===norm(row.A));assert.equal(matches.length,1,`CRM match ${row.A}`);const crm=matches[0];
 const ps=app.filter((p:any)=>norm(p.name)===norm(row.A));assert.equal(ps.length,1,`App match ${row.A}`);const p=ps[0];
 const ignored:string[]=[];
 const ranges=row.B.split('\n').flatMap((line:string)=>{if(/^Telehealth Only:/i.test(line)){ignored.push(line);return [];}
 const m=line.match(/^([^:]+):\s*(\d{2} [A-Z][a-z]{2} \d{4})\s*[–-]\s*(\d{2} [A-Z][a-z]{2} \d{4})$/);assert(m,`Unrecognized ${line}`);assert(['Holidays','Annual Leave','Sick/ Personal'].includes(m[1]),`Unknown leave category ${m[1]}`);const from=iso(m[2]),until=iso(m[3]);assert(from<=until);return [{from,until}];});
 assert(ranges.length,`No actual leave ${row.A}`);
 const update={Upcoming_leave_client_notice:ranges.map((r:any)=>`${p.name.replace(/^Dr\.?\s+/,'')} will be on leave from ${long(r.from)} to ${long(r.until)} inclusive.`).join('\n'),Show_notice_from:'2026-11-04',Hide_notice_after:ranges.map((r:any)=>r.until).sort().at(-1)};
 const before=Object.fromEntries(Object.keys(update).map(k=>[k,crm[k]]));
 for(const [k,v]of Object.entries(before))assert(!v||v===update[k as keyof typeof update],`Nonempty differing field ${p.name}.${k}`);
 return {sheetRow:row.row,appName:p.name,crmId:crm.id,crmName:crm.Full_Name,ranges,ignoredTelehealthOnly:ignored,before,update,needsUpdate:Object.entries(update).some(([k,v])=>crm[k]!==v)};
});
const held=rows.filter((r:any)=>r.D!=='Confirmed correct').map((r:any)=>({row:r.row,name:r.A,status:r.D,crm:records.find((c:any)=>norm(c.Full_Name)===norm(r.A))})).filter((r:any)=>r.crm?.Upcoming_leave_client_notice).map((r:any)=>({row:r.row,name:r.name,status:r.status,crmId:r.crm.id,notice:r.crm.Upcoming_leave_client_notice,show:r.crm.Show_notice_from,hide:r.crm.Hide_notice_after}));
await writeFile(`${dir}/plan.json`,JSON.stringify({selected:plans.length,plans,held},null,2));console.log(JSON.stringify({plans,held},null,2));
if(process.argv.includes('--apply')){
 const audit=[];
 for(const plan of plans.filter((p:any)=>p.needsUpdate)){
  const currentRes=await call('zoho_crm-get-object',{module:'Contacts',recordId:plan.crmId}),current=(currentRes.result??currentRes).data[0];
  for(const [k,v]of Object.entries(plan.before))assert.equal(current[k],v,`Concurrent ${plan.appName}.${k}`);
  const result=await call('zoho_crm-upsert-records',{module:'Contacts',data:JSON.stringify([{id:plan.crmId,...plan.update}]),trigger:[],ifUnmodifiedSince:current.Modified_Time});
  await writeFile(`${dir}/write_${plan.crmId}.json`,JSON.stringify(result,null,2));
  const vr=await call('zoho_crm-get-object',{module:'Contacts',recordId:plan.crmId}),after=(vr.result??vr).data[0];
  for(const [k,v]of Object.entries(plan.update))assert.equal(after[k],v);
  for(const k of Object.keys(current))if(!['Modified_Time','Modified_By','Last_Activity_Time',...Object.keys(plan.update)].includes(k))assert.deepEqual(after[k],current[k],`Unrelated ${plan.appName}.${k}`);
  audit.push({...plan,verified:after});await writeFile(`${dir}/applied_audit.json`,JSON.stringify(audit,null,2));
 }
 const approvals=Object.fromEntries(plans.map((p:any)=>[p.crmId,{name:p.appName,sheetRow:p.sheetRow,notice:p.update.Upcoming_leave_client_notice,show:p.update.Show_notice_from,hide:p.update.Hide_notice_after}]));
 const code=`// Explicit Confirmed correct sheet approval snapshot; never infer approval from CRM text.\n// Source gid 938400101; refreshed 4 November 2026. Change only after fresh confirmation.\nexport const APPROVED_LEAVE: Record<string,{name:string;sheetRow:number;notice:string;show:string;hide:string}> = ${JSON.stringify(approvals,null,2)};\n`;
 for(const f of ['scripts/crm_leave_approvals.ts','deploy/src/crm_leave_approvals.ts'])await writeFile(`${root}/${f}`,code);
 await writeFile(`${dir}/app_before.json`,JSON.stringify(app,null,2));
}
