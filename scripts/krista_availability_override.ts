// Anna-approved 14 October 2026. Zanda is GET-only: its diary flags are NOT edited.
// Two confirmed appointments, not a working-hours expansion. Do not generate gaps.
export const KRISTA_NAME = 'Dr Krista De Castella';
export function applyKristaAvailabilityOverride(practitioners: any[], fromDate = '2026-10-19'): string[] {
  const p = practitioners.find(p => p.name === KRISTA_NAME);
  if (!p) throw new Error('Krista override target missing');
  const anchor = new Date('2026-10-19T00:00:00Z');
  while (anchor.toISOString().slice(0,10) < fromDate.slice(0,10)) anchor.setUTCDate(anchor.getUTCDate()+14);
  const date = anchor.toISOString().slice(0,10);
  const n=anchor.getUTCDate();
  const suffix=n%100>=11 && n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]??'th');
  const label=`${n}${suffix} ${anchor.toLocaleString('en-AU',{month:'short',timeZone:'UTC'})} ${anchor.getUTCFullYear()}`;
  const lines = [`Mondays at 8:30am–10am (Fortnightly: Starting ${label})`, `Mondays at 12pm–1:30pm (Fortnightly: Starting ${label})`];
  p.client_types=['Individual']; p.clientTypes=['Individual']; p.accepts_couples=false;
  p.working_hours='Mondays 8:30am–2pm in person at Burke Rd, Camberwell; Tuesdays 9:30am–4:30pm via telehealth only. Working hours are not available appointment times.';
  p.confirmed_slots=[{day:'Monday',start:'08:30',end:'10:00'},{day:'Monday',start:'12:00',end:'13:30'}].map(s=>({...s,location:'Burke Rd, Camberwell',frequency:'Fortnightly',anchor_date:'2026-10-19',next_date:date,duration_minutes:90,buffer_after_minutes:15}));
  p.availability_source='Anna-approved confirmed-slot override (14 October 2026); Zanda diary changes pending';
  p.weekly_availability=[];p.fortnightly_availability=[];
  for (const l of p.locations??[]) {
    l.availability=l.location==='Burke Rd, Camberwell'?lines.join('\n'):'';
    l.weekly_availability=[];l.fortnightly_availability=[];
  }
  if (!p.locations?.some(l=>l.location==='Burke Rd, Camberwell')) throw new Error('Confirmed Camberwell location missing');
  p.availability=lines.map(l=>`${l} — Burke Rd, Camberwell`);
  return lines.map(l=>`  ${KRISTA_NAME} | Burke Rd, Camberwell | ${l}`);
}
