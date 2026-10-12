import { invokeTool } from '@tasklet/tools/v2';

export function mergeCrmAlert(current: string, crm: unknown): string {
  if (typeof crm !== 'string' || !crm.trim()) return current || '';
  const text = crm.trim();
  // Only explicit text AFTER | is approved for client emails.
  // Unmarked CRM notes remain internal; preserve any existing client banner.
  if (text.includes('|')) {
    const [internal, ...client] = text.split('|');
    const previousInternal = (current || '').split('|')[0].trim();
    return `${internal.trim() || previousInternal} | ${client.join('|').trim()}`.trim();
  }
  // Do not let an unmarked/older CRM note erase an existing app alert.
  return current || text;
}

const normalize = (s: string) => s.toLowerCase().replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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
    if (!matches.length) continue;
    const alert = mergeCrmAlert(p.alert || '', matches[0].Intake_Alert_Notes);
    if (alert !== (p.alert || '')) { p.alert = alert; changed.push(p.name); }
  }
  return changed;
}
