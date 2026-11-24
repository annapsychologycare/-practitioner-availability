/** Conservative client display helpers. No clinical/internal record is returned. */
export interface FeeRate { label: string; fee: number; rebate: number | null; outOfPocket: number | null }
export interface FeeSummary {
 currency: 'AUD'; rates: FeeRate[]; rebate: number | null;
 rebateStatus: 'amount-listed' | 'not-eligible' | 'unknown'; notes: string[];
}
export interface SlotFee { amount: number; rebate: number | null; outOfPocket: number | null; currency: 'AUD' }
export interface ApprovedFeeArrangement { businessHours?: number; afterHours?: number; standard?: number; approved: boolean }
export interface PreviewSlot {
 id: string; text: string; frequency: 'weekly' | 'fortnightly' | 'monthly'; selectable: boolean;
 day: string | null; dayIndex: number | null; time: string | null; timeMinutes: number | null;
 commencement: string | null; commencementLabel: string | null; location: string;
 fee: SlotFee | null; warnings: string[];
}
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function approvedList(value: unknown): string[] {
 // Arrays and explicit delimited lists only; do not mine biographies for claims.
 const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[;\n]/) : [];
 return [...new Set(values.filter((x): x is string => typeof x === 'string').map(x => x.trim()).filter(Boolean))];
}

/** Explicit client-service age_range only. Never call with a practitioner's age. */
export function clientServiceAgeRange(value: unknown): string | null {
 const list = approvedList(value);
 if (!list.length) return null;
 const ages = list.map(text => /^(\d{1,3})\s*(?:yrs?|years?)?\s*\+$/i.exec(text));
 if (ages.some(match=>!match || Number(match[1]) > 120)) return null;
 // Multiple overlapping open-ended service ranges are their explicit union.
 return `${Math.min(...ages.map(match=>Number(match![1])))}+`;
}

export function summariseClientFees(fees: string, rebateText: string): FeeSummary {
 const rebateMatch = /^\$?(\d+(?:\.\d{1,2})?)$/.exec((rebateText || '').trim());
 const explicitNone = /^(?:no (?:medicare )?rebate(?: available)?|not eligible(?: for (?:a )?(?:medicare )?rebate)?|n\/?a)$/i.test((rebateText || '').trim());
 const listed = rebateMatch ? Number(rebateMatch[1]) : null;
 // Zero alone does not establish Medicare eligibility or entitlement.
 const rebate = explicitNone ? 0 : listed !== null && listed > 0 ? listed : null;
 const rebateStatus: FeeSummary['rebateStatus'] = explicitNone ? 'not-eligible' : rebate !== null ? 'amount-listed' : 'unknown';
 const rates: FeeRate[] = [];
 for (const line of (fees || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
  const m = /^(?:(B\/H|A\/H|Business Hours|After Hours)\s*:\s*)?\$?(\d+(?:\.\d{1,2})?)$/i.exec(line);
  if (!m) continue;
  const fee = Number(m[2]);
  const label = !m[1] ? 'Standard fee' : /^(B\/H|Business Hours)$/i.test(m[1]) ? 'Business hours' : 'After hours';
  rates.push({label, fee, rebate, outOfPocket: rebateStatus === 'amount-listed' && rebate !== null && rebate <= fee ? Math.round((fee - rebate) * 100) / 100 : null});
 }
 const notes = ['Listed standard individual-session fees only; please confirm any individual fee arrangement with the practice.',
  'Medicare rebates and estimated out-of-pocket costs depend on eligibility and an applicable referral.'];
 if (rates.some(r => r.label !== 'Standard fee')) notes.push('Please confirm the fee for your chosen appointment with the practice.');
 if (listed === 0 || explicitNone) notes.push('No Medicare out-of-pocket estimate is available; please confirm your rebate eligibility.');
 if (rebate !== null && rates.some(r => r.fee < rebate)) notes.push('Please confirm the applicable rebate and fee with the practice.');
 const simpleLines = (fees || '').split(/\r?\n/).filter(s => s.trim());
 if (simpleLines.length !== rates.length) notes.push('Additional fee conditions apply; please see the full fee information.');
 if (!rates.length) notes.push('Please contact the practice to confirm your fee.');
 return {currency:'AUD', rates, rebate, rebateStatus, notes};
}

/** Session-local explicit approval only; no new fee categories or timing policy. */
export function applyApprovedFeeArrangement(fees: string, rebateText: string, arrangement?: ApprovedFeeArrangement): {fees: string; summary: FeeSummary} {
 let applied = false;
 const updated = arrangement?.approved === true ? (fees || '').split(/\r?\n/).map(line => {
  const m = /^(\s*(?:(B\/H|A\/H|Business Hours|After Hours)\s*:\s*)?)\$?(\d+(?:\.\d{1,2})?)(\s*)$/i.exec(line);
  if (!m) return line;
  const value = !m[2] ? arrangement.standard : /^(B\/H|Business Hours)$/i.test(m[2]) ? arrangement.businessHours : arrangement.afterHours;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || Math.round(value * 100) / 100 !== value) return line;
  applied = true;
  return `${m[1]}$${value.toFixed(2)}${m[4]}`;
 }).join('\n') : fees;
 const summary = summariseClientFees(updated, rebateText);
 if (applied) {
  summary.notes = summary.notes.filter(note => !note.startsWith('Listed standard individual-session fees only;'));
  summary.notes.unshift('An approved individual fee arrangement is reflected above.');
 }
 return {fees:updated, summary};
}

export function structuredSlot(text: string, frequency: PreviewSlot['frequency'], id: string, location: string,
 summary: FeeSummary, window: {from: string; to: string}): PreviewSlot {
 const warnings: string[] = [];
 // Require a complete day/time prefix. General prose mentioning a day/time is not a choice.
 const match = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)s?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?=\s|$)/i.exec(text);
 let day: string | null = null, dayIndex: number | null = null, time: string | null = null, timeMinutes: number | null = null;
 if (match) {
  dayIndex = DAYS.findIndex(d => d.toLowerCase() === match[1].toLowerCase()); day = DAYS[dayIndex];
  const hour = Number(match[2]), minute = Number(match[3] || 0), meridiem = match[4]?.toLowerCase();
  if (minute < 60 && (meridiem ? hour >= 1 && hour <= 12 : !!match[3] && hour <= 23)) {
   timeMinutes = (meridiem ? hour % 12 + (meridiem === 'pm' ? 12 : 0) : hour) * 60 + minute;
   const h = Math.floor(timeMinutes / 60);
   time = `${h % 12 || 12}:${String(minute).padStart(2,'0')} ${h >= 12 ? 'pm' : 'am'}`;
  }
 }
 const from = /(?:·\s*from|Starting)\s+([^\)]+)\)?\s*$/i.exec(text)?.[1]?.trim();
 let commencement: string | null = null, commencementLabel: string | null = null;
 if (from) {
  const m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?$/.exec(from);
  if (m) {
   const month = MONTHS.findIndex(v => v.toLowerCase() === m[2].slice(0,3).toLowerCase());
   const start = window.from.slice(0,10), end = window.to.slice(0,10);
   const validWindow = /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && start <= end;
   const years = m[3] ? [Number(m[3])] : validWindow && Number(end.slice(0,4)) - Number(start.slice(0,4)) <= 2
    ? Array.from({length:Number(end.slice(0,4)) - Number(start.slice(0,4)) + 1}, (_, i) => Number(start.slice(0,4)) + i) : [];
   const candidates = years.flatMap(year => {
    const date = new Date(Date.UTC(year, month, Number(m[1])));
    if (month < 0 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== Number(m[1])) return [];
    const iso = date.toISOString().slice(0,10);
    if (!m[3] && (!validWindow || iso < start || iso > end)) return [];
    return [iso];
   });
   if (candidates.length === 1) {
    commencement = candidates[0];
    commencementLabel = `${Number(m[1])} ${MONTHS[month]} ${commencement.slice(0,4)}`;
    if (!m[3]) warnings.push('Commencement year resolved uniquely from the source import window, not explicitly supplied in the slot text.');
    const actualDay = (new Date(`${commencement}T00:00:00Z`).getUTCDay() + 6) % 7;
    if (dayIndex !== null && dayIndex !== actualDay) {warnings.push('Commencement date conflicts with the stated weekday; confirm with the practice.'); commencement = null; commencementLabel = null;}
   }
  }
  if (!commencement) warnings.push('Commencement date/year is unknown or ambiguous; confirm with the practice.');
 } else warnings.push('Commencement date is not supplied.');
 const selectable = dayIndex !== null && timeMinutes !== null && (!from || commencement !== null)
  && !/\b(?:no|not|unavailable|cancelled|paused|supervision|only|except)\b/i.test(text);
 // No universal after-hours/weekend rule is assumed, including for Saturdays.
 const rate = summary.rates.length === 1 && summary.rates[0].label === 'Standard fee'
  && !summary.notes.some(n => n.startsWith('Additional')) ? summary.rates[0] : null;
 const fee: SlotFee | null = selectable && rate ? {amount:rate.fee, rebate:rate.rebate,outOfPocket:rate.outOfPocket,currency:'AUD'} : null;
 if (selectable && !fee) warnings.push('Applicable slot fee is not confirmed; timing/weekend policy or fee conditions are unavailable.');
 return {id,text,frequency,selectable,day,dayIndex,time,timeMinutes,commencement,commencementLabel,location,fee,warnings};
}

export function comparePreviewSlots(a: PreviewSlot,b: PreviewSlot): number {
 return (a.dayIndex ?? 7) - (b.dayIndex ?? 7) || (a.timeMinutes ?? 1440) - (b.timeMinutes ?? 1440)
  || (a.commencement ?? '9999').localeCompare(b.commencement ?? '9999') || a.frequency.localeCompare(b.frequency) || a.id.localeCompare(b.id);
}
