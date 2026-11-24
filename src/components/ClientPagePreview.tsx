import React,{useMemo,useState,useRef} from 'react';
import {type PractitionerEmailData} from '../utils/emailBuilder';
import {clientPreviewProfiles} from '../utils/clientPagePreview';
import {ClientPagePractitionerCard} from './ClientPagePractitionerCard';
interface Props {practitioners:PractitionerEmailData[];includeMonthly:boolean;age60Plus:boolean;now:Date;onBack:()=>void;}
export const ClientPagePreview:React.FC<Props>=({practitioners,includeMonthly,age60Plus,now,onBack})=>{
 const profiles=useMemo(()=>clientPreviewProfiles(practitioners,includeMonthly,now),[practitioners,includeMonthly,now]);
 const [chosen,setChosen]=useState<string[]>([]);const [times,setTimes]=useState<Record<string,string>>({});const [message,setMessage]=useState('');const [tested,setTested]=useState(false);
 const formRef=useRef<HTMLFormElement>(null);const messageRef=useRef<HTMLTextAreaElement>(null);
 const chosenProfiles=profiles.filter(p=>chosen.includes(p.key));
 function options(p:typeof profiles[number]){return p.locations.flatMap(loc=>loc.lines.filter(l=>l.selectable).map(l=>({...l,label:`${loc.name} · ${l.text} (${l.frequency})`})))}
 function choose(key:string){setChosen(previous=>previous.includes(key)?previous.filter(k=>k!==key):[...previous,key]);setTimes(previous=>{const next={...previous};delete next[key];return next;});setTested(false);}
 function ask(key:string){setChosen(previous=>previous.includes(key)?previous:[...previous,key]);setTested(false);formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});messageRef.current?.focus({preventScroll:true});}
 return <div className="pc-client-page overflow-y-auto flex-1 min-h-0 space-y-5 p-1">
  <style>{`
   /* Green-and-cream direction requested by Anna; original logo remains unaltered. */
   .pc-client-page {color:#263b31;background:#fcfbf8;color-scheme:light;}
   .pc-client-page .pc-brand-hero {background:#f1f2ea;border-color:#dce1d4;border-left:4px solid #496c40;}
   .pc-brand-logo {display:block;width:180px;max-width:65%;height:auto;object-fit:contain;margin:0 0 14px;}
   .pc-client-page h2,.pc-client-page h3 {color:#173b27;font-family:Georgia,'Times New Roman',serif;}
   .pc-client-page h4 {color:#3c5b38;}
   .pc-client-page .bg-base-100 {background:#fffefa;color:#263b31;}
   .pc-client-page .bg-base-200 {background:#eff2e9;color:#263b31;}
   .pc-client-page .border-base-300 {border-color:#dce1d4;}
   .pc-client-page .text-base-content\\/60 {color:#5c695f;}
   .pc-client-page .text-base-content\\/70 {color:#4e6053;}
   .pc-client-page .btn-primary {background:#496c40;border-color:#496c40;color:#fff;box-shadow:none;}
   .pc-client-page .btn-primary:hover {background:#35542d;border-color:#35542d;}
   .pc-client-page .btn-outline {color:#35542d;border-color:#739069;background:#fffefa;}
   .pc-client-page .btn-outline:hover {background:#edf1e7;}
   .pc-client-page .link {color:#3e6336;text-underline-offset:3px;}
   .pc-client-page .badge {background:#e8eddf;color:#35542d;border-color:#d6dfcd;}
   .pc-client-page .alert {background:#f0f2ea;color:#364b3d;border:1px solid #dce1d4;}
   .pc-client-page .select,.pc-client-page .textarea {background:#fffefa;color:#263b31;border-color:#aebea6;}
   .pc-client-page :is(button,a,select,textarea,input):focus-visible {outline:3px solid #739069;outline-offset:3px;}
   .pc-client-page .btn:disabled {background:#e8ebdf;color:#64715e;border-color:#d4dbc9;}
   .pc-client-page .pc-test-note {padding:9px 12px;font-size:11px;line-height:1.5;border-radius:10px;}
   .pc-client-page .pc-practitioner-note {font-size:12px;line-height:1.55;color:#4e6053;border-left:2px solid #a3b596;padding:5px 0 5px 10px;background:transparent;}
   .pc-client-page .pc-profession {display:inline-block;border-radius:20px;background:#e8eddf;padding:3px 10px;margin-top:7px;line-height:1.4;font-size:12px;}
   .pc-client-page .pc-option-selected {border-color:#496c40;box-shadow:0 0 0 1px #496c40;}
   .pc-fee-columns {display:grid;grid-template-columns:1fr 1fr;gap:18px;}
   .pc-fee-columns>div+div {border-left:1px solid #dce1d4;padding-left:18px;}
   .pc-fee-section {border-block:1px solid #e1e5da;padding-block:14px;}
   .pc-location-heading {background:#e8eddf;border-radius:5px;padding:5px 8px;}
   .pc-card-actions {display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:10px;}
   .pc-card-actions .btn {height:auto;min-height:40px;font-size:12px;line-height:1.4;padding:9px 10px;white-space:normal;}
   .pc-options-grid {display:grid;grid-template-columns:minmax(0,1fr);gap:20px;}
   .pc-option-card {display:grid;grid-template-rows:auto auto auto auto 1fr auto auto;gap:14px;padding:22px;min-width:0;}
   .pc-option-card p {margin:0;}
   @media(min-width:900px){
    .pc-options-grid {grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px;row-gap:18px;}
    @supports(grid-template-rows:subgrid){.pc-option-card {grid-template-rows:subgrid;grid-row:span 7;}}
   }
   @media(max-width:540px){.pc-option-card {padding:18px;}.pc-fee-columns {grid-template-columns:1fr;gap:12px;}.pc-fee-columns>div+div {border-left:0;border-top:1px solid #dce1d4;padding:12px 0 0;}.pc-card-actions {grid-template-columns:1fr;}}
  `}</style>
  <div className="pc-test-note alert"><span><strong>Staff test preview.</strong> No private client link exists. Entries stay on this screen only—nothing is saved, sent or booked. Please use fictional client information.</span></div>
  <section className="pc-brand-hero rounded-2xl border border-base-300 p-5 space-y-3"><img src="/brand/psychologycare-logo.svg" alt="PsychologyCare" className="pc-brand-logo"/><h2 className="text-3xl font-semibold leading-tight">Let’s find the right support for you</h2><p className="text-sm leading-relaxed max-w-3xl">Finding someone you feel comfortable with is an important first step. We’ve brought together these practitioner options for you to explore at your own pace.</p><p className="text-sm leading-relaxed max-w-3xl">Choose one or more practitioners you’d like to see, share your preferred times, or ask us a question. If you’re unsure, our team is here to help you decide.</p><div className="flex flex-wrap gap-2"><span className="badge badge-outline">{profiles.length} option{profiles.length===1?'':'s'} to explore</span><span className="badge badge-outline">You can choose more than one</span></div><p className="text-xs text-base-content/60 leading-relaxed max-w-3xl">All times are Melbourne time. Preferences are requests only, not reserved or confirmed bookings. Our team checks current availability before confirming.</p></section>
  {age60Plus&&profiles.some(p=>p.locations.some(l=>l.lines.length>0&&!/telehealth|online/i.test(l.name)&&/prahran|greville|183a|185a/i.test(l.name)))&&<div className="alert text-sm"><span>Our Prahran clinics at 183A and 185A Greville Street are upstairs, with approximately 18 stairs. Please let us know if stairs may be difficult so we can discuss suitable options.</span></div>}
  <div className="pc-options-grid">{profiles.map(p=><ClientPagePractitionerCard key={p.key} profile={p} selected={chosen.includes(p.key)} onSelect={choose} onAsk={ask}/>)}</div>
  {!profiles.length&&<p>No practitioners selected. Go back and choose your shortlist.</p>}
  <form ref={formRef} className="card bg-base-100 border border-base-300" onSubmit={e=>{e.preventDefault();setTested(true);}}><div className="card-body gap-4">
   <h3 className="font-semibold text-2xl">Your preferences &amp; questions</h3>
   <p className="text-sm leading-relaxed">You don’t need to have everything decided. Select any practitioners you’re interested in and we’ll help with the next steps.</p>
   <fieldset className="space-y-2"><legend className="font-semibold text-sm pb-2">Who would you like to see? <span className="font-normal">Choose one or more</span></legend>{profiles.map(p=><label key={p.key} className="flex items-center gap-3 border border-base-300 rounded-lg p-3 text-sm"><input type="checkbox" className="checkbox checkbox-sm" checked={chosen.includes(p.key)} onChange={()=>choose(p.key)}/><span>{p.name}</span></label>)}</fieldset>
   {chosenProfiles.map(p=><label key={p.key} className="flex flex-col gap-2 text-sm"><span className="font-semibold">Preferred option for {p.name}</span><select className="select select-bordered w-full" value={times[p.key]||''} onChange={e=>{const value=e.target.value;setTimes(previous=>({...previous,[p.key]:value}));setTested(false);}}><option value="">Not sure yet / please help me find a time</option>{options(p).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>)}
   <label className="flex flex-col gap-2 text-sm font-semibold">What would you like us to know?<textarea ref={messageRef} className="textarea textarea-bordered w-full font-normal" maxLength={1500} rows={3} placeholder="Sample text only—ask a question or share alternative preferences" value={message} onChange={e=>{setMessage(e.target.value);setTested(false);}}/></label>
   <p className="text-xs text-base-content/60 leading-relaxed">These options come from cached availability, not a live diary check. A recurring option is a preference for that series, not a booking for individual dates. Staff check Zanda and room availability where relevant before confirming. This is not a live or continuously monitored chat.</p>
   <button className="btn btn-primary self-start" disabled={!chosen.length&&!message.trim()}>Test request · do not send</button>
   {tested&&<div role="status" className="alert text-sm"><div><strong>Test only—nothing sent.</strong>{chosenProfiles.length?<ul className="space-y-2 pt-2">{chosenProfiles.map(p=><li key={p.key}><strong>{p.name}</strong><br/>{options(p).find(s=>s.id===times[p.key])?.label||'Please help me find a time'}</li>)}</ul>:<p>General question · no practitioner selected</p>}{message.trim()&&<p className="pt-2 whitespace-pre-wrap">Question: {message}</p>}</div></div>}
  </div></form>
  <button className="btn btn-outline" type="button" onClick={onBack}>Back to email setup</button>
 </div>;
};
