import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/crm-sync-2026-11-22`,repo={owner:'annapsychologycare',repo:'-practitioner-availability'};
const paths=[['src/practitioners_data.json','deploy/src/practitioners_data.json'],['practitioners_data.json','deploy/practitioners_data.json'],['public/practitioners_data.json','deploy/public/practitioners_data.json'],['netlify/functions/practitioners-data.json','deploy/netlify/functions/practitioners-data.json'],['src/practitionersData.ts','deploy/src/practitionersData.ts'],['practitionersData.ts','deploy/src/practitionersData.ts'],['apps/practitioner-availability/practitionersData.ts','apps/practitioner-availability/practitionersData.ts'],['bundle.js','deploy/src/bundle.js'],['src/bundle.js','deploy/src/bundle.js'],['public/bundle.js','deploy/src/bundle.js'],['apps/practitioner-availability/bundle.js','apps/practitioner-availability/bundle.js']];
for(const s of ['crm_sync_fetch_2026-11-22.ts','apply_crm_sync_2026-11-22.ts','validate_crm_sync_2026-11-22.ts','test_leave_email_design_2026-11-22.ts','publish_crm_sync_2026-11-22.ts','build_crm_sync_2026-11-22.ts','prepare_crm_sync_2026-11-22.ts'])paths.push([`scripts/${s}`,`scripts/${s}`]);
const get=async(repoPath:string,ref='main')=>{const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_get_file_content',args:{...repo,repoPath,ref}});assert(r.ok,repoPath);return await r.json() as any;};
const before=JSON.parse(await readFile(`${dir}/reconciliation.json`,'utf8')).backupDirectory;
for(const [p,f] of paths.slice(0,11)){
 const live=await get(p),expectedFile=p==='bundle.js'||p==='public/bundle.js'?'deploy/src/bundle.js':f;
 const expected=await readFile(`${before}/${expectedFile}`);assert.equal(live.sha,createHash('sha1').update(`blob ${expected.length}\0`).update(expected).digest('hex'),`Concurrent remote change ${p}`);
}
const protectedPaths=['netlify.toml','src/App.tsx','src/utils/emailBuilder.ts','src/utils/upcomingLeave.ts','src/components/StaffAccess.tsx','netlify/functions/staff-session.ts','scripts/internal_practitioner_guard.ts','scripts/crm_alerts.ts','scripts/crm_leave_approvals.ts'];
const protectedShas=await Promise.all(protectedPaths.map(async path=>({path,sha:(await get(path)).sha})));
assert.equal((await get('netlify.toml')).content,await readFile(`${root}/deploy/netlify.toml`,'utf8'));
const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_push_to_branch',args:{...repo,branch:'main',commitMessage:'data: weekly approved internal practitioner CRM sync 22 November',files:paths.map(([repoPath,f])=>({repoPath,localPath:`${root}/${f}`}))}});assert(r.ok);
const result:any=await r.json();await writeFile(`${dir}/github_push_result.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
const verified=await Promise.all(paths.map(async([p,f])=>{const x=await get(p,result.commit.sha),b=await readFile(`${root}/${f}`),sha=createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');assert.equal(x.sha,sha,p);return {path:p,sha};}));
await Promise.all(protectedShas.map(async x=>assert.equal((await get(x.path,result.commit.sha)).sha,x.sha,x.path)));
await writeFile(`${dir}/github_verified.json`,JSON.stringify({verified,protectedShas},null,2));console.log({published:verified.length,protected:protectedShas.length});
