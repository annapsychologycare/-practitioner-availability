// Server-only policy. Never import this module or private store into client code.
export const SITE_ORIGIN = 'https://pc-prac-availability.netlify.app';
export const ANNA_ID = '62034e21-7b19-4dd4-b092-20fe230108bf';
export const ANNA_EMAIL = 'anna@psychologycare.com.au';
export const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Netlify-CDN-Cache-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vary': 'Cookie, Authorization',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};
export function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}
export function allowedStaff(user: any): boolean {
  return !!user && user.id === ANNA_ID && user.email === ANNA_EMAIL &&
    !!user.confirmedAt && Array.isArray(user.roles) && user.roles.includes('staff-age');
}
export function productionRequest(req: Request, enabled = process.env.STAFF_PRIVATE_ACCESS_ENABLED): boolean {
  return enabled === 'true' && new URL(req.url).origin === SITE_ORIGIN;
}
export function melbourneDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export type AgeSnapshot = { asOfDay: string; ages: { id: string; age: number }[] };
// Complete replacement, including empty ages, is intentional: blank DOB clears.
export function validateSnapshot(input: any, knownIds: Set<string>, today = melbourneDay()): AgeSnapshot {
  if (!input || Object.keys(input).sort().join(',') !== 'ages,asOfDay' || input.asOfDay !== today || !Array.isArray(input.ages) || input.ages.length > knownIds.size) throw Error('Invalid snapshot');
  const seen = new Set<string>();
  for (const x of input.ages) {
    if (!x || Object.keys(x).sort().join(',') !== 'age,id' || !knownIds.has(x.id) || seen.has(x.id) || !Number.isInteger(x.age) || x.age < 18 || x.age > 110) throw Error('Invalid snapshot');
    seen.add(x.id);
  }
  return { asOfDay: input.asOfDay, ages: input.ages.map((x: any) => ({ id: x.id, age: x.age })) };
}
