import React,{useMemo,useState,useRef} from 'react';
import {type PractitionerEmailData} from '../utils/emailBuilder';
import {clientPreviewProfiles} from '../utils/clientPagePreview';
import {ClientPagePractitionerCard} from './ClientPagePractitionerCard';
interface Props {practitioners:PractitionerEmailData[];includeMonthly:boolean;age60Plus:boolean;now:Date;onBack:()=>void;clientName?:string;}
export const ClientPagePreview:React.FC<Props>=({practitioners,includeMonthly,age60Plus,now,onBack,clientName=''})=>{
 const profiles=useMemo(()=>clientPreviewProfiles(practitioners,includeMonthly,now),[practitioners,includeMonthly,now]);
 const [chosen,setChosen]=useState<string[]>([]);const [times,setTimes]=useState<Record<string,string>>({});const [message,setMessage]=useState('');const [tested,setTested]=useState(false);
 const formRef=useRef<HTMLFormElement>(null);const messageRef=useRef<HTMLTextAreaElement>(null);
 const chosenProfiles=profiles.filter(p=>chosen.includes(p.key));
 function options(p:typeof profiles[number]){return p.locations.flatMap(loc=>loc.lines.filter(l=>l.selectable).map(l=>({...l,label:`${loc.name} · ${l.text} (${l.frequency})`})))}
 function choose(key:string){setChosen(previous=>previous.includes(key)?previous.filter(k=>k!==key):[...previous,key]);setTimes(previous=>{const next={...previous};delete next[key];return next;});setTested(false);}
 function ask(key:string){setChosen(previous=>previous.includes(key)?previous:[...previous,key]);setTested(false);formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});messageRef.current?.focus({preventScroll:true});}
 return <div className="pc-client-page overflow-y-auto flex-1 min-h-0 space-y-5 p-1">
  <style>{`
   /* GP-site-inspired lilac/white with restrained sage selection accents. */
   .pc-client-page {color:#36454f;background:linear-gradient(145deg,#f6f3fa 0%,#fff 58%);color-scheme:light;}
   .pc-client-page .pc-brand-hero {background:linear-gradient(120deg,#fff 0%,#f0ecf5 100%);border-color:#e1dbea;padding:32px;}
   .pc-brand-hero .pc-welcome-title {font-size:clamp(26px,3.2vw,34px);line-height:1.2;margin:0 0 14px;max-width:24ch;text-wrap:balance;}
   .pc-welcome-greeting {margin:0 0 10px;color:#645379;font-size:16px;line-height:1.6;font-weight:600;overflow-wrap:anywhere;}
   .pc-welcome-intro {font-size:15px;line-height:1.75;max-width:66ch;margin:0;}
   .pc-welcome-steps {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;list-style:none;padding:0;margin:24px 0 18px;counter-reset:welcome-step;}
   .pc-welcome-steps li {background:rgba(255,255,255,.8);border:1px solid #e7e1ee;border-radius:14px;padding:16px;counter-increment:welcome-step;}
   .pc-welcome-steps li::before {content:counter(welcome-step);display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#ede7f4;color:#51416e;font-size:12px;font-weight:700;margin-bottom:10px;}
   .pc-welcome-steps strong {display:block;color:#2b244c;font-size:14px;line-height:1.4;margin-bottom:6px;}
   .pc-welcome-steps p {font-size:13px;line-height:1.65;margin:0;}
   .pc-welcome-help {font-size:14px;line-height:1.65;margin:0 0 20px;}
   .pc-welcome-footer {display:flex;flex-wrap:wrap;align-items:flex-start;gap:12px 24px;border-top:1px solid #e1dbea;padding-top:16px;}
   .pc-welcome-count {flex-shrink:0;color:#51416e;font-size:13px;font-weight:600;line-height:1.7;}
   .pc-welcome-booking-note {flex:1 1 300px;font-size:12px;line-height:1.7;color:#59636f;margin:0;max-width:70ch;}
   @media(max-width:640px){.pc-client-page .pc-brand-hero {padding:24px 20px;}.pc-welcome-steps {grid-template-columns:1fr;gap:10px;margin-top:20px;}.pc-welcome-steps li {position:relative;padding:14px 14px 14px 54px;}.pc-welcome-steps li::before {position:absolute;left:14px;top:14px;margin:0;}}
   .pc-brand-logo {display:block;width:180px;max-width:65%;height:auto;object-fit:contain;margin:0 0 14px;}
   .pc-client-page h2,.pc-client-page h3 {color:#2b244c;font-family:Arial,Helvetica,sans-serif;letter-spacing:-.025em;}
   .pc-client-page h4 {color:#6c617c;}
   .pc-client-page .bg-base-100 {background:#fff;color:#36454f;}
   .pc-client-page .bg-base-200 {background:#f5f3f8;color:#36454f;}
   .pc-client-page .border-base-300 {border-color:#e4dfeb;}
   .pc-client-page .text-base-content\\/60 {color:#69717b;}
   .pc-client-page .text-base-content\\/70 {color:#59636f;}
   .pc-client-page .btn-primary {background:#51416e;border-color:#51416e;color:#fff;box-shadow:none;border-radius:22px;}
   .pc-client-page .btn-primary:hover {background:#392c53;border-color:#392c53;}
   .pc-client-page .btn-outline {color:#51416e;border-color:#b2a2c4;background:#fff;border-radius:22px;}
   .pc-client-page .btn-outline:hover {background:#f0ecf5;}
   .pc-client-page .link {color:#665080;text-underline-offset:3px;}
   .pc-client-page .badge {background:#f0ecf5;color:#5e4b75;border-color:#ddd3e9;}
   .pc-client-page .alert {background:#f7f6f9;color:#59636f;border:1px solid #e4dfeb;}
   .pc-client-page .select,.pc-client-page .textarea {background:#fff;color:#36454f;border-color:#b8acc8;}
   .pc-client-page :is(button,a,select,textarea,input):focus-visible {outline:3px solid #9a82b6;outline-offset:3px;}
   .pc-client-page .btn:disabled {background:#eeebf2;color:#756d81;border-color:#e0d9e8;}
   .pc-client-page .checkbox {accent-color:#665080;}
   .pc-client-page .pc-test-note {padding:9px 12px;font-size:11px;line-height:1.5;border-radius:10px;}
   .pc-client-page .pc-practitioner-note {font-size:12px;line-height:1.55;color:#59636f;border-left:2px solid #c0b3d1;padding:5px 0 5px 10px;background:transparent;}
   .pc-client-page .pc-profession {display:inline-block;border-radius:20px;background:#f0ecf5;color:#645379;padding:4px 10px;margin-top:8px;line-height:1.4;font-size:12px;}
   .pc-client-page .pc-option-selected {border-color:#9b86b4;box-shadow:0 0 0 1px #9b86b4;}
   .pc-client-page .pc-portrait {width:100px;height:120px;border-radius:16px;object-fit:cover;object-position:center 25%;flex-shrink:0;}
   .pc-client-page .pc-selection-status {display:inline-block;font-size:11px;color:#45613c;background:#edf2e8;border-radius:20px;padding:3px 9px;margin-top:8px;}
   .pc-preferences-bar {position:sticky;top:0;z-index:5;background:rgba(255,255,255,.97);border:1px solid #ded5e8;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 5px 18px rgba(43,36,76,.07);}
   .pc-preferences-bar .btn {flex-shrink:0;}
   .pc-client-page form {scroll-margin-top:110px;}
   .pc-fee-columns {display:grid;grid-template-columns:1fr 1fr;gap:18px;}
   .pc-fee-columns>div+div {border-left:1px solid #e4dfeb;padding-left:18px;}
   .pc-fee-section {border-block:1px solid #e4dfeb;padding-block:14px;}
   .pc-location-heading {background:#f3f0f7;color:#51416e;border-radius:5px;padding:5px 8px;}
   .pc-card-actions {display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:10px;}
   .pc-card-actions .btn {height:auto;min-height:40px;font-size:12px;line-height:1.4;padding:9px 10px;white-space:normal;}
   .pc-options-grid {display:grid;grid-template-columns:minmax(0,1fr);gap:20px;}
   .pc-option-card {display:grid;grid-template-rows:auto auto auto auto 1fr auto auto;gap:14px;padding:22px;min-width:0;border-radius:20px;box-shadow:0 5px 18px rgba(43,36,76,.05);}
   .pc-option-card p {margin:0;}
   @media(min-width:900px){
    .pc-options-grid {grid-template-columns:repeat(2,minmax(0,1fr));column-gap:20px;row-gap:18px;}
    @supports(grid-template-rows:subgrid){.pc-option-card {grid-template-rows:subgrid;grid-row:span 7;}}
   }
   @media(max-width:540px){.pc-option-card {padding:18px;}.pc-client-page .pc-portrait {width:80px;height:96px;}.pc-fee-columns {grid-template-columns:1fr;gap:12px;}.pc-fee-columns>div+div {border-left:0;border-top:1px solid #e4dfeb;padding:12px 0 0;}.pc-card-actions {grid-template-columns:1fr;}.pc-preferences-bar {align-items:flex-start;flex-wrap:wrap;}}
  `}</style>
  <div className="pc-test-note alert"><span><strong>Staff test preview.</strong> No private client link exists. Entries stay on this screen only—nothing is saved, sent or booked. Please use fictional client information.</span></div>
  <section className="pc-brand-hero rounded-2xl border border-base-300" aria-labelledby="pc-welcome-heading">
   <img src="/brand/psychologycare-logo.svg" alt="PsychologyCare" className="pc-brand-logo"/>
   {clientName.trim()&&<p className="pc-welcome-greeting">Hi {clientName.trim()},</p>}
   <h2 id="pc-welcome-heading" className="pc-welcome-title font-semibold">Let’s find the right support for you</h2>
   <p className="pc-welcome-intro">Feeling comfortable with your practitioner matters. We’ve selected these options based on the information you’ve shared with us, for you to explore at your own pace.</p>
   <ol className="pc-welcome-steps">
    <li><strong>Explore your options</strong><p>Get to know each practitioner and compare their approach, fees and appointment options.</p></li>
    <li><strong>Share your preferences</strong><p>Choose one or more practitioners and let us know which days and times suit you.</p></li>
    <li><strong>Ask us a question</strong><p>Tell us what you’d like to know or if you need help choosing.</p></li>
   </ol>
   <p className="pc-welcome-help">You don’t need to have everything decided — our team is here to help with the next step.</p>
   <div className="pc-welcome-footer">
    <span className="pc-welcome-count">{profiles.length} practitioner{profiles.length===1?'':'s'} to explore</span>
    <p className="pc-welcome-booking-note"><strong>What happens next?</strong> Our team will check current availability and confirm the details with you. Selecting a preference does not reserve or confirm an appointment. All times shown are Melbourne time.</p>
   </div>
  </section>
  {age60Plus&&profiles.some(p=>p.locations.some(l=>l.lines.length>0&&!/telehealth|online/i.test(l.name)&&/prahran|greville|183a|185a/i.test(l.name)))&&<div className="alert text-sm"><span>Our Prahran clinics at 183A and 185A Greville Street are upstairs, with approximately 18 stairs. Please let us know if stairs may be difficult so we can discuss suitable options.</span></div>}
  {!!chosen.length&&<div className="pc-preferences-bar"><div className="min-w-0 text-sm" aria-live="polite"><strong>{chosen.length} practitioner{chosen.length===1?'':'s'} in your preferences</strong><p className="text-xs text-base-content/60 pt-1">{chosenProfiles.map(p=>p.name).join(' · ')}</p></div><button type="button" className="btn btn-primary btn-sm" onClick={()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}>Review preferences ↓</button></div>}
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
