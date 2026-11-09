import {invokeTool} from '@tasklet/tools/v2';
import approved from './internal_practitioners.json';
// Reviewed existing internal membership only. No automatic discovery or name-only admission.
export const INTERNAL_ACCOUNT_ID='50438000000218064';
export const INTERNAL_FIELDS='id,Full_Name,First_Name,Last_Name,Account_Name,Directory_category,Education,Religions_Groups_I_have_a_strong_understanding,Clinical_Interests,Modalities,Bio,Short_Bio,Pronouns,Client_Types,Ages,Languages_I_am_fluent_in,Style_of_Therapy,Modality,Intake_Alert_Notes_Internal,Intake_Alert_Notes,Upcoming_leave_client_notice,Show_notice_from,Hide_notice_after,Fee_Schedule';
const ids=new Set(approved.map(p=>p.id));
export function isInternalPractitioner(c:any):boolean {
 return ids.has(c?.id)&&Object.hasOwn(c,'Directory_category')&&!c.Directory_category&&(c.Account_Name?.id===INTERNAL_ACCOUNT_ID||c.id==='50438000007973001');
}
export function assertInternalAppMembership(data:any[]):void {
 if(data.length!==approved.length||new Set(data.map(p=>p.name)).size!==approved.length||!approved.every(p=>data.some(x=>x.name===p.name)))throw Error('Internal practitioner membership changed; explicit review required');
}
export async function fetchInternalPractitioners():Promise<any[]> {
 const r=await invokeTool({connectionId:'conn_pdkvmnzjcqdeb3ha13wc',toolName:'zoho_crm-list-objects',args:{module:'Contacts',ids:approved.map(p=>p.id).join(','),fields:INTERNAL_FIELDS,perPage:'200',page:'1'}});
 if(!r.ok)throw Error(r.error);const x:any=await r.json(),y=x.result??x;
 if(!Array.isArray(y.data)||y.info?.more_records||y.data.length!==approved.length||new Set(y.data.map((c:any)=>c.id)).size!==approved.length||!y.data.every(isInternalPractitioner))throw Error('Internal CRM membership/category/account guard failed');
 return y.data;
}
