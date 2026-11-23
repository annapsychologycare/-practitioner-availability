import assert from 'node:assert/strict';
/** Preserve all existing location metadata; permit only source-evidenced availability-only additions. */
export function assertAvailabilityLocations(before:any[],after:any[],slots:string[]) {
 for(const p of after){
  const old=before.find(x=>x.name===p.name);assert(old,`Unknown practitioner ${p.name}`);
  const key=(l:any)=>l.location??l.name;
  const strip=({availability,...rest}:any)=>rest;
  assert.deepEqual(p.locations.slice(0,old.locations.length).map(strip),old.locations.map(strip),`${p.name}: existing location metadata`);
  const seen=new Set(old.locations.map(key));
  for(const l of p.locations.slice(old.locations.length)){
   assert.deepEqual(Object.keys(l).sort(),['availability','location']);
   assert(!seen.has(key(l)),`${p.name}: duplicate added location`);seen.add(key(l));
   assert.equal(typeof l.availability,'string');assert(l.availability.trim(),`${p.name}: empty added location`);
   const expected=slots.map(s=>s.trim().split(' | ')).filter(([n,loc])=>n===p.name&&loc===key(l)).map(x=>x[2]);
   assert(expected.length,`${p.name}: added location lacks fresh source summary`);
   assert.deepEqual(l.availability.split('\n'),expected,`${p.name}: added location differs from fresh source`);
  }
 }
}
