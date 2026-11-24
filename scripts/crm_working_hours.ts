import approved from './internal_practitioners.json';
import {isKristaIntakePaused} from './practitioner_intake_pause';

// API names deliberately do not depend on editable CRM display labels.
export const WORKING_HOURS_FIELDS = [
  ['Availability','Camberwell'],
  ['Working_Days_and_Hours_185A_Greville_St','Greville St, Prahran'],
  ['Working_Days_and_Hours_Telehealth','Telehealth'],
] as const;
export function mapCrmWorkingHours(c:any):string|null {
  for(const [key] of WORKING_HOURS_FIELDS) {
    if(!Object.hasOwn(c,key))throw Error(`Missing CRM working-hours field ${key}`);
    if(c[key]!=null&&typeof c[key]!=='string')throw Error(`Invalid CRM hours ${key}`);
  }
  // The existing Anna-authorized pause overrides client-facing hours, not CRM.
  if(isKristaIntakePaused(c.Full_Name))return '';
  const entries=WORKING_HOURS_FIELDS.flatMap(([key,label])=>{
    const value=c[key]?.trim();return value?[`${label}: ${value}`]:[];
  });
  // All blank is not an instruction to erase previously approved hours.
  // Keep existing value pending explicit clarification, never invent a schedule.
  return entries.length?entries.join('\n'):null;
}
export function applyCrmWorkingHours(practitioners:any[],records:any[]) {
  const evidence:any[]=[];
  for(const p of practitioners){
    const membership=approved.find(m=>m.name===p.name);
    const found=records.filter(c=>c.id===membership?.id);
    if(found.length!==1)throw Error(`Unique approved CRM hours record required: ${p.name}`);
    const c=found[0],next=mapCrmWorkingHours(c),before=p.working_hours;
    if(next!==null)p.working_hours=next;
    evidence.push({name:p.name,id:c.id,status:isKristaIntakePaused(c.Full_Name)?'paused':next===null?'held_blank':'crm_authoritative',before,after:p.working_hours,source:Object.fromEntries(WORKING_HOURS_FIELDS.map(([key])=>[key,c[key]]))});
  }
  return evidence;
}
