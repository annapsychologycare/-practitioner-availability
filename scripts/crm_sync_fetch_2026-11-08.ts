import {fetchInternalPractitioners} from './internal_practitioner_guard';
import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/sync_2026-11-08/sources`;
await mkdir(dir,{recursive:true});
const call=async(toolName:string,connectionId:string,args:any)=>{const r=await invokeTool({toolName,connectionId,args});if(!r.ok)throw Error(r.error);return await r.json() as any;};
// Explicit allowlist: never request DOB, personal ages, HR or banking fields.
const all=await fetchInternalPractitioners();
const contacts=all.filter(c=>c.id!=='50438000007973001'),josh=all.filter(c=>c.id==='50438000007973001');assert.equal(josh.length,1);
await writeFile(`${dir}/contacts.json`,JSON.stringify({data:contacts,info:{count:contacts.length,more_records:false}},null,2));
await writeFile(`${dir}/josh.json`,JSON.stringify({data:josh},null,2));
const fees=await call('zoho_crm-list-objects','conn_pdkvmnzjcqdeb3ha13wc',{module:'Fee_Schedules',fields:'id,Name,Active,Business_Hours_Fee,After_Hours_Fee,Medicare_Rebate,Fee_Notes',page:'1',perPage:'200'});assert(!(fees.result??fees).info?.more_records);await writeFile(`${dir}/fees.json`,JSON.stringify(fees,null,2));
const paths=['practitioners_data.json','public/practitioners_data.json','src/practitioners_data.json','netlify/functions/practitioners-data.json','src/practitionersData.ts','practitionersData.ts','apps/practitioner-availability/practitionersData.ts','src/App.tsx','src/app.tsx','src/FindPractitioner.tsx','netlify.toml','package.json','src/utils/emailBuilder.ts','apps/practitioner-availability/utils/emailBuilder.ts'];
await Promise.all(paths.map(async(repoPath)=>{const x=await call('github_get_file_content','conn_nvshm6rz3kzncg0nh4vk',{owner:'annapsychologycare',repo:'-practitioner-availability',ref:'main',repoPath});await writeFile(`${dir}/github_${repoPath.replaceAll('/','__')}.json`,JSON.stringify(x));console.log('github',repoPath,x.sha);}));
console.log(JSON.stringify({accountContacts:contacts.length,josh:josh[0].Full_Name,fees:(fees.result??fees).data.length,privacy:'DOB/ages not requested'}));
