import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {AVAILABILITY_IMPORT_WINDOW} from '../apps/practitioner-availability/practitionersData';
import {buildEmailHtml} from '../apps/practitioner-availability/utils/emailBuilder';
const b='/tasklet/threads/a_cwa98xzh47ey9rcvmmh4/work',read=(p:string)=>readFileSync(`${b}/${p}`,'utf8');
test('all shared policy mirrors byte-identical; consumed fetch and guard paths use policy',()=>{
  for(const p of ['apps/practitioner-availability/utils/availabilityHorizon.ts','deploy/src/utils/availabilityHorizon.ts','deploy/src/availability_horizon.ts'])expect(read(p)).toBe(read('scripts/availability_horizon.ts'));
  expect(read('deploy/src/import_availability_api.ts')).toBe(read('scripts/import_availability_api.ts'));
  for(const p of ['scripts/import_availability_api.ts','apps/practitioner-availability/AdHocAvailabilityTab.tsx','deploy/src/AdHocAvailabilityTab.tsx']){
    expect(read(p)).toContain('availabilityHorizon(');expect(read(p)).not.toMatch(/\+\s*56|addDays\(today,\s*56\)|next 8 weeks/);
  }
  for(const p of ['scripts/publish_daily_availability.ts','scripts/validate_availability_refresh.ts'])expect(read(p)).toContain('assertAvailabilityWindow(result.dateRange)');
  for(const p of ['scripts/apply_crm_sync_2026-11-08.ts','scripts/apply_crm_sync_2026-11-15.ts'])expect(read(p)).toContain('${windowExport}');
});
test('both active and standalone roots tick at midnight, reset child selections and label source cache separately',()=>{
  for(const p of ['deploy/src/App.tsx','deploy/src/app.tsx','apps/practitioner-availability/app.tsx']){
    const s=read(p);expect(s).toContain('useAvailabilityPolicy()');expect(s).toContain('applyCachedHorizon(');expect(s).toContain('key={policy.today}');expect(s).toContain('{policy.description}');
  }
  expect(read('deploy/src/Compare.tsx')).toContain('applyCachedHorizon(');
  for(const p of ['apps/practitioner-availability/utils/useAvailabilityPolicy.ts','deploy/src/utils/useAvailabilityPolicy.ts']){
    const s=read(p);expect(s).toContain('setInterval(update,1000)');expect(s).toContain("'focus'");expect(s).toContain('Cached source window:');
  }
});
test('client preview regeneration across policy boundary cannot copy incompatible cached slots or incorrectly trigger Prahran stairs',()=>{
  const expanded=AVAILABILITY_IMPORT_WINDOW.days===84;
  const p={name:'Fixture',title:'',fees:'',medicare_rebate:'',link_to_bio:'',client_note:'PROFILE_NOTE_RETAIN',availabilityLocations:[{location:'Prahran',availability:'Mondays at 9am (Weekly: Starting 1st Feb) STALE_SLOT_SENTINEL'}]};
  const before=buildEmailHtml('Test','','Staff',[p],undefined,false,{age60Plus:true},new Date(expanded?'2026-12-31T12:59:59Z':'2026-11-22T12:59:59Z'));
  const after=buildEmailHtml('Test','','Staff',[p],undefined,false,{age60Plus:true},new Date(expanded?'2026-12-31T13:00:00Z':'2026-11-22T13:00:00Z'));
  expect(before).toContain('STALE_SLOT_SENTINEL');expect(after).not.toContain('STALE_SLOT_SENTINEL');expect(after).toContain('PROFILE_NOTE_RETAIN');
  expect(before).toContain('Please note: stairs at our Prahran clinics');expect(after).not.toContain('Please note: stairs at our Prahran clinics');
});
