import { invokeTool } from '@tasklet/tools/v2';
import { readFile, writeFile } from 'node:fs/promises';

// ============================================================
// STEP 1: Fetch all CRM contacts for PsychologyCare
// ============================================================
console.log('Fetching CRM contacts...');
const searchResp = await invokeTool({
  toolName: 'zoho_crm-search-objects',
  connectionId: 'conn_pdkvmnzjcqdeb3ha13wc',
  args: {
    module: 'Contacts',
    criteria: 'Account_Name:equals:PsychologyCare',
  }
});

if (!searchResp.ok) {
  console.error('Error fetching CRM contacts:', searchResp.error);
  process.exit(1);
}

const crmResult = await searchResp.json() as any;
const crmContacts: any[] = crmResult?.result?.data || crmResult?.data || [];
console.log(`Fetched ${crmContacts.length} CRM contacts`);

// Save CRM snapshot
await writeFile('/tasklet/agent/home/crm_practitioners_snapshot.json', JSON.stringify(crmContacts, null, 2));
console.log('CRM snapshot saved');

// ============================================================
// STEP 1b: Fetch Fee Schedules
// ============================================================
console.log('Fetching fee schedules...');
const feeSchedResp = await invokeTool({
  toolName: 'zoho_crm-list-objects',
  connectionId: 'conn_pdkvmnzjcqdeb3ha13wc',
  args: { module: 'Fee_Schedules', pageSize: 50 }
});

const feeSchedMap = new Map<string, { bh: number; ah: number; rebate: number | null }>();
if (feeSchedResp.ok) {
  const fsData = await feeSchedResp.json() as any;
  const fsRecords: any[] = fsData?.result?.data || fsData?.data || [];
  for (const r of fsRecords) {
    feeSchedMap.set(r.id, {
      bh: r.Business_Hours_Fee,
      ah: r.After_Hours_Fee,
      rebate: r.Medicare_Rebate ?? null,
    });
  }
  console.log(`Fetched ${feeSchedMap.size} fee schedules`);
} else {
  console.warn('Could not fetch fee schedules:', feeSchedResp.error);
}

// ============================================================
// STEP 2: Read existing app data
// ============================================================
const appDataRaw = await readFile('/tasklet/agent/home/practitioners_data.json', 'utf8');
const appData = JSON.parse(appDataRaw) as any[];
console.log(`App has ${appData.length} practitioners`);

// ============================================================
// STEP 3: Name normalization helper
// ============================================================
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^(dr\.?\s+|mr\.?\s+|ms\.?\s+|mrs\.?\s+)/, '') // remove titles
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents (é→e, etc.)
    .trim();
}

// Build CRM lookup map
const crmByNorm = new Map<string, any>();
const NON_PRACTITIONERS = new Set(['anna donaldson', 'charlotte davenport', 'admin psychologycare']);

for (const c of crmContacts) {
  const fullName = (c.Full_Name || '').trim();
  if (!fullName) continue;
  
  // Skip non-practitioners
  const lc = fullName.toLowerCase();
  if (NON_PRACTITIONERS.has(lc) || lc.includes('- client') || lc.includes('admin')) continue;
  
  const norm = normalizeName(fullName);
  crmByNorm.set(norm, c);
  
  // Also index first+last separately
  const firstNorm = normalizeName((c.First_Name || '').trim());
  const lastNorm = normalizeName((c.Last_Name || '').trim());
  const firstLast = `${firstNorm} ${lastNorm}`.trim();
  if (firstLast !== norm) crmByNorm.set(firstLast, c);
}

// Add manual aliases
// Pete Steele → Peter Steele (app name)
const peteSteel = crmByNorm.get('pete steele');
if (peteSteel) crmByNorm.set('peter steele', peteSteel);

// Nicholas Burden → Nick Burden
const nickBurden = crmByNorm.get('nicholas burden');
if (nickBurden) crmByNorm.set('nick burden', nickBurden);

function findCrmContact(appName: string): any | null {
  const norm = normalizeName(appName);
  return crmByNorm.get(norm) || null;
}

// ============================================================
// STEP 4: Map CRM fields to app fields
// ============================================================

interface Change {
  field: string;
  old: any;
  newVal: any;
}

function mapCrmToApp(crm: any, existing: any, practName: string, feeMap?: Map<string, { bh: number; ah: number; rebate: number | null }>): { updated: any; changes: Change[] } {
  const changes: Change[] = [];
  const updated = { ...existing };

  function applyChange(field: string, newVal: any) {
    const oldVal = existing[field];
    // Serialize safely
    const oldStr = JSON.stringify(oldVal !== undefined ? oldVal : null);
    const newStr = JSON.stringify(newVal !== undefined ? newVal : null);
    if (oldStr === newStr) return;
    if (newVal === null || newVal === undefined) return;
    if (Array.isArray(newVal) && newVal.length === 0) return;
    if (typeof newVal === 'string' && newVal.trim() === '') return;
    updated[field] = newVal;
    changes.push({ field, old: oldVal, newVal });
  }

  // presentations ← Clinical_Interests
  if (Array.isArray(crm.Clinical_Interests) && crm.Clinical_Interests.length > 0) {
    applyChange('presentations', crm.Clinical_Interests);
  }

  // modalities ← Modalities
  if (Array.isArray(crm.Modalities) && crm.Modalities.length > 0) {
    // Normalise CRM EMDR label to app canonical form
    const normalisedModalities = crm.Modalities.map((m: string) =>
      m === 'EMDR (Eye Movement Desensitisation and Reprocessing)'
        ? 'Eye Movement Desensitisation and Reprocessing (EMDR)'
        : m
    );
    applyChange('modalities', normalisedModalities);
  }

  // bio ← Bio
  if (crm.Bio && typeof crm.Bio === 'string' && crm.Bio.trim()) {
    applyChange('bio', crm.Bio.trim());
  }

  // shortBio ← Short_Bio
  if (crm.Short_Bio && typeof crm.Short_Bio === 'string' && crm.Short_Bio.trim()) {
    applyChange('shortBio', crm.Short_Bio.trim());
  }

  // pronouns ← Pronouns
  if (crm.Pronouns && typeof crm.Pronouns === 'string' && crm.Pronouns.trim()) {
    applyChange('pronouns', crm.Pronouns.trim());
  }

  // languages ← Languages_I_am_fluent_in
  if (crm.Languages_I_am_fluent_in && typeof crm.Languages_I_am_fluent_in === 'string' && crm.Languages_I_am_fluent_in.trim()) {
    const langs = crm.Languages_I_am_fluent_in.split(/[,;]/).map((l: string) => l.trim()).filter(Boolean);
    if (langs.length > 0) applyChange('languages', langs);
  }

  // ageGroups ← Ages
  if (Array.isArray(crm.Ages) && crm.Ages.length > 0) {
    applyChange('ageGroups', crm.Ages);
  }

  // clientTypes ← Client_Types
  if (Array.isArray(crm.Client_Types) && crm.Client_Types.length > 0) {
    applyChange('clientTypes', crm.Client_Types);
  }

  // therapistType ← Modality[0] (skip Alex Barry per instructions)
  if (normalizeName(practName) !== 'alex barry') {
    if (Array.isArray(crm.Modality) && crm.Modality.length > 0) {
      applyChange('therapistType', crm.Modality[0]);
    }
  }

  // genderOfClientsSeen
  if (Array.isArray(crm.Gender_Identity_of_clients_I_like_to_see) && crm.Gender_Identity_of_clients_I_like_to_see.length > 0) {
    applyChange('genderOfClientsSeen', crm.Gender_Identity_of_clients_I_like_to_see);
  }

  // fees ← Fee_Schedule → Business_Hours_Fee / After_Hours_Fee
  if (feeMap && crm.Fee_Schedule?.id) {
    const sched = feeMap.get(crm.Fee_Schedule.id);
    if (sched && sched.bh && sched.ah) {
      const feesStr = `B/H: $${sched.bh}\nA/H: $${sched.ah}`;
      applyChange('fees', feesStr);
    }
  }

  // medicare_rebate ← Fee_Schedule → Medicare_Rebate
  if (feeMap && crm.Fee_Schedule?.id) {
    const sched = feeMap.get(crm.Fee_Schedule.id);
    if (sched && sched.rebate != null) {
      applyChange('medicare_rebate', String(sched.rebate));
    }
  }

  return { updated, changes };
}

// ============================================================
// STEP 5: Apply changes, collect report
// ============================================================

const DEPARTED = new Set(['oliver eastwood', 'jillian giannios', 'ella graj', 'stephanie stewart']);

interface ReportEntry {
  name: string;
  changes: Change[];
  anomalies: string[];
  crmFound: boolean;
  crmName?: string;
}

const report: ReportEntry[] = [];
const updatedAppData = [...appData];

for (let i = 0; i < updatedAppData.length; i++) {
  const prac = updatedAppData[i];
  const name = prac.name as string;
  
  if (DEPARTED.has(name.toLowerCase())) {
    report.push({ name, changes: [], anomalies: ['DEPARTED — skipped'], crmFound: false });
    continue;
  }

  const crm = findCrmContact(name);
  const anomalies: string[] = [];

  if (!crm) {
    report.push({ name, changes: [], anomalies: ['No matching CRM record found'], crmFound: false });
    continue;
  }

  // Anomaly checks
  if (normalizeName(name) === 'alex barry') {
    const crmTherapistType = Array.isArray(crm.Modality) ? crm.Modality[0] : crm.Modality;
    if (crmTherapistType && crmTherapistType.toLowerCase().includes('clinical psychologist')) {
      anomalies.push(`⚠️ CRM shows therapistType as "${crmTherapistType}" but app keeps "Psychologist" — NOT updating this field`);
    } else {
      anomalies.push(`ℹ️ CRM shows Alex Barry therapistType as "${crmTherapistType}" — not updating per instructions`);
    }
  }
  
  // Flag CRM typos
  if (Array.isArray(crm.Modality)) {
    for (const m of crm.Modality) {
      if (m.toLowerCase().includes('psycholoist')) {
        anomalies.push(`⚠️ CRM has TYPO in Modality field: "${m}" (should be "Psychologist")`);
      }
    }
  }

  const { updated, changes } = mapCrmToApp(crm, prac, name, feeSchedMap);
  
  if (false) { // placeholder to keep block structure
  }

  updatedAppData[i] = updated;
  report.push({ name, changes, anomalies, crmFound: true, crmName: crm.Full_Name });
}

// ============================================================
// STEP 6: Check for new practitioners in CRM not in app
// ============================================================
const appNormedNames = new Set(appData.map((p: any) => normalizeName(p.name)));
appNormedNames.add('peter steele'); // alias for Pete Steele

const newCrmContacts: string[] = [];
for (const c of crmContacts) {
  const fullName = (c.Full_Name || '').trim();
  const lc = fullName.toLowerCase();
  if (NON_PRACTITIONERS.has(lc) || lc.includes('- client') || lc.includes('admin')) continue;
  
  const norm = normalizeName(fullName);
  const isDeparted = DEPARTED.has(norm);
  const isInApp = appNormedNames.has(norm);
  
  if (!isInApp && !isDeparted) {
    newCrmContacts.push(fullName);
  }
}

// ============================================================
// STEP 7: Save updated app data
// ============================================================
await writeFile('/tasklet/agent/home/practitioners_data.json', JSON.stringify(updatedAppData, null, 2));
console.log('\n✅ Updated practitioners_data.json');

// Also update deploy copy
await writeFile('/tasklet/agent/home/deploy/public/practitioners_data.json', JSON.stringify(updatedAppData, null, 2));

// ============================================================
// STEP 8: Print report
// ============================================================
console.log('\n========== SYNC REPORT — 2 Aug 2026 ==========');
let totalChanges = 0;
const changedPractitioners: string[] = [];

for (const r of report) {
  if (r.changes.length > 0 || r.anomalies.length > 0) {
    console.log(`\n--- ${r.name} ---`);
    if (!r.crmFound) {
      console.log('  ❌ Not found in CRM');
    } else if (r.crmName && r.crmName !== r.name) {
      console.log(`  (CRM name: "${r.crmName}")`);
    }
    for (const c of r.changes) {
      const oldStr = JSON.stringify(c.old ?? null);
      const newStr = JSON.stringify(c.newVal ?? null);
      const oldTrunc = oldStr.length > 80 ? oldStr.slice(0, 80) + '...' : oldStr;
      const newTrunc = newStr.length > 80 ? newStr.slice(0, 80) + '...' : newStr;
      console.log(`  ✅ ${c.field}: ${oldTrunc} → ${newTrunc}`);
    }
    for (const a of r.anomalies) console.log(`  ${a}`);
    totalChanges += r.changes.length;
    if (r.changes.length > 0) changedPractitioners.push(r.name);
  }
}

if (newCrmContacts.length > 0) {
  console.log('\n⚠️ NEW CRM contacts not in app:');
  for (const n of newCrmContacts) console.log(`  - ${n}`);
}

console.log(`\n\nTotal field changes: ${totalChanges}`);
console.log('Practitioners with changes:', changedPractitioners.join(', ') || 'None');

// Save detailed report
await writeFile('/tasklet/agent/home/crm_sync_report_aug2026.json', JSON.stringify({ 
  syncDate: '2026-08-02',
  report, 
  newCrmContacts, 
  totalChanges,
  changedPractitioners
}, null, 2));
console.log('\nDetailed report saved to /tasklet/agent/home/crm_sync_report_aug2026.json');
