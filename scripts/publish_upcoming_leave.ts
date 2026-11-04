import {invokeTool} from '@tasklet/tools/v2';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/upcoming_leave_2026-11-04`,repo={owner:'annapsychologycare',repo:'-practitioner-availability'};
const read=async(f:string)=>JSON.parse(await readFile(f,'utf8'));
const result=await read(`${dir}/sync_result.json`);
const paths:Array<[string,string]> = [];
for(const f of result.codePaths){assert.equal(await readFile(`${root}/apps/practitioner-availability/${f}`,'utf8'),await readFile(`${root}/deploy/src/${f}`,'utf8'));paths.push([`src/${f}`,`deploy/src/${f}`],[`apps/practitioner-availability/${f}`,`apps/practitioner-availability/${f}`]);}
paths.push(['src/practitioners_data.json','practitioners_data.json'],['practitioners_data.json','deploy/practitioners_data.json'],['public/practitioners_data.json','deploy/public/practitioners_data.json'],['netlify/functions/practitioners-data.json','deploy/netlify/functions/practitioners-data.json'],['src/practitionersData.ts','deploy/src/practitionersData.ts'],['practitionersData.ts','deploy/src/practitionersData.ts'],['apps/practitioner-availability/practitionersData.ts','apps/practitioner-availability/practitionersData.ts'],['bundle.js','deploy/src/bundle.js'],['src/bundle.js','deploy/src/bundle.js'],['public/bundle.js','deploy/src/bundle.js'],['apps/practitioner-availability/bundle.js','apps/practitioner-availability/bundle.js']);
for(const f of ['crm_alerts.ts','crm_upcoming_leave.ts','crm_leave_approvals.ts','practitioner_intake_pause.ts'])paths.push([`scripts/${f}`,`scripts/${f}`],[`src/${f}`,`deploy/src/${f}`]);
for(const f of ['publish_daily_availability.ts','apply_crm_sync_2026-11-04.ts','test_upcoming_leave.ts','leave_notice_sync.ts','publish_upcoming_leave.ts'])paths.push([`scripts/${f}`,`scripts/${f}`]);
for(const f of ['zoho_sync_workflow.md','zanda_daily_sync_instructions.md','workflows/upcoming_leave_notices.md'])paths.push([f,f]);
assert(!paths.some(([p])=>p==='netlify.toml'||p.includes('fee-schedule')));
// Ensure deployed data has not changed since the import baseline, and no code
// paths changed concurrently since this feature's read-only GitHub snapshot.
for(const [repoPath] of paths.filter(([p])=>!p.includes('bundle')&&!p.startsWith('scripts/')&&!['src/crm_alerts.ts','src/crm_upcoming_leave.ts','src/practitioner_intake_pause.ts','zoho_sync_workflow.md','zanda_daily_sync_instructions.md','workflows/upcoming_leave_notices.md'].includes(p))){
 const baseline=await read(`${dir}/remote/${repoPath.replaceAll('/','__')}.json`);
 const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_get_file_content',args:{...repo,ref:'main',repoPath}});
 if(baseline.error){assert(!r.ok,`Concurrent creation ${repoPath}`);continue;}
 assert(r.ok,`GitHub missing ${repoPath}`);const live:any=await r.json();assert.equal(live.sha,baseline.sha,`Concurrent modification ${repoPath}`);
}
for(const [remote,local] of [['src/practitioners_data.json','practitioners_data.json'],['practitioners_data.json','deploy/practitioners_data.json'],['public/practitioners_data.json','deploy/public/practitioners_data.json'],['netlify/functions/practitioners-data.json','deploy/netlify/functions/practitioners-data.json']]){const baseline=await read(`${dir}/remote/${remote.replaceAll('/','__')}.json`);assert.deepEqual(JSON.parse(baseline.content),await read(`${dir}/before/${local}`),`Divergent original data ${remote}`);}
const config=await read(`${dir}/remote/netlify.toml.json`);assert.equal(config.content,await readFile(`${root}/deploy/netlify.toml`,'utf8'));
const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_push_to_branch',args:{...repo,branch:'main',commitMessage:'feat: approved CRM upcoming-leave notices with Melbourne date gating and send-time expiry',files:paths.map(([repoPath,f])=>({repoPath,localPath:`${root}/${f}`}))}});
if(!r.ok)throw Error(r.error);const published=await r.json();await writeFile(`${dir}/github_push_result.json`,JSON.stringify(published,null,2));await writeFile(`${dir}/published_paths.json`,JSON.stringify(paths,null,2));console.log(JSON.stringify(published));
