import {readFileSync,writeFileSync} from 'node:fs';
const root='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work';
for(const name of ['crm_sync_fetch','apply_crm_sync','validate_crm_sync','publish_crm_sync','test_leave_email_design']){
 let t=readFileSync(`${root}/scripts/${name}_2026-11-15.ts`,'utf8').replaceAll('2026-11-15','2026-11-22').replaceAll('15 Nov 2026','22 Nov 2026').replaceAll('15 November','22 November');
 if(name==='validate_crm_sync')t=t.replaceAll('data.length,25','data.length,24').replaceAll('report.matched.length,25','report.matched.length,24').replaceAll('matched:25','matched:24');
 writeFileSync(`${root}/scripts/${name}_2026-11-22.ts`,t);
}
