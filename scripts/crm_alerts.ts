import { invokeTool } from '@tasklet/tools/v2';

export function mapCrmNotes(crm: any): {alert: string; client_note: string} {
  // CRM is authoritative, including blank fields. Never retain local notes.
  if (!Object.hasOwn(crm, 'Intake_Alert_Notes') || !Object.hasOwn(crm, 'Intake_Alert_Notes_Internal')) throw new Error('CRM note fields missing from record');
  return {
    alert: typeof crm.Intake_Alert_Notes_Internal === 'string' ? crm.Intake_Alert_Notes_Internal.trim() : '',
    client_note: typeof crm.Intake_Alert_Notes === 'string' ? crm.Intake_Alert_Notes.trim() : '',
  };
}

const normalize = (s: string) => s.toLowerCase().replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/^nicholas burden$/, 'nick burden').replace(/^pete steele$/, 'peter steele');
export async function refreshCrmAlerts(practitioners: any[]): Promise<string[]> {
  const r = await invokeTool({connectionId:'conn_pdkvmnzjcqdeb3ha13wc',toolName:'zoho_crm-search-objects',args:{
    module:'Contacts',criteria:'(Account_Name:equals:PsychologyCare)'
  }});
  if (!r.ok) throw new Error(`CRM alert refresh failed: ${r.error}`);
  const raw: any = await r.json(); const data = raw.result ?? raw;
  if (!Array.isArray(data.data) || data.info?.more_records === true) throw new Error('CRM alert search incomplete');
  const records: any[] = data.data;
  // Some account searches omit Josh; fetch his known practitioner record directly.
  if (!records.some(r => r.id === '50438000007973001')) {
    const j = await invokeTool({connectionId:'conn_pdkvmnzjcqdeb3ha13wc',toolName:'zoho_crm-get-object',args:{module:'Contacts',recordId:'50438000007973001'}});
    if (!j.ok) throw new Error(`Josh CRM alert refresh failed: ${j.error}`);
    const x: any = await j.json();
    const rows = (x.result ?? x).data;
    if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Josh CRM record missing');
    records.push(rows[0]);
  }
  const changed: string[] = [];
  for (const p of practitioners) {
    const matches = records.filter(r => normalize(r.Full_Name || '') === normalize(p.name));
    if (matches.length > 1) throw new Error(`Ambiguous CRM alert match for ${p.name}`);
    if (!matches.length) throw new Error(`No CRM note match for ${p.name}`);
    const notes = mapCrmNotes(matches[0]);
    if (notes.alert !== (p.alert || '') || notes.client_note !== (p.client_note || '')) changed.push(p.name);
    Object.assign(p, notes);
  }
  return changed;
}
