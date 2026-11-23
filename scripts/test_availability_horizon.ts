import {test, expect} from 'bun:test';
import {availabilityHorizon, applyCachedHorizon, cachedWindowCompatible, assertAvailabilityWindow} from './availability_horizon';
test('authorization and reversion boundaries use Melbourne calendar', () => {
  for (const [instant, today, days] of [
    ['2026-11-22T12:59:59Z','2026-11-22',56],
    ['2026-11-22T13:00:00Z','2026-11-23',84],
    ['2026-12-30T13:00:00Z','2026-12-31',84],
    ['2026-12-31T12:59:59Z','2026-12-31',84],
    ['2026-12-31T13:00:00Z','2027-01-01',56],
    ['2027-01-01T00:00:00+11:00','2027-01-01',56],
    ['2027-04-03T16:00:00Z','2027-04-04',56],
  ] as const) {
    const p=availabilityHorizon(new Date(instant)); expect(p.today).toBe(today);expect(p.days).toBe(days);expect(p.label).toBe(`${days/7}-week`);
  }
  expect(availabilityHorizon(new Date('2026-11-23T06:00:00+11:00'))).toMatchObject({from:'2026-11-24T00:00:00',to:'2027-02-15T23:59:59'});
  expect(availabilityHorizon(new Date('2026-12-31T06:00:00+11:00')).to).toBe('2027-03-25T23:59:59');
  expect(availabilityHorizon(new Date('2027-01-01T06:00:00+11:00')).to).toBe('2027-02-26T23:59:59');
});
test('stale expanded cache fails closed on Jan 1 without mutating profile or persisted data', () => {
  const imported=availabilityHorizon(new Date('2026-12-31T00:00:00Z'));
  const p={name:'Fixture',client_note:'retain',availability:['slot'],confirmed_slots:['slot'],locations:[{location:'Clinic',availability:'slot',hours:'retain'}]};
  expect(applyCachedHorizon(p,imported,new Date('2026-12-31T12:59:59Z'))).toBe(p);
  const filtered=applyCachedHorizon(p,imported,new Date('2026-12-31T13:00:00Z'));
  expect(filtered.availability).toEqual([]);expect(filtered.confirmed_slots).toEqual([]);expect(filtered.locations[0].availability).toBe('');
  expect(filtered.client_note).toBe('retain');expect(filtered.locations[0].hours).toBe('retain');expect(p.availability).toEqual(['slot']);
  expect(cachedWindowCompatible(imported,new Date('2027-01-01T00:00:00Z'))).toBe(false);
});
test('guards reject old fixed-56 window during expansion', () => {
  const now=new Date('2026-11-23T06:00:00+11:00'),p=availabilityHorizon(now);
  expect(()=>assertAvailabilityWindow(p,now)).not.toThrow();
  expect(()=>assertAvailabilityWindow({from:p.from,to:'2027-01-18T23:59:59'},now)).toThrow();
});
