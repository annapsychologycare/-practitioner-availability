import {fetchInternalPractitioners, assertInternalAppMembership} from './internal_practitioner_guard';
import { isKristaIntakePaused, applyIntakePauses } from './practitioner_intake_pause';
import {mapCrmUpcomingLeave} from './crm_upcoming_leave';

export function mapCrmNotes(crm: any): {alert: string; client_note: string; [key: string]: string} {
  const leave = mapCrmUpcomingLeave(crm);
  if(isKristaIntakePaused(crm.Full_Name))return {alert:'',client_note:'',upcoming_leave_client_notice:'',upcoming_leave_show_from:'',upcoming_leave_hide_after:''};
  // CRM is authoritative, including blank fields. Never retain local notes.
  if (!Object.hasOwn(crm, 'Intake_Alert_Notes') || !Object.hasOwn(crm, 'Intake_Alert_Notes_Internal')) throw new Error('CRM note fields missing from record');
  return {
    ...leave,
    alert: typeof crm.Intake_Alert_Notes_Internal === 'string' ? crm.Intake_Alert_Notes_Internal.trim() : '',
    client_note: typeof crm.Intake_Alert_Notes === 'string' ? crm.Intake_Alert_Notes.trim() : '',
  };
}

const normalize = (s: string) => s.toLowerCase().replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/^nicholas burden$/, 'nick burden').replace(/^pete steele$/, 'peter steele');
export async function refreshCrmAlerts(practitioners: any[]): Promise<string[]> {
  assertInternalAppMembership(practitioners);
  const records = await fetchInternalPractitioners();
  const changed: string[] = [];
  applyIntakePauses(practitioners);
  for (const p of practitioners) {
    const matches = records.filter(r => normalize(r.Full_Name || '') === normalize(p.name));
    if (matches.length > 1) throw new Error(`Ambiguous CRM alert match for ${p.name}`);
    if (!matches.length) throw new Error(`No CRM note match for ${p.name}`);
    const notes = mapCrmNotes(matches[0]);
    if (Object.entries(notes).some(([key,value]) => value !== (p[key] || ''))) changed.push(p.name);
    Object.assign(p, notes);
  }
  return changed;
}
