import React from 'react';
import type {ClientPreviewProfile} from '../utils/clientPagePreview';
interface Props {profile:ClientPreviewProfile;onSelect:(key:string)=>void;}
function money(value:string):string {
 return value.split(/\r?\n/).map(line=>/^\s*\$?\d+(?:\.\d{1,2})?\s*$/.test(line)?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(line.replace('$',''))):line).join('\n');
}
function feeLabel(value:string):string {return value.replace(/\bB\/H:/g,'Business hours:').replace(/\bA\/H:/g,'After hours:');}
export const ClientPagePractitionerCard:React.FC<Props>=({profile:p,onSelect})=><article className="pc-option-card card bg-base-100 border border-base-300 shadow-sm">
 <header className="flex items-center gap-4 border-b border-base-300 pb-4">
  {p.photo?<img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover border border-base-300 flex-shrink-0" referrerPolicy="no-referrer"/>:<span aria-hidden="true" className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center text-xl font-semibold flex-shrink-0">{p.name.charAt(0)}</span>}
  <div className="min-w-0"><h3 className="font-semibold text-xl leading-tight">{p.name}</h3><p className="text-sm text-base-content/70 pt-1">{p.title}</p></div>
 </header>
 <section className="space-y-3 text-sm leading-relaxed" aria-label={`About ${p.name}`}>
  <h4 className="text-xs font-semibold uppercase tracking-widest text-base-content/60">About</h4>
  <p className="whitespace-pre-line">{p.bio||'Please view the full profile or ask our team for more information.'}</p>
  {p.note&&<div className="bg-base-200 border border-base-300 rounded-lg p-3 whitespace-pre-line"><strong className="block pb-1">Please note</strong>{p.note}</div>}
 </section>
 <section className="bg-base-200 rounded-xl p-4 space-y-3 text-sm" aria-label={`Fees for ${p.name}`}>
  <h4 className="text-xs font-semibold uppercase tracking-widest text-base-content/60">Fees &amp; rebates</h4>
  <dl className="space-y-3">
   <div><dt className="font-semibold pb-1">Session fees</dt><dd className="whitespace-pre-line leading-relaxed">{p.fees?feeLabel(p.fees):'Please ask our team to confirm fees.'}</dd></div>
   <div className="border-t border-base-300 pt-3"><dt className="font-semibold pb-1">Medicare rebate information</dt><dd className="whitespace-pre-line">{p.rebate?money(p.rebate):'Please ask our team about eligibility.'}</dd><dd className="text-xs text-base-content/60 pt-1 leading-relaxed">Eligibility and referral requirements apply; payment is not guaranteed.</dd></div>
  </dl>
 </section>
 <section className="text-sm space-y-2 leading-relaxed">
  <h4 className="text-xs font-semibold uppercase tracking-widest text-base-content/60">Usual working hours</h4>
  <p className="whitespace-pre-line">{p.hours||'Please ask our team about usual working hours.'}</p>
  <p className="text-xs text-base-content/60">Working hours are not available appointment times.</p>
 </section>
 <section className="space-y-3 text-sm">
  <div className="space-y-1"><h4 className="text-xs font-semibold uppercase tracking-widest text-base-content/60">Appointment options</h4><p className="text-xs text-base-content/60">Melbourne time · subject to team confirmation</p></div>
  {p.locations.map((loc,i)=><div key={i} className="border border-base-300 rounded-lg p-3 space-y-2">
   <h5 className="font-semibold">{loc.name}</h5>
   {loc.note&&<p className="whitespace-pre-line leading-relaxed">{loc.note}</p>}
   {loc.lines.length?<ul className="space-y-2">{loc.lines.map(line=><li key={line.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-base-300 pt-2"><span className="flex-1 min-w-0 leading-relaxed">{line.text}</span><span className="badge badge-ghost badge-sm capitalize flex-shrink-0">{line.frequency}</span></li>)}</ul>:<p className="text-xs text-base-content/60 leading-relaxed">No appointment options listed. Ask our team about availability.</p>}
  </div>)}
  {!p.locations.length&&<p className="text-base-content/60">Ask our team about availability.</p>}
 </section>
 <div>{p.leave&&<aside className="bg-base-200 rounded-lg p-3 text-sm leading-relaxed"><strong className="block pb-1">Upcoming leave</strong><p className="whitespace-pre-line">{p.leave}</p></aside>}</div>
 <footer className="flex flex-col gap-3 border-t border-base-300 pt-4">
  <button type="button" className="btn btn-primary w-full" onClick={()=>onSelect(p.key)}>Choose / ask about this practitioner</button>
  {p.profile&&<a href={p.profile} target="_blank" rel="noopener noreferrer" className="link text-sm text-center">View full profile ↗</a>}
 </footer>
</article>;
