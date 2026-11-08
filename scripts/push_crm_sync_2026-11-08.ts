import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/sync_2026-11-08`,repo={owner:'annapsychologycare',repo:'-practitioner-availability'};
const get=async(repoPath:string,ref='main')=>{const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_get_file_content',args:{...repo,repoPath,ref}});assert(r.ok,repoPath);return await r.json() as any;};
const preserved=JSON.parse(await readFile(`${root}/all_published_verified_2026-11-06.json`,'utf8'));
await Promise.all(preserved.map(async(x:any)=>assert.equal((await get(x.path)).sha,x.sha,`Concurrent deployed change: ${x.path}`)));
const sourcePaths=['src/App.tsx','src/app.tsx','src/FindPractitioner.tsx','netlify.toml','src/utils/emailBuilder.ts','apps/practitioner-availability/utils/emailBuilder.ts'];
await Promise.all(sourcePaths.map(async(p)=>{const x=JSON.parse(await readFile(`${dir}/sources/github_${p.replaceAll('/','__')}.json`,'utf8'));assert.equal((await get(p)).sha,x.sha,p);}));
const report=JSON.parse(await readFile(`${root}/crm_sync_report_2026-11-08.json`,'utf8'));assert.equal(report.changes.length,0);
const paths=['zoho_sync_workflow.md',...['crm_sync_fetch_2026-11-08.ts','apply_crm_sync_2026-11-08.ts','validate_crm_sync_2026-11-08.ts','push_crm_sync_2026-11-08.ts'].map(f=>`scripts/${f}`)];
// No-op data reconciliation: commit only reproducible privacy-safe helpers/guidance.
// No private CRM snapshot, client data, DOB or ages are published.
const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_push_to_branch',args:{...repo,branch:'main',commitMessage:'chore: validate 8 Nov CRM sync; add privacy-safe allowlisted weekly helpers',files:paths.map(repoPath=>({repoPath,localPath:`${root}/${repoPath}`}))}});assert(r.ok);
const result:any=await r.json();await writeFile(`${dir}/github_push_result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
const verified=await Promise.all(paths.map(async(p)=>{const x=await get(p,result.commit.sha),b=await readFile(`${root}/${p}`),sha=createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');assert.equal(x.sha,sha,p);return {path:p,sha};}));
await Promise.all(preserved.map(async(x:any)=>assert.equal((await get(x.path,result.commit.sha)).sha,x.sha,`Protected publication changed: ${x.path}`)));
await writeFile(`${dir}/github_verified.json`,JSON.stringify({verified,preserved,applicationDataUnchanged:true},null,2));console.log(JSON.stringify({verified:verified.length,preserved:preserved.length}));
