import React,{useMemo,useState} from 'react';
import {type PractitionerEmailData} from '../utils/emailBuilder';
import {clientPreviewProfiles} from '../utils/clientPagePreview';
import {ClientPagePractitionerCard} from './ClientPagePractitionerCard';
interface Props {practitioners:PractitionerEmailData[];includeMonthly:boolean;age60Plus:boolean;now:Date;onBack:()=>void;}
export const ClientPagePreview:React.FC<Props>=({practitioners,includeMonthly,age60Plus,now,onBack})=>{
 const profiles=useMemo(()=>clientPreviewProfiles(practitioners,includeMonthly,now),[practitioners,includeMonthly,now]);
 const [chosen,setChosen]=useState('');const [slot,setSlot]=useState('');const [message,setMessage]=useState('');const [tested,setTested]=useState(false);
 const current=profiles.find(p=>p.key===chosen);
 const slots=current?.locations.flatMap(loc=>loc.lines.filter(l=>l.selectable).map(l=>({...l,label:`${loc.name} · ${l.text} (${l.frequency})`})))||[];
 function choose(key:string){setChosen(key);setSlot('');setTested(false);}
 return <div className="overflow-y-auto flex-1 min-h-0 space-y-5 p-1">
  <div className="alert text-sm"><span><strong>Staff test preview · real practitioner details.</strong> No private client link has been created. Test entries stay on this screen only; nothing is sent, saved, reserved or booked. Do not enter real client information.</span></div>
  <section className="card bg-base-200"><div className="card-body gap-3"><span className="font-semibold tracking-wide">PsychologyCare</span><h2 className="text-2xl font-semibold">Your practitioner options</h2><p className="text-sm">Compare your options, request a preferred appointment or ask our team a question. Our team checks availability before confirming.</p><p className="text-xs opacity-70">Times are Melbourne local time. These options come from the availability app, not a fresh live-diary check. Selecting a recurring option expresses a preference for that series; it does not book its individual dates.</p></div></section>
  {age60Plus&&profiles.some(p=>p.locations.some(l=>l.lines.length>0&&!/telehealth|online/i.test(l.name)&&/prahran|greville|183a|185a/i.test(l.name)))&&<div className="alert text-sm"><span>Our Prahran clinics at 183A and 185A Greville Street are upstairs, with approximately 18 stairs. Please let us know if stairs may be difficult so we can discuss suitable options.</span></div>}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{profiles.map(p=><ClientPagePractitionerCard key={p.key} profile={p} onSelect={choose}/>)}</div>
  {!profiles.length&&<p>No practitioners selected. Go back and choose your shortlist.</p>}
  <form className="card bg-base-100 border border-base-300" onSubmit={e=>{e.preventDefault();setTested(true);}}><div className="card-body gap-4">
   <h3 className="font-semibold text-lg">Tell us your preference or ask a question</h3>
   <label className="flex flex-col gap-1 text-sm">Practitioner<select className="select select-bordered w-full" value={chosen} onChange={e=>choose(e.target.value)}><option value="">Not sure yet / general question</option>{profiles.map(p=><option key={p.key} value={p.key}>{p.name}</option>)}</select></label>
   <label className="flex flex-col gap-1 text-sm">Preferred appointment option<select className="select select-bordered w-full" value={slot} onChange={e=>{setSlot(e.target.value);setTested(false);}} disabled={!current}><option value="">Ask about availability / no time chosen</option>{slots.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
   <label className="flex flex-col gap-1 text-sm">Questions or alternative preferences<textarea className="textarea textarea-bordered w-full" maxLength={1500} rows={3} placeholder="Sample text only—no client details" value={message} onChange={e=>{setMessage(e.target.value);setTested(false);}}/></label>
   <p className="text-sm">A time selection is a request only and is not reserved. Staff check Zanda and room availability where relevant before confirming. This is not a live or continuously monitored chat.</p>
   <button className="btn btn-primary self-start" disabled={!slot&&!message.trim()}>Test request · do not send</button>
   {tested&&<div role="status" className="alert text-sm"><span><strong>Test only—nothing sent.</strong><br/>Practitioner: {current?.name||'Not sure / general question'}<br/>Preference: {slots.find(s=>s.id===slot)?.label||'No time chosen'}{message.trim()&&<span className="block whitespace-pre-wrap">Question: {message}</span>}</span></div>}
  </div></form>
  <button className="btn btn-outline" type="button" onClick={onBack}>Back to email setup</button>
 </div>;
};
