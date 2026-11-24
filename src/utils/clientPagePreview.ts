import {parseAvailability, type PractitionerEmailData} from './emailBuilder';
import {activeUpcomingLeave} from './upcomingLeave';
import {applyCachedHorizon} from './availabilityHorizon';
import {AVAILABILITY_IMPORT_WINDOW, PRACTITIONERS_DATA} from '../practitionersData';
import {suppressKristaIntake} from './practitionerIntakePause';
import {approvedList, clientServiceAgeRange, applyApprovedFeeArrangement, structuredSlot, comparePreviewSlots, type ApprovedFeeArrangement} from './clientPreviewMatching';

// Explicit projection: never spread a Practitioner or expose internal alerts/ages.
export function clientPreviewProfiles(input: PractitionerEmailData[], includeMonthly: boolean, now: Date, feeArrangements?: Record<string, ApprovedFeeArrangement>) {
 return input.map(p=>applyCachedHorizon(suppressKristaIntake(p),AVAILABILITY_IMPORT_WINDOW,now)).map((p,index)=>{
  // A unique exact-name match only. Never merge records using partial/fuzzy names.
  const sources = PRACTITIONERS_DATA.filter(source => source.name === p.name);
  const source = sources.length === 1 ? sources[0] : undefined;
  const dataWarnings: string[] = [];
  if (!source) dataWarnings.push('Approved service attributes unavailable: no unique source record match.');
  const arrangement = feeArrangements && Object.prototype.hasOwnProperty.call(feeArrangements,p.name) ? feeArrangements[p.name] : undefined;
  const appliedFees = applyApprovedFeeArrangement(p.fees,p.medicare_rebate,arrangement);
  const feeSummary = appliedFees.summary;
  if (feeSummary.rates.some(rate=>rate.label !== 'Standard fee')) dataWarnings.push('Slot fees unconfirmed: business/after-hours cutoffs and weekend fee policy are not supplied.');
  const locations = (p.availabilityLocations||[]).map((loc,li)=>{
   const parsed=parseAvailability(loc.availability,includeMonthly);
   const lines=(['weekly','fortnightly','monthly'] as const).flatMap(frequency=>parsed[frequency].map((text,si)=>
    structuredSlot(text,frequency,`${index}-${li}-${frequency}-${si}`,loc.location,feeSummary,AVAILABILITY_IMPORT_WINDOW)
   )).sort(comparePreviewSlots);
   return {name:loc.location,note:p.location_notes?.[loc.location]||'',lines};
  });
  const sourceLocations = source ? approvedList(source.locations.map(loc=>loc.location)) : [];
  const online = (s:string) => /\b(?:telehealth|online)\b/i.test(s);
  const sourceTelehealth: unknown = source && 'telehealth' in source ? source.telehealth : undefined;
  const explicitTelehealth = sourceTelehealth === true || /^(yes|true)$/i.test(String(sourceTelehealth));
  const explicitNoTelehealth = sourceTelehealth === false || /^(no|false)$/i.test(String(sourceTelehealth));
  const hasOnlineLocation = sourceLocations.some(online), hasPhysicalLocation = sourceLocations.some(l=>!online(l));
  const telehealth = hasOnlineLocation || explicitTelehealth ? true : explicitNoTelehealth ? false : null;
  // A closed, exclusively online source location list is source evidence of telehealth-only service;
  // no 'in-person only' claim is inferred merely from absence of a telehealth location.
  const telehealthOnly = sourceLocations.length > 0 && hasOnlineLocation && !hasPhysicalLocation ? true
   : hasPhysicalLocation ? false : null;
  const displayAttributes = [...sourceLocations.filter(l=>!online(l))];
  const clientAgeRange = source ? clientServiceAgeRange(source.age_range) : null;
  if (clientAgeRange) displayAttributes.push(`Clients ${clientAgeRange}`);
  if (telehealthOnly) displayAttributes.push('Telehealth only');
  else if (telehealth) displayAttributes.push('Telehealth');
  if (explicitNoTelehealth && hasPhysicalLocation) displayAttributes.push('In-person only');
  const hours = p.working_hours || '';
  if (/\bSaturdays?\b/i.test(source?.working_hours || '') || locations.some(l=>l.lines.some(s=>s.dayIndex===5))) displayAttributes.push('Saturday');
  if (!hours.trim()) dataWarnings.push('Working hours not supplied; availability must not be inferred from working hours.');
  if (p.name === 'Amy Bortz' && /Monday Mornings/i.test(hours) && locations.some(l=>l.lines.some(s=>s.dayIndex===0 && s.timeMinutes===780)))
   dataWarnings.push('Source conflict: Monday 1pm appointment is listed, but working hours say Monday mornings. Confirm with the practice.');
  if (locations.some(l=>l.lines.some(s=>s.warnings.some(w=>/unknown or ambiguous|conflicts/.test(w)))))
   dataWarnings.push('One or more commencement dates need confirmation; inspect slot warnings.');
  return {
   key:String(index), name:p.name, title:p.title, fees:appliedFees.fees, rebate:p.medicare_rebate,
   bio:p.short_bio||'', hours, note:p.client_note||'',
   leave:activeUpcomingLeave(p,now), photo:safePreviewUrl(p.photo_url), profile:safePreviewUrl(p.link_to_bio),
   locations, areasOfFocus:source ? approvedList(source.presentations) : [],
   approaches:source ? approvedList(source.modalities) : [], clientTypes:source ? approvedList(source.client_types) : [],
   attributes:{telehealth,telehealthOnly}, displayAttributes, clientAgeRange, feeSummary, dataWarnings,
  };
 });
}

export function safePreviewUrl(value?:string):string {
 if(!value)return '';
 // Only same-site asset paths or secure web links. No data/javascript URLs.
 if(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\'))return value;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}

export type ClientPreviewProfile=ReturnType<typeof clientPreviewProfiles>[number];
