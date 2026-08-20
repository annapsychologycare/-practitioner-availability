/**
 * Zanda API Availability Importer
 * Fetches pending availability appointments from tomorrow for the next 6 weeks (Melbourne time)
 * and updates practitioners_data.json + practitionersData.ts
 *
 * Usage: bun -i import_availability_api.ts
 * Returns: JSON summary on stdout
 */

import { invokeTool } from '@tasklet/tools/v2';
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';

const MELB_TZ = 'Australia/Melbourne';
const BASE = 'https://zandaapi.zandahealth.com';
const HEADERS = { 'Accept': 'application/vnd.zandaapi+json', 'X-Time-Zone': MELB_TZ };

// Dummy client IDs → frequency type
const AVAILABILITY_CLIENTS: Record<number, string> = {
  14412599: 'Weekly',
  14412603: 'Fortnightly',
  14435289: 'Monthly',
};

// File paths
const MASTER_JSON = '/tasklet/agent/home/practitioners_data.json';
const TASKLET_TS = '/tasklet/agent/home/apps/practitioner-availability/practitionersData.ts';
const DEPLOY_TS = '/tasklet/agent/home/deploy/src/practitionersData.ts';
const META = '/tasklet/agent/home/apps/practitioner-availability/availability_meta.json';
const AUDIT_LOG = '/tasklet/agent/home/audit_log.json';
const BACKUP_DIR = '/tasklet/agent/home/backups';

// ─── Name mapping (Zanda API name → App display name) ──────────────────────
const NAME_MAP: Record<string, string> = {
  'Christine Deftereos': 'Dr Christine Deftereos',
  'Dr. Maddie Brygel': 'Dr Maddie Brygel',
  'Maddie Brygel': 'Dr Maddie Brygel',
  'Krista De Castella': 'Dr Krista De Castella',
  'Dr. Krista De Castella': 'Dr Krista De Castella',
  'David Spektor': 'Dr David Spektor',
  'Dr. David Spektor': 'Dr David Spektor',
  'Niloofar Danaei': 'Niloo Danaei',
  'Niloofar': 'Niloo Danaei',
  'Niloo': 'Niloo Danaei',
  'Josh Kugel': 'Joshua Kugel',
  'Therese van Maanen': 'Therese Van Maanen',
  'Megan Edelman': 'Meg Edelman',
  'Megan': 'Meg Edelman',
  'Rebekah': 'Rebekah Barson',
  'Bek Barson': 'Rebekah Barson',
};

// ─── Location mapping (Zanda → App display name) ───────────────────────────
function mapLocation(apiLocation: string, practitionerName: string): string | null {
  const loc = apiLocation.toLowerCase();
  // Amy Bortz: ONLINE CONSULTATION → Burke Rd, Camberwell (not Telehealth)
  if (practitionerName === 'Amy Bortz' && loc.includes('online')) {
    return 'Burke Rd, Camberwell';
  }
  // Nicholas Kleeman: ONLINE CONSULTATION → Greville St, Prahran (not Telehealth)
  if (practitionerName === 'Nicholas Kleeman' && loc.includes('online')) {
    return 'Greville St, Prahran';
  }
  if (loc.includes('online') || loc.includes('telehealth')) return 'Telehealth';
  if (loc.includes('183a greville') || loc.includes('185a greville') || loc.includes('greville')) {
    return 'Greville St, Prahran';
  }
  if (loc.includes('burke') || loc.includes('camberwell')) return 'Burke Rd, Camberwell';
  if (loc.includes('victoria') || loc.includes('st kilda')) return 'Victoria St, St Kilda';
  if (loc.includes('phone')) return null; // skip phone calls
  if (loc.includes('home visit')) return null; // skip home visits
  return apiLocation; // return as-is if unknown
}

// ─── Name resolution ────────────────────────────────────────────────────────
function resolveName(apiName: string, appNames: Set<string>): string {
  // Direct map
  if (NAME_MAP[apiName]) return NAME_MAP[apiName];
  // Exact match in app
  if (appNames.has(apiName)) return apiName;
  // "Dr. X Y" → "Dr X Y"
  const noPeriod = apiName.replace('Dr. ', 'Dr ');
  if (appNames.has(noPeriod)) return noPeriod;
  if (NAME_MAP[noPeriod]) return NAME_MAP[noPeriod];
  // First name match
  const first = apiName.split(' ')[0];
  if (NAME_MAP[first]) return NAME_MAP[first];
  // Partial: find app name that starts with first name
  for (const appName of appNames) {
    if (appName.startsWith(first + ' ') || appName.endsWith(' ' + apiName.split(' ').slice(-1)[0])) {
      return appName;
    }
  }
  return apiName; // unresolved
}

// ─── Date helpers ───────────────────────────────────────────────────────────
function toMelbDateTimeStr(d: Date): string {
  // Returns "yyyy-MM-ddTHH:mm:ss" in Melbourne time
  return d.toLocaleString('sv-SE', { timeZone: MELB_TZ }).replace(' ', 'T');
}

function melbNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: MELB_TZ }));
}

const DAY_NAMES: Record<number, string> = {
  0: 'Sundays', 1: 'Mondays', 2: 'Tuesdays', 3: 'Wednesdays',
  4: 'Thursdays', 5: 'Fridays', 6: 'Saturdays',
};

function ordinal(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function formatDate(dateStr: string): string {
  // dateStr = "2026-07-30"
  const d = new Date(dateStr + 'T00:00:00');
  return `${ordinal(d.getUTCDate())} ${d.toLocaleString('en-AU', { month: 'short', timeZone: 'UTC' })}`;
}

function parseTime(timeStr: string): { hour: number; minute: number; display: string } {
  // timeStr = "08:00:00"
  const [h, m] = timeStr.split(':').map(Number);
  let display: string;
  if (h === 0) display = '12am';
  else if (h < 12) display = m ? `${h}:${String(m).padStart(2, '0')}am` : `${h}am`;
  else if (h === 12) display = m ? `12:${String(m).padStart(2, '0')}pm` : '12pm';
  else {
    const hh = h - 12;
    display = m ? `${hh}:${String(m).padStart(2, '0')}pm` : `${hh}pm`;
  }
  return { hour: h, minute: m, display };
}

function getDayOfWeek(dateStr: string): number {
  // Returns 0=Sun, 1=Mon, ..., 6=Sat in Melbourne time
  const d = new Date(dateStr + 'T00:00:00');
  return d.getUTCDay(); // Since dateStr is already in Melbourne date, UTC day matches
}

// ─── API helpers ────────────────────────────────────────────────────────────
async function apiGet(path: string): Promise<any> {
  const r = await invokeTool({
    toolName: 'remote_http_call',
    connectionId: 'conn_xv49yqpd5marmz16g37p',
    args: { url: BASE + path, method: 'GET', extraHeaders: HEADERS },
  });
  if (!r.ok) throw new Error(`API error: ${r.error}`);
  const raw = await r.json();
  return raw.body ?? raw;
}

async function fetchAllForClient(clientId: number, dateFrom: string, dateTo: string): Promise<any[]> {
  const items: any[] = [];
  let cursor = '';
  while (true) {
    const qs = new URLSearchParams({
      clientId: String(clientId),
      dateFrom,
      dateTo,
      pageSize: '100',
      ...(cursor ? { cursor } : {}),
    });
    const res = await apiGet(`/api/v1/appointments?${qs}`);
    const batch = (res.items ?? []).map((i: any) => i.data ?? i);
    items.push(...batch);
    if (!res.hasNextPage) break;
    cursor = res.nextCursor ?? '';
    if (!cursor) break;
  }
  return items;
}

// ─── Main ───────────────────────────────────────────────────────────────────
const now = new Date();
// Use Melbourne date as base so "tomorrow" means tomorrow in Melbourne time
const melbDateStr = new Date().toLocaleDateString('en-CA', { timeZone: MELB_TZ }); // YYYY-MM-DD
const melbToday = new Date(melbDateStr + 'T00:00:00'); // midnight local
const tomorrow = new Date(melbToday);
tomorrow.setDate(tomorrow.getDate() + 1); // start from next day (exclude today)
const sixWeeksOut = new Date(tomorrow);
sixWeeksOut.setDate(sixWeeksOut.getDate() + 42); // 6 weeks out from tomorrow
sixWeeksOut.setHours(23, 59, 59, 0);

const dateFrom = toMelbDateTimeStr(tomorrow);
const dateTo = toMelbDateTimeStr(sixWeeksOut);

console.error(`Fetching appointments from ${dateFrom} to ${dateTo} (Melbourne time)...`);

// 1. Backup
if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
const backupTs = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
copyFileSync(MASTER_JSON, `${BACKUP_DIR}/practitioners_data_backup_${backupTs}.json`);
console.error(`Backup saved: practitioners_data_backup_${backupTs}.json`);

// 2. Fetch availability appointments
const allAppointments: any[] = [];
for (const [clientId, freqType] of Object.entries(AVAILABILITY_CLIENTS)) {
  console.error(`Fetching ${freqType} appointments (client ${clientId})...`);
  const appts = await fetchAllForClient(Number(clientId), dateFrom, dateTo);
  console.error(`  → ${appts.length} appointments found`);
  for (const a of appts) {
    allAppointments.push({ ...a, _freqType: freqType });
  }
}

console.error(`Total raw appointments: ${allAppointments.length}`);

// 3. Filter to Pending + active only; apply per-practitioner exclusions
const pending = allAppointments.filter(a => {
  if (a.attendanceState !== 'Pending' || a.isActive === false) return false;
  // David Spektor: exclude Monthly availability
  const pracName = a.practitioner?.name ?? '';
  if ((pracName === 'David Spektor' || pracName === 'Dr. David Spektor' || pracName === 'Dr David Spektor') && a._freqType === 'Monthly') return false;
  return true;
});
console.error(`Pending appointments: ${pending.length}`);

// 4. Load practitioners
const practitioners: any[] = JSON.parse(readFileSync(MASTER_JSON, 'utf8'));
const appNames = new Set(practitioners.map((p: any) => p.name));

// 5. Build slot data: Map<pracName, Map<location, Map<freqType, Map<dayName, {display: string, date: string}[]>>>>
// We want the earliest occurrence per (prac, loc, freq, day, time)
type SlotKey = string; // "day|time"
type SlotInfo = { display: string; date: string };
type SlotMap = Map<SlotKey, SlotInfo>;
type LocMap = Map<string, Map<string, SlotMap>>; // loc → freq → slots

const pracData: Map<string, LocMap> = new Map();
const unmatched = new Set<string>();

for (const appt of pending) {
  const apiPracName = appt.practitioner?.name ?? '';
  if (!apiPracName) continue;

  const pracName = resolveName(apiPracName, appNames);
  if (!appNames.has(pracName)) {
    unmatched.add(apiPracName);
    continue;
  }

  const apiLoc = appt.location?.name ?? '';
  const location = mapLocation(apiLoc, pracName);
  if (!location) continue; // skip phone/home

  const freq: string = appt._freqType;

  const dayIdx = getDayOfWeek(appt.date);
  const dayName = DAY_NAMES[dayIdx];
  const { display: timeDisplay } = parseTime(appt.startAt);
  const dateLabel = formatDate(appt.date);

  const slotKey = `${dayName}|${timeDisplay}`;

  if (!pracData.has(pracName)) pracData.set(pracName, new Map());
  const locMap = pracData.get(pracName)!;

  if (!locMap.has(location)) locMap.set(location, new Map());
  const freqMap = locMap.get(location)!;

  if (!freqMap.has(freq)) freqMap.set(freq, new Map());
  const slotMap = freqMap.get(freq)!;

  // Keep earliest date for this slot
  if (!slotMap.has(slotKey)) {
    slotMap.set(slotKey, { display: timeDisplay, date: appt.date });
  } else {
    const existing = slotMap.get(slotKey)!;
    if (appt.date < existing.date) {
      slotMap.set(slotKey, { display: timeDisplay, date: appt.date });
    }
  }
}

// 6. Apply to practitioners_data.json
const matched = new Set<string>();
const pracByName: Record<string, any> = {};
for (const p of practitioners) pracByName[p.name] = p;

// Reset all availability first
for (const p of practitioners) {
  p.availability = [];
  for (const loc of (p.locations ?? [])) {
    loc.availability = '';
  }
}

const summarySlots: string[] = [];

for (const [pracName, locMap] of pracData) {
  matched.add(pracName);
  const p = pracByName[pracName];
  if (!p) continue;

  // Build location lookup
  const existingLocs: Record<string, any> = {};
  for (const loc of (p.locations ?? [])) {
    const key = loc.location ?? loc.name ?? '';
    existingLocs[key] = loc;
    loc.availability = ''; // reset
  }

  const topAvail: string[] = [];

  for (const [locName, freqMap] of locMap) {
    // Ensure location exists
    if (!existingLocs[locName]) {
      const newLoc = { location: locName, availability: '' };
      p.locations = p.locations ?? [];
      p.locations.push(newLoc);
      existingLocs[locName] = newLoc;
    }

    const locObj = existingLocs[locName];
    const lines: string[] = [];

    for (const freq of ['Weekly', 'Fortnightly', 'Monthly'] as const) {
      const slotMap = freqMap.get(freq);
      if (!slotMap) continue;

      for (const [slotKey, info] of slotMap) {
        const [dayName, timeDisplay] = slotKey.split('|');
        const dateLabel = formatDate(info.date);
        const line = `${dayName} at ${timeDisplay} (${freq}: Starting ${dateLabel})`;
        lines.push(line);
        topAvail.push(`${line} — ${locName}`);
        summarySlots.push(`  ${pracName} | ${locName} | ${line}`);
      }
    }

    locObj.availability = lines.join('\n');
  }

  p.availability = topAvail;
}

// 7. Write updated files
const melbNowStr = now.toLocaleString('en-AU', {
  timeZone: MELB_TZ,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}).replace(',', '').replace(' at', ' at').replace(' am', 'am').replace(' pm', 'pm');

writeFileSync(MASTER_JSON, JSON.stringify(practitioners, null, 2));

const tsContent =
  `export const PRACTITIONERS_DATA = ${JSON.stringify(practitioners, null, 2)};\n` +
  `export const practitionersData = PRACTITIONERS_DATA;\n` +
  `export const AVAILABILITY_LAST_UPDATED = "${melbNowStr}";\n`;

writeFileSync(TASKLET_TS, tsContent);
writeFileSync(DEPLOY_TS, tsContent);
writeFileSync(META, JSON.stringify({ last_updated: melbNowStr }));

// 8. Audit log
let audit: any[] = [];
try { audit = JSON.parse(readFileSync(AUDIT_LOG, 'utf8')); } catch {}
audit.unshift({
  timestamp: new Date().toISOString(),
  action: 'api_availability_import',
  matched: [...matched],
  unmatched: [...unmatched],
  totalSlots: summarySlots.length,
  dateRange: `${dateFrom} to ${dateTo}`,
});
if (audit.length > 100) audit = audit.slice(0, 100);
writeFileSync(AUDIT_LOG, JSON.stringify(audit, null, 2));

// 9. Output summary
const summary = {
  ok: true,
  timestamp: melbNowStr,
  dateRange: { from: dateFrom, to: dateTo },
  totalAppointmentsFetched: allAppointments.length,
  pendingFiltered: pending.length,
  matched: [...matched].sort(),
  unmatched: [...unmatched],
  totalSlots: summarySlots.length,
  slots: summarySlots,
};

console.log(JSON.stringify(summary, null, 2));
