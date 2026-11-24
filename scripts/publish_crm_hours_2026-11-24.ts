import {invokeTool} from '@tasklet/tools/v2';
import {fetchInternalPractitioners,INTERNAL_FIELDS} from './internal_practitioner_guard';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',dir=`${root}/crm-hours-2026-11-24`,repo={owner:'annapsychologycare',repo:'-practitioner-availability'};
const paths=[['src/practitioners_data.json','deploy/src/practitioners_data.json'],['practitioners_data.json','deploy/practitioners_data.json'],['public/practitioners_data.json','deploy/public/practitioners_data.json'],['netlify/functions/practitioners-data.json','deploy/netlify/functions/practitioners-data.json'],['src/practitionersData.ts','deploy/src/practitionersData.ts'],['practitionersData.ts','deploy/src/practitionersData.ts'],['apps/practitioner-availability/practitionersData.ts','apps/practitioner-availability/practitionersData.ts'],['bundle.js','deploy/src/bundle.js'],['src/bundle.js','deploy/src/bundle.js'],['public/bundle.js','deploy/src/bundle.js'],['apps/practitioner-availability/bundle.js','apps/practitioner-availability/bundle.js']];
for(const f of ['crm_working_hours.ts','crm_alerts.ts','internal_practitioner_guard.ts','import_availability_api.ts'])for(const prefix of ['scripts','src'])paths.push([`${prefix}/${f}`,`${prefix==='src'?'deploy/src':'scripts'}/${f}`]);
for(const f of ['ManageAvailability.tsx','CRMSyncTab.tsx','app.tsx','utils/emailBuilder.ts'])for(const prefix of ['apps/practitioner-availability','src'])paths.push([`${prefix}/${f}`,`${prefix==='src'?'deploy/src':'apps/practitioner-availability'}/${f}`]);
for(const f of ['apply_crm_sync_2026-11-08.ts','publish_daily_availability.ts','validate_availability_refresh.ts','test_crm_working_hours.ts','apply_crm_hours_2026-11-24.ts','validate_crm_hours_2026-11-24.ts','publish_crm_hours_2026-11-24.ts'])paths.push([`scripts/${f}`,`scripts/${f}`]);
for(const f of ['zoho_sync_workflow.md','workflows/daily_availability_import.md'])paths.push([f,f]);
const get=async(repoPath:string,ref='main')=>{const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_get_file_content',args:{...repo,repoPath,ref}});if(!r.ok)return null;return await r.json() as any;};
const hash=(b:Buffer)=>createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const backup=JSON.parse(await readFile(`${dir}/reconciliation.json`,'utf8')).backupDirectory;
// Existing public datasets/bundles must still be exactly the source baseline.
await Promise.all(paths.slice(0,11).map(async([p,f])=>{const x=await get(p);assert(x,p);same(x.sha,hash(await readFile(`${backup}/${f}`)),`Concurrent data change: ${p}`);}));
function same(a:any,b:any,s:string){assert.equal(a,b,s);}
const protectedPaths=['netlify.toml','src/App.tsx','src/utils/upcomingLeave.ts','src/utils/practitionerIntakePause.ts','src/components/StaffAccess.tsx','netlify/functions/staff-session.ts','scripts/crm_leave_approvals.ts','scripts/internal_practitioners.json','src/utils/availabilityHorizon.ts'];
const baseline=await Promise.all([...new Set([...paths.map(x=>x[0]),...protectedPaths])].map(async p=>({path:p,sha:(await get(p))?.sha??null})));
await writeFile(`${dir}/remote-baseline.json`,JSON.stringify(baseline,null,2));
const fresh=await fetchInternalPractitioners(),prior=JSON.parse(await readFile(`${dir}/contacts.json`,'utf8')).result.data;
for(const c of fresh){const old=prior.find((x:any)=>x.id===c.id);for(const key of INTERNAL_FIELDS.split(','))assert.deepEqual(c[key],old[key],`CRM changed during run ${c.Full_Name}/${key}`);}
await writeFile(`${dir}/fresh-prepublish-check.json`,JSON.stringify({checked:new Date().toISOString(),count:fresh.length,allAllowlistedFieldsUnchanged:true},null,2));
for(const x of baseline)assert.equal((await get(x.path))?.sha??null,x.sha,`Remote concurrency: ${x.path}`);
const r=await invokeTool({connectionId:'conn_nvshm6rz3kzncg0nh4vk',toolName:'github_push_to_branch',args:{...repo,branch:'main',commitMessage:'sync: CRM-authoritative working hours and stable API-label audit',files:paths.map(([repoPath,f])=>({repoPath,localPath:`${root}/${f}`}))}});assert(r.ok);const result:any=await r.json();await writeFile(`${dir}/github_push_result.json`,JSON.stringify(result,null,2));console.log(result);
const verified=await Promise.all(paths.map(async([p,f])=>{const x=await get(p,result.commit.sha);assert.equal(x?.sha,hash(await readFile(`${root}/${f}`)),p);return {path:p,sha:x.sha};}));
for(const p of protectedPaths)assert.equal((await get(p,result.commit.sha)).sha,baseline.find(x=>x.path===p)?.sha,p);
await writeFile(`${dir}/github-verified.json`,JSON.stringify({verified,protectedPaths},null,2));console.log({published:verified.length,protected:protectedPaths.length});
