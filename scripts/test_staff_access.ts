import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { allowedStaff, ANNA_EMAIL, ANNA_ID, melbourneDay, productionRequest, validateSnapshot, reply } from '../deploy/netlify/lib/staff-policy';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
let checks=0;
const check=(x:any)=>{assert(x);checks++;};
const good={id:ANNA_ID,email:ANNA_EMAIL,confirmedAt:'2026-11-04',roles:['staff-age']};
check(allowedStaff(good));
for(const bad of [null,{}, {...good,id:'other'}, {...good,email:'other@psychologycare.com.au'}, {...good,confirmedAt:undefined}, {...good,roles:[]}, {...good,roles:undefined,userMetadata:{roles:['staff-age']}}])check(!allowedStaff(bad));
check(productionRequest(new Request('https://pc-prac-availability.netlify.app/.netlify/functions/staff-ages'),'true'));
check(!productionRequest(new Request('https://preview.netlify.app/.netlify/functions/staff-ages'),'true'));
check(!productionRequest(new Request('https://pc-prac-availability.netlify.app/.netlify/functions/staff-ages'),'false'));
check(!productionRequest(new Request('https://pc-prac-availability.netlify.app/.netlify/functions/staff-ages'),''));
check(melbourneDay(new Date('2026-11-03T13:00:00Z'))==='2026-11-04');
check(melbourneDay(new Date('2026-11-03T12:59:59Z'))==='2026-11-03');
const ids=new Set(['fixture-id']);
check(validateSnapshot({asOfDay:'2026-11-04',ages:[]},ids,'2026-11-04').ages.length===0);
check(validateSnapshot({asOfDay:'2026-11-04',ages:[{id:'fixture-id',age:40}]},ids,'2026-11-04').ages.length===1);
for(const bad of [{asOfDay:'2026-11-03',ages:[]},{asOfDay:'2026-11-04',ages:[],dob:'private'}, ...[-1,17,111,40.5,'40'].map(age=>({asOfDay:'2026-11-04',ages:[{id:'fixture-id',age}]})),{asOfDay:'2026-11-04',ages:[{id:'other',age:40}]},{asOfDay:'2026-11-04',ages:[{id:'fixture-id',age:40,Date_of_Birth:'fixture'}]},{asOfDay:'2026-11-04',ages:[{id:'fixture-id',age:40},{id:'fixture-id',age:40}]}]){assert.throws(()=>validateSnapshot(bad,ids,'2026-11-04'));checks++;}
for(const h of ['cache-control','netlify-cdn-cache-control','cdn-cache-control'])check(reply({}).headers.get(h)?.includes('no-store'));
const data=await readFile(`${root}/practitioners_data.json`,'utf8');
check(createHash('sha256').update(data).digest('hex')==='aed0349e3db55804a0c20e55b9a9edaba8bb9b96211f16591d99d8508fa12b6c');
for(const f of ['deploy/practitioners_data.json','deploy/public/practitioners_data.json','deploy/src/practitioners_data.json','deploy/netlify/functions/practitioners-data.json'])check(await readFile(`${root}/${f}`,'utf8')===data);
const publicRecords=JSON.parse(data);
check(publicRecords.filter((p:any)=>p.upcoming_leave_client_notice).length===17);
for(const p of publicRecords)for(const key of Object.keys(p))check(!/^(age|dob|date_of_birth|practitioner_age|personal_age)$/i.test(key));
for(const f of ['utils/emailBuilder.ts','components/SendClientModal.tsx','Compare.tsx','IntakeTab.tsx']){
 let s='';try{s=await readFile(`${root}/apps/practitioner-availability/${f}`,'utf8')}catch{continue;}
 check(!/StaffAge|AgeContext|staff-ages/.test(s));
}
const client=await readFile(`${root}/apps/practitioner-availability/components/StaffAccess.tsx`,'utf8');
check(!/localStorage|sessionStorage|console\.(log|error)/.test(client));
check(client.includes('requestVersion.current++'));
const card=await readFile(`${root}/apps/practitioner-availability/FindPractitioner.tsx`,'utf8');
check(card.includes('<StaffAge id={p.id} />'));
const copy=card.slice(card.indexOf('const copyAvailability ='),card.indexOf('const copyAvailability =')+600);
check(!/StaffAge|ages|AgeContext/.test(copy));
console.log(JSON.stringify({checks,passed:true,privateFixturesOnly:true,publicDataUnchanged:true}));
