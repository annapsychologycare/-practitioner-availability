import {test,expect} from 'bun:test';
import {assertAvailabilityLocations as guard} from './availability_profile_guard';
const before=[{name:'Test',locations:[{location:'Clinic',hours:'approved',availability:'old'}]}];
const after=[{name:'Test',locations:[{location:'Clinic',hours:'approved',availability:'new'},{location:'Telehealth',availability:'Tuesday slot'}]}];
const slots=['  Test | Telehealth | Tuesday slot'];
test('allows exact source-backed availability-only new location',()=>expect(()=>guard(before,after,slots)).not.toThrow());
test('rejects changed existing metadata',()=>{const x=structuredClone(after);x[0].locations[0].hours='invented';expect(()=>guard(before,x,slots)).toThrow();});
test('rejects unbacked, empty or enriched new location',()=>{
 expect(()=>guard(before,after,[])).toThrow();
 const x=structuredClone(after);x[0].locations[1].availability='';expect(()=>guard(before,x,slots)).toThrow();
 const y=structuredClone(after);y[0].locations[1].hours='invented';expect(()=>guard(before,y,slots)).toThrow();
});
