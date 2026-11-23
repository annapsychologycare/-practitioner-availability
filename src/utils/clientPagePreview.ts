import {parseAvailability, type PractitionerEmailData} from './emailBuilder';
import {activeUpcomingLeave} from './upcomingLeave';
import {applyCachedHorizon} from './availabilityHorizon';
import {AVAILABILITY_IMPORT_WINDOW} from '../practitionersData';
import {suppressKristaIntake} from './practitionerIntakePause';

// Explicit projection: never spread a Practitioner or expose internal alerts/ages.
export function clientPreviewProfiles(input: PractitionerEmailData[], includeMonthly: boolean, now: Date) {
 return input.map(p=>applyCachedHorizon(suppressKristaIntake(p),AVAILABILITY_IMPORT_WINDOW,now)).map((p,index)=>({
  key:String(index), name:p.name, title:p.title, fees:p.fees, rebate:p.medicare_rebate,
  bio:p.short_bio||'', hours:p.working_hours||'', note:p.client_note||'',
  leave:activeUpcomingLeave(p,now), photo:safePreviewUrl(p.photo_url), profile:safePreviewUrl(p.link_to_bio),
  locations:(p.availabilityLocations||[]).map((loc,li)=>{
   const parsed=parseAvailability(loc.availability,includeMonthly);
   const lines=(['weekly','fortnightly','monthly'] as const).flatMap(frequency=>parsed[frequency].map((text,si)=>({
    id:`${index}-${li}-${frequency}-${si}`,text,frequency,
    // Do not turn working hours or general capacity notes into appointment choices.
    selectable:/\b(mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)s?\b/i.test(text)&&/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b/i.test(text),
   })));
   return {name:loc.location,note:p.location_notes?.[loc.location]||'',lines};
  }),
 }));
}

export function safePreviewUrl(value?:string):string {
 if(!value)return '';
 // Only same-site asset paths or secure web links. No data/javascript URLs.
 if(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\'))return value;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}

export type ClientPreviewProfile=ReturnType<typeof clientPreviewProfiles>[number];
