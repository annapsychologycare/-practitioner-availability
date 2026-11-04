import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {LEAVE_CRM_FIELDS,mapCrmUpcomingLeave} from './crm_upcoming_leave';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04/confirmed_sheet`;
await mkdir(dir,{recursive:true});
const sheet=JSON.parse(await readFile('/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/blocks/b_1ynj0158x94a0ys2tkq8/result','utf8'));
const rows=Array.from({length:27},(_,i)=>{const row=i+4;return {row,...Object.fromEntries('ABCDEF'.split('').map(col=>[col,sheet.cells[`${col}${row}`]??'']))};});
const selected=rows.filter((r:any)=>r.D==='Confirmed correct');assert.equal(selected.length,3);
const norm=(s:string)=>s.toLowerCase().replace(/^dr\.?\s+/,'').trim();
assert(selected.every((r:any)=>['clare tuttleby','maddie brygel','kiira gavralas'].includes(norm(r.A))));
const app=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8'));
async function call(toolName:string,args:any){const r=await invokeTool({connectionId:'conn_pdkvmnzjcqdeb3ha13wc',toolName,args});if(!r.ok)throw Error(r.error);return await r.json() as any;}
const response=await call('zoho_crm-search-objects',{module:'Contacts',criteria:'(Account_Name:equals:PsychologyCare)'});const data=response.result??response;assert(!data.info?.more_records&&Array.isArray(data.data));
await writeFile(`${dir}/contacts_before.json`,JSON.stringify(response,null,2));
const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function parseDate(s:string){const m=s.match(/^(\d{2}) ([A-Z][a-z]{2}) (\d{4})$/);assert(m,`Unrecognized sheet date ${s}`);const month=monthNames.indexOf(m[2])+1;assert(month);const iso=`${m[3]}-${String(month).padStart(2,'0')}-${m[1]}`;assert.equal(new Date(`${iso}T00:00:00Z`).toISOString().slice(0,10),iso);return iso;}
const longDate=(iso:string)=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`));
const plans=selected.map((row:any)=>{
 const matches=data.data.filter((p:any)=>norm(p.Full_Name)===norm(row.A));assert.equal(matches.length,1,`Unique CRM identity ${row.A}`);const crm=matches[0];
 const appMatches=app.filter((p:any)=>norm(p.name)===norm(row.A));assert.equal(appMatches.length,1);const practitioner=appMatches[0];
 // The actual CRM/app both say Gavralas. Do not match Dempsey by first name.
 if(norm(row.A)==='kiira gavralas')assert(!data.data.some((p:any)=>norm(p.Full_Name)==='kiira dempsey'),'Alternate Kiira identity requires review');
 const ranges=row.B.split('\n').map((line:string)=>{const m=line.match(/^[^:]+:\s*(\d{2} [A-Z][a-z]{2} \d{4})\s*[–-]\s*(\d{2} [A-Z][a-z]{2} \d{4})$/);assert(m,`Unrecognized leave range ${line}`);const from=parseDate(m[1]),until=parseDate(m[2]);assert(from<=until);return {from,until};});
 const notice=ranges.map((r:any)=>`${practitioner.name.replace(/^Dr\.?\s+/,'')} will be on leave from ${longDate(r.from)} to ${longDate(r.until)} inclusive.`).join('\n');
 const update={Upcoming_leave_client_notice:notice,Show_notice_from:'2026-11-04',Hide_notice_after:ranges.map((r:any)=>r.until).sort().at(-1)};
 mapCrmUpcomingLeave(crm);
 for(const key of Object.values(LEAVE_CRM_FIELDS))assert(!crm[key]||crm[key]===update[key as keyof typeof update],`Nonempty differing CRM value ${crm.Full_Name}.${key}`);
 return {sheetRow:row.row,sheetName:row.A,crmName:crm.Full_Name,crmId:crm.id,appName:practitioner.name,identityEvidence:{email:crm.Email,appBio:practitioner.link_to_bio},ranges,before:Object.fromEntries(Object.values(LEAVE_CRM_FIELDS).map(k=>[k,crm[k]])),update};
});
await writeFile(`${dir}/plan.json`,JSON.stringify({spreadsheetId:sheet.spreadsheetId,sheetId:sheet.sheet.sheetId,plans,unconfirmedRowsSkipped:rows.filter((r:any)=>r.D!=='Confirmed correct').length},null,2));
console.log(JSON.stringify(plans.map(p=>({name:p.appName,id:p.crmId,row:p.sheetRow,update:p.update})),null,2));
if(process.argv.includes('--apply')){
 const audit=[];
 for(const plan of plans){
  const live=await call('zoho_crm-get-object',{module:'Contacts',recordId:plan.crmId}),current=(live.result??live).data[0];
  for(const key of Object.values(LEAVE_CRM_FIELDS))assert.equal(current[key],plan.before[key],`Concurrent CRM edit ${plan.appName}.${key}`);
  const result=await call('zoho_crm-upsert-records',{module:'Contacts',data:JSON.stringify([{id:plan.crmId,...plan.update}]),trigger:[]});
  await writeFile(`${dir}/update_${plan.crmId}.json`,JSON.stringify(result,null,2));
  const verified=await call('zoho_crm-get-object',{module:'Contacts',recordId:plan.crmId}),record=(verified.result??verified).data[0];
  for(const [key,value] of Object.entries(plan.update))assert.equal(record[key],value);
  // Check all business fields, including separate notes, untouched by ID-only upsert.
  const ignore=new Set(['Modified_Time','Modified_By','Last_Activity_Time',...Object.keys(plan.update)]);
  for(const key of Object.keys(current))if(!ignore.has(key))assert.deepEqual(record[key],current[key],`Unrelated CRM change ${plan.appName}.${key}`);
  await writeFile(`${dir}/verified_${plan.crmId}.json`,JSON.stringify(verified,null,2));
  audit.push({...plan,verified:true});await writeFile(`${dir}/applied_audit.json`,JSON.stringify(audit,null,2));
 }
 console.log('Verified three CRM records; only the three leave fields updated.');
}
