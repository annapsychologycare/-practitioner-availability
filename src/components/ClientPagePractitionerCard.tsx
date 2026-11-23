import React from 'react';
import type {ClientPreviewProfile} from '../utils/clientPagePreview';
interface Props {profile:ClientPreviewProfile;onSelect:(key:string)=>void;}
export const ClientPagePractitionerCard:React.FC<Props>=({profile:p,onSelect})=><article className="card bg-base-100 border border-base-300">
 <div className="card-body gap-4">
  <div className="flex items-center gap-3">{p.photo&&<img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer"/>}<div><h3 className="font-semibold text-lg">{p.name}</h3><p className="text-sm opacity-70">{p.title}</p></div></div>
  {p.bio&&<p className="text-sm whitespace-pre-line">{p.bio}</p>}
  {p.note&&<div className="bg-base-200 rounded-lg p-3 text-sm whitespace-pre-line">{p.note}</div>}
  <dl className="text-sm space-y-2">{p.fees&&<div><dt className="font-semibold">Fees</dt><dd className="whitespace-pre-line">{p.fees}</dd></div>}{p.rebate&&<div><dt className="font-semibold">Medicare rebate information</dt><dd className="whitespace-pre-line">{p.rebate}</dd><dd className="text-xs opacity-70">Eligibility and referral requirements apply; payment is not guaranteed.</dd></div>}</dl>
  {p.hours&&<div className="text-sm"><strong>Usual working hours</strong><p className="whitespace-pre-line">{p.hours}</p><p className="text-xs opacity-70">Not a list of available appointments.</p></div>}
  <div className="space-y-3"><h4 className="font-semibold text-sm">Appointment options</h4>{p.locations.map((loc,i)=><div key={i} className="text-sm"><strong>{loc.name}</strong>{loc.note&&<p className="whitespace-pre-line">{loc.note}</p>}{loc.lines.length?<ul className="list-disc pl-5 space-y-1">{loc.lines.map(line=><li key={line.id}>{line.text} <span className="opacity-70">({line.frequency})</span></li>)}</ul>:<p className="opacity-70">No appointment options listed. Ask our team about availability.</p>}</div>)}</div>
  {p.leave&&<div className="border border-base-300 rounded-lg p-3 text-sm"><strong>Upcoming leave</strong><p className="whitespace-pre-line">{p.leave}</p></div>}
  <div className="card-actions items-center justify-between mt-auto">{p.profile&&<a href={p.profile} target="_blank" rel="noopener noreferrer" className="link text-sm">Full profile</a>}<button type="button" className="btn btn-primary btn-sm" onClick={()=>onSelect(p.key)}>Choose / ask about this practitioner</button></div>
 </div>
</article>;
