import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import approved from './internal_practitioners.json';
import {isInternalPractitioner,assertInternalAppMembership,fetchInternalPractitioners,INTERNAL_ACCOUNT_ID} from './internal_practitioner_guard';
let checks=0;const test=(v:boolean)=>{assert(v);checks++};
for(const p of approved){const c={id:p.id,Directory_category:null,Account_Name:{id:INTERNAL_ACCOUNT_ID}};test(isInternalPractitioner(c));for(const category of ['External provider','GP referrer','Unknown'])test(!isInternalPractitioner({...c,Directory_category:category}));test(!isInternalPractitioner({...c,id:'external'}));test(!isInternalPractitioner({...c,Directory_category:undefined})||Object.hasOwn(c,'Directory_category'));test(!isInternalPractitioner({id:p.id,Account_Name:c.Account_Name}));if(p.id!=='50438000007973001')test(!isInternalPractitioner({...c,Account_Name:null}));}
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',data=JSON.parse(await readFile(`${root}/practitioners_data.json`,'utf8'));assertInternalAppMembership(data);checks++;
assert.throws(()=>assertInternalAppMembership([...data,{name:'External provider'}]));checks++;
const fresh=await fetchInternalPractitioners();test(fresh.length===25);for(const d of fresh)test(isInternalPractitioner(d));
await writeFile(`${root}/referral-directory-import-2026-11-10/guard-tests.json`,JSON.stringify({checks,liveInternalRead:25,allPass:true},null,2));console.log({checks,liveInternalRead:25,allPass:true});
