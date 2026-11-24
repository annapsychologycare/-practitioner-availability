import React from 'react';
import type {WaitlistPreference} from '../utils/clientPreferenceState';
interface Props {name:string;value?:WaitlistPreference;onChange:(field:'days'|'times',value:string)=>void;}
export function ClientWaitlistFields({name,value,onChange}:Props){
 return <div className="pc-waitlist-fields"><p className="pc-small">Let us know which days and times you'd like to be considered for with {name}. These are preferences, not currently available appointments.</p><label className="pc-field">Preferred days<input type="text" aria-label={`Preferred waitlist days for ${name}`} maxLength={300} value={value?.days||''} onChange={e=>onChange('days',e.target.value)} placeholder="e.g. Mondays or Thursdays"/></label><label className="pc-field">Preferred times<input type="text" aria-label={`Preferred waitlist times for ${name}`} maxLength={300} value={value?.times||''} onChange={e=>onChange('times',e.target.value)} placeholder="e.g. mornings before 11am, or after 4pm"/></label><p className="pc-small">Our intake team would review your waitlist request and contact you about suitable openings. This test does not add you to a waitlist or reserve an appointment.</p></div>;
}
