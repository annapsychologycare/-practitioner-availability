// Anna's temporary app-only pause, 14 October 2026. CRM remains untouched.
// To unpause: set false, synchronize this file with src/utils/practitionerIntakePause.ts,
// then refresh from CRM and review the confirmed-slot override before deployment.
export const KRISTA_INTAKE_PAUSED = true;
export function isKristaIntakePaused(name?:string): boolean {
  return KRISTA_INTAKE_PAUSED && (name??'').replace(/^Dr\.?\s+/i,'').trim().toLowerCase()==='krista de castella';
}
export function suppressKristaIntake<T extends Record<string,any>>(original:T):T {
  if(!isKristaIntakePaused(original.name??original.Full_Name))return original;
  const p:any={...original,alert:'',client_note:'',working_hours:'',location_notes:{},availability:[],weekly_availability:[],fortnightly_availability:[],confirmed_slots:[],requires_diary_verification:false,intake_availability_notes_paused:true,availability_source:'PAUSED BY ANNA — app availability and notes withheld; CRM preserved (14 October 2026)'};
  if(Array.isArray(original.locations))p.locations=original.locations.map((l:any)=>({...l,availability:'',weekly_availability:[],fortnightly_availability:[],...(Object.hasOwn(l,'notes')?{notes:''}:{})}));
  if(Array.isArray(original.availabilityLocations))p.availabilityLocations=original.availabilityLocations.map((l:any)=>({...l,availability:''}));
  if(Object.hasOwn(original,'supervision_availability'))p.supervision_availability=[];
  return p;
}
export function applyIntakePauses(practitioners:any[]):void {
  for(let i=0;i<practitioners.length;i++)practitioners[i]=suppressKristaIntake(practitioners[i]);
}
