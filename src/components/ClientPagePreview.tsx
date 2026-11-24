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
 return <div className="pc-client-page overflow-y-auto flex-1 min-h-0 space-y-5 p-1">
  <style>{`
   /* Colours sampled from Anna's supplied brand artwork. Scoped to this view. */
   .pc-client-page {color:#36454f;background:#fff; color-scheme:light;}
   .pc-client-page .pc-brand-hero {background:#f0ecf5;border-color:#ded6e8;border-top:4px solid #2b244c;}
   .pc-brand-logo {display:block;width:260px;max-width:75%;height:auto;object-fit:contain;margin:0 0 22px;}
   .pc-client-page h2,.pc-client-page h3 {color:#2b244c;}
   .pc-client-page h4 {color:#665779;}
   .pc-client-page .bg-base-100 {background:#fff;color:#36454f;}
   .pc-client-page .bg-base-200 {background:#f0ecf5;color:#36454f;}
   .pc-client-page .border-base-300 {border-color:#e1dce7;}
   .pc-client-page .text-base-content\\/60 {color:#65717a;}
   .pc-client-page .text-base-content\\/70 {color:#596771;}
   .pc-client-page .btn-primary {background:#2b244c;border-color:#2b244c;color:#fff;box-shadow:none;}
   .pc-client-page .btn-primary:hover {background:#433860;border-color:#433860;}
   .pc-client-page .btn-outline {color:#2b244c;border-color:#8d5273;background:#fff;}
   .pc-client-page .btn-outline:hover {background:#f0ecf5;}
   .pc-client-page .link {color:#76516c;text-underline-offset:3px;}
   .pc-client-page .badge {background:#f0ecf5;color:#514565;border-color:#d7ccdf;}
   .pc-client-page .alert {background:#f7f4f8;color:#36454f;border:1px solid #e1dce7;}
   .pc-client-page .select,.pc-client-page .textarea {background:#fff;color:#36454f;border-color:#c7bdcf;}
   .pc-client-page :is(button,a,select,textarea):focus-visible {outline:3px solid #8d5273;outline-offset:3px;}
   .pc-client-page .btn:disabled {background:#ece8ef;color:#706778;border-color:#ddd5e3;}
   .pc-options-grid {display:grid;grid-template-columns:minmax(0,1fr);gap:20px;}
   .pc-option-card {display:grid;grid-template-rows:auto auto auto auto 1fr auto auto;gap:18px;padding:24px;min-width:0;}
   .pc-option-card p {margin:0;}
   @media(min-width:900px){
    .pc-options-grid {grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px;row-gap:18px;}
    @supports(grid-template-rows:subgrid){.pc-option-card {grid-template-rows:subgrid;grid-row:span 7;}}
   }
   @media(max-width:540px){.pc-option-card {padding:18px;}}
  `}</style>
  <div className="alert text-sm"><span><strong>Staff test preview · real practitioner details.</strong> No private client link has been created. Test entries stay on this screen only; nothing is sent, saved, reserved or booked. Do not enter real client information.</span></div>
  <section className="pc-brand-hero rounded-2xl border border-base-300 p-6 space-y-3"><img src="/brand/psychologycare-logo.svg" alt="PsychologyCare" className="pc-brand-logo"/><h2 className="text-3xl font-semibold leading-tight">Your practitioner options</h2><p className="text-sm leading-relaxed max-w-3xl">Compare your options, request a preferred appointment or ask our team a question. Our team checks availability before confirming.</p><div className="flex flex-wrap gap-2"><span className="badge badge-outline">{profiles.length} practitioner{profiles.length===1?'':'s'} selected</span><span className="badge badge-outline">Requests only · not confirmed bookings</span></div><p className="text-xs text-base-content/60 leading-relaxed max-w-3xl">Times are Melbourne local time. These options come from the availability app, not a fresh live-diary check. Selecting a recurring option expresses a preference for that series; it does not book its individual dates.</p></section>
  {age60Plus&&profiles.some(p=>p.locations.some(l=>l.lines.length>0&&!/telehealth|online/i.test(l.name)&&/prahran|greville|183a|185a/i.test(l.name)))&&<div className="alert text-sm"><span>Our Prahran clinics at 183A and 185A Greville Street are upstairs, with approximately 18 stairs. Please let us know if stairs may be difficult so we can discuss suitable options.</span></div>}
  <div className="pc-options-grid">{profiles.map(p=><ClientPagePractitionerCard key={p.key} profile={p} onSelect={choose}/>)}</div>
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
