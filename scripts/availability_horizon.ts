/** Anna-authorized temporary horizon. Calendar arithmetic is Melbourne date-only,
 * independent of host/browser timezone and daylight-saving transitions. */
export const AVAILABILITY_TIME_ZONE = 'Australia/Melbourne';
export function melbourneDate(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', {timeZone: AVAILABILITY_TIME_ZONE});
}
export function addCalendarDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function availabilityHorizon(now: Date = new Date()) {
  const today = melbourneDate(now);
  const days = today >= '2026-11-23' && today <= '2026-12-31' ? 84 : 56;
  return {today, days, weeks: days / 7, label: `${days / 7}-week`,
    from: addCalendarDays(today, 1) + 'T00:00:00',
    to: addCalendarDays(today, days) + 'T23:59:59'};
}
export type ImportedAvailabilityWindow = {today: string; days: number; from: string; to: string};
/** Summary strings omit year and recurrence endings. Do NOT extrapolate or guess
 * dates from them. Fail closed on a policy change until a compatible import runs.
 * This is a view only; original cached/profile records are never mutated. */
export function cachedWindowCompatible(imported: ImportedAvailabilityWindow, now = new Date()): boolean {
  return imported.days === availabilityHorizon(now).days;
}
export function applyCachedHorizon<T>(original: T, imported: ImportedAvailabilityWindow, now = new Date()): T {
  if (cachedWindowCompatible(imported, now)) return original;
  const p: any = original;
  return {...p, availability: [], weekly_availability: [], fortnightly_availability: [], confirmed_slots: [],
    ...(p.availabilityLocations ? {availabilityLocations: p.availabilityLocations.map((l:any)=>({...l,availability:''}))} : {}),
    locations: (p.locations ?? []).map((l: any) => ({...l, availability: '', weekly_availability: [], fortnightly_availability: []}))};
}
export function assertAvailabilityWindow(range: {from: string; to: string}, now = new Date()) {
  const expected = availabilityHorizon(now);
  if (range.from !== expected.from || range.to !== expected.to) throw Error('Availability window does not match Melbourne date-aware horizon');
}
