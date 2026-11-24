import React,{useMemo,useState,useRef} from 'react';
import {type PractitionerEmailData} from '../utils/emailBuilder';
import {clientPreviewProfiles} from '../utils/clientPagePreview';
import {ClientPagePractitionerCard} from './ClientPagePractitionerCard';
interface Props {practitioners:PractitionerEmailData[];includeMonthly:boolean;age60Plus:boolean;now:Date;onBack:()=>void;clientName?:string;}
export const ClientPagePreview:React.FC<Props>=({practitioners,includeMonthly,age60Plus,now,onBack,clientName=''})=>{
 const profiles=useMemo(()=>clientPreviewProfiles(practitioners,includeMonthly,now),[practitioners,includeMonthly,now]);
 const [chosen,setChosen]=useState<string[]>([]);const [times,setTimes]=useState<Record<string,string>>({});const [message,setMessage]=useState('');const [tested,setTested]=useState(false);
 const supportChoices=["I'm interested, but need a different appointment time","I'm unsure and would appreciate further guidance","None of these options quite suit me","I'd prefer a phone call to discuss my options"];
 const [support,setSupport]=useState<string[]>([]);
 const formRef=useRef<HTMLFormElement>(null);const messageRef=useRef<HTMLTextAreaElement>(null);
 const chosenProfiles=chosen.flatMap(key=>profiles.filter(p=>p.key===key));
 const preferenceLabel=(index:number)=>['First preference','Second preference','Third preference'][index]||`Preference ${index+1}`;
 function movePreference(index:number,direction:number){setChosen(previous=>{const next=[...previous];const target=index+direction;if(target<0||target>=next.length)return previous;[next[index],next[target]]=[next[target],next[index]];return next;});setTested(false);}
 function options(p:typeof profiles[number]){return p.locations.flatMap(loc=>loc.lines.filter(l=>l.selectable).map(l=>({...l,label:`${loc.name} · ${l.text} (${l.frequency})`})))}
 function choose(key:string){setChosen(previous=>previous.includes(key)?previous.filter(k=>k!==key):[...previous,key]);setTimes(previous=>{const next={...previous};delete next[key];return next;});setTested(false);}
 function ask(key:string){setChosen(previous=>previous.includes(key)?previous:[...previous,key]);setTested(false);formRef.current?.scrollIntoView({behavior:'smooth',block:'start'});messageRef.current?.focus({preventScroll:true});}
 return <div className="pc-client-page overflow-y-auto flex-1 min-h-0 space-y-5 p-1">
  <style>{`
   /* GP-site-inspired lilac/white with restrained sage selection accents. */
   .pc-client-page {color:#36454f;background:linear-gradient(145deg,#f6f3fa 0%,#fff 58%);color-scheme:light;}
   .pc-client-page .pc-brand-hero {background:#fff;border-color:#e1dbea;padding:28px;}
   .pc-brand-hero .pc-welcome-title {font-size:clamp(22px,2.6vw,28px);line-height:1.3;margin:0 0 18px;text-wrap:balance;}
   .pc-welcome-greeting {margin:0 0 10px;color:#645379;font-size:16px;line-height:1.6;font-weight:600;overflow-wrap:anywhere;}
   .pc-welcome-intro {font-size:15px;line-height:1.75;width:100%;max-width:none;white-space:normal;overflow-wrap:break-word;margin:0 0 14px;}
   .pc-welcome-steps {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;list-style:none;padding:0;margin:24px 0 18px;}
   .pc-welcome-steps li {background:rgba(255,255,255,.8);border:1px solid #e7e1ee;border-radius:14px;padding:16px;}
   .pc-welcome-icon {display:block;width:20px;height:20px;color:#668574;margin-bottom:12px;}
   .pc-welcome-steps strong {display:block;color:#2b244c;font-size:14px;line-height:1.4;margin-bottom:6px;}
   .pc-welcome-steps p {font-size:13px;line-height:1.65;margin:0;}
   .pc-welcome-help {font-size:13px;line-height:1.65;margin:0 0 22px;font-style:italic;color:#69717b;}
   .pc-welcome-footer {display:block;border-top:1px solid #e4dfeb;padding-top:22px;}
   .pc-welcome-count {display:block;color:#69717b;font-size:13px;font-weight:400;line-height:1.7;margin:10px 0 18px;}
   .pc-welcome-booking-note {font-size:14px;line-height:1.75;color:#36454f;margin:0;width:100%;max-width:none;white-space:normal;overflow-wrap:break-word;}
   @media(max-width:640px){.pc-client-page .pc-brand-hero {padding:24px 20px;}.pc-welcome-steps {grid-template-columns:1fr;gap:10px;margin-top:20px;}.pc-welcome-steps li {padding:16px;}}
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
   .pc-next-step {padding:24px;display:flex;flex-direction:column;gap:20px;}
   .pc-next-step h3 {font-size:22px;font-weight:600;margin:0;}
   .pc-next-step p {margin:0;}
   .pc-form-intro {font-size:14px;line-height:1.75;}
   .pc-choice-list {display:grid;gap:12px;min-width:0;margin:0;padding:0;border:0;}
   .pc-choice-card {border:1px solid #e4dfeb;border-radius:16px;padding:16px;min-width:0;background:#fff;}
   .pc-choice-card.is-selected {border-color:#b7a6ca;}
   .pc-choice-name {display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;line-height:1.5;cursor:pointer;}
   .pc-choice-card .select {border-radius:24px;height:auto;min-height:42px;font-size:13px;max-width:100%;}
   .pc-preference-heading {display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin:12px 0;color:#645379;font-size:12px;}
   .pc-guidance-options {display:grid;gap:10px;margin-top:12px;}
   .pc-guidance-option {display:flex;align-items:flex-start;gap:10px;border:1px solid #e4dfeb;border-radius:12px;padding:12px;font-size:13px;line-height:1.6;cursor:pointer;}
   .pc-guidance-option input {flex-shrink:0;margin-top:2px;}
   .pc-next-step .pc-form-hint {font-size:12px;color:#69717b;line-height:1.6;margin:6px 0 12px;}
   .pc-next-steps-note {background:#f3f0f7;border-radius:14px;padding:16px;font-size:13px;line-height:1.7;}
   .pc-next-steps-note strong {display:block;color:#51416e;margin-bottom:6px;}
   .pc-next-step .pc-request-submit {width:100%;min-height:46px;height:auto;padding:12px;white-space:normal;}
   .pc-crisis-footer {font-size:12px;line-height:1.7;color:#69717b;border-top:1px solid #e4dfeb;padding-top:16px;}
   .pc-crisis-footer a {color:#51416e;text-decoration:underline;}
   @media(max-width:540px){.pc-next-step {padding:18px;}.pc-choice-card {padding:14px;}}
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
   <h2 id="pc-welcome-heading" className="pc-welcome-title font-semibold">Finding the right therapist for you</h2>
   <p className="pc-welcome-intro">Thank you for taking the time to share a little about yourself and what you're hoping to gain from therapy.</p>
   <p className="pc-welcome-intro">Based on the information you've shared with us, we've carefully selected the following practitioners who we feel may be a good fit for your individual needs, preferences and therapy goals.</p>
   <p className="pc-welcome-intro">We understand that finding someone you feel comfortable with is an important part of the therapeutic process, and we’re here to help you navigate that decision.</p>
   <ol className="pc-welcome-steps">
    <li><svg className="pc-welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v2"/></svg><strong>Explore your options</strong><p>Get to know your recommended practitioners, their therapeutic approaches, fees and appointment options.</p></li>
    <li><svg className="pc-welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.8 5.6a5.5 5.5 0 0 0-8.8-.7 5.5 5.5 0 0 0-8.8.7C.5 10 6 15.5 12 20c6-4.5 11.5-10 8.8-14.4Z"/></svg><strong>Let us know your preferences</strong><p>Select any practitioners you feel drawn to and let us know which appointment times work best for you.</p></li>
    <li><svg className="pc-welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M14 12H7l-4 4V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1ZM18 9h2a1 1 0 0 1 1 1v11l-4-4h-6a1 1 0 0 1-1-1v-1"/></svg><strong>We're here to help</strong><p>If you're unsure who to choose or have any questions, our intake team is happy to provide further guidance.</p></li>
   </ol>
   <p className="pc-welcome-help">There's no pressure to make a decision straight away. Take your time exploring the options below, and we'll work with you to find the right fit.</p>
   <div className="pc-welcome-footer">
    <h3 className="font-semibold text-base">Your recommended practitioners</h3>
    <span className="pc-welcome-count">{profiles.length} practitioner{profiles.length===1?'':'s'} selected for you</span>
    <p className="pc-welcome-booking-note"><strong className="block mb-3">What happens next?</strong>Once you've submitted your preferences, our intake team will review your selections, check current availability and contact you to arrange the next steps.</p>
    <p className="text-xs text-base-content/60 mt-3 leading-relaxed">Selecting a preference does not reserve or confirm an appointment. All times shown are Melbourne time.</p>
   </div>
  </section>
  {age60Plus&&profiles.some(p=>p.locations.some(l=>l.lines.length>0&&!/telehealth|online/i.test(l.name)&&/prahran|greville|183a|185a/i.test(l.name)))&&<div className="alert text-sm"><span>Our Prahran clinics at 183A and 185A Greville Street are upstairs, with approximately 18 stairs. Please let us know if stairs may be difficult so we can discuss suitable options.</span></div>}
  {!!chosen.length&&<div className="pc-preferences-bar"><div className="min-w-0 text-sm" aria-live="polite"><strong>{chosen.length} practitioner{chosen.length===1?'':'s'} in your preferences</strong><p className="text-xs text-base-content/60 pt-1">{chosenProfiles.map(p=>p.name).join(' · ')}</p></div><button type="button" className="btn btn-primary btn-sm" onClick={()=>formRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}>Review preferences ↓</button></div>}
  <div className="pc-options-grid">{profiles.map(p=><ClientPagePractitionerCard key={p.key} profile={p} selected={chosen.includes(p.key)} onSelect={choose} onAsk={ask}/>)}</div>
  {!profiles.length&&<p>No practitioners selected. Go back and choose your shortlist.</p>}
  <form ref={formRef} className="card bg-base-100 border border-base-300" onSubmit={e=>{e.preventDefault();if(chosen.length||support.length||message.trim())setTested(true);}}><div className="pc-next-step">
   <h3>Let's take the next step</h3>
   <p className="pc-form-intro">Let us know which practitioners and appointment options appeal to you. You don't need to have everything decided — our intake team is here to help.</p>
   <fieldset className="pc-choice-list"><legend className="font-semibold text-sm">Which practitioners are you interested in?</legend><p className="pc-form-hint">You can select more than one. Put your selections in your preferred order and choose a separate appointment option for each.</p>
   {[...chosenProfiles,...profiles.filter(p=>!chosen.includes(p.key))].map(p=>{const index=chosen.indexOf(p.key);const selected=index>=0;return <div key={p.key} className={`pc-choice-card${selected?' is-selected':''}`}>
    <label className="pc-choice-name"><input type="checkbox" className="checkbox checkbox-sm" checked={selected} onChange={()=>choose(p.key)}/><span>{p.name}</span></label>
    {selected&&<><div className="pc-preference-heading"><strong>{preferenceLabel(index)} · {p.name}</strong><div className="flex gap-2"><button type="button" className="btn btn-outline btn-xs" aria-label={`Move ${p.name} up`} disabled={index===0} onClick={()=>movePreference(index,-1)}>↑ Move up</button><button type="button" className="btn btn-outline btn-xs" aria-label={`Move ${p.name} down`} disabled={index===chosenProfiles.length-1} onClick={()=>movePreference(index,1)}>↓ Move down</button></div></div>
    <label className="flex flex-col gap-2 text-sm"><span>Preferred appointment option for {p.name}</span><select className="select select-bordered w-full" value={times[p.key]||''} onChange={e=>{const value=e.target.value;setTimes(previous=>({...previous,[p.key]:value}));setTested(false);}}><option value="">Not sure yet / please help me find a time</option>{options(p).map(s=><option key={s.id} value={s.id}>{s.label}</option>)}<option value="different-time">I'm interested, but need a different appointment time</option></select></label></>}
   </div>})}</fieldset>
   <fieldset className="pc-choice-list"><legend className="font-semibold text-sm">Would you like some help with your options?</legend><p className="pc-form-hint">Choose any that apply — you can ask for help without selecting a practitioner.</p><div className="pc-guidance-options">{supportChoices.map(choice=><label className="pc-guidance-option" key={choice}><input type="checkbox" className="checkbox checkbox-sm" checked={support.includes(choice)} onChange={()=>{setSupport(previous=>previous.includes(choice)?previous.filter(item=>item!==choice):[...previous,choice]);setTested(false);}}/><span>{choice}</span></label>)}</div></fieldset>
   <label className="flex flex-col text-sm font-semibold">Is there anything else you'd like us to know?<span className="pc-form-hint font-normal">Optional — we're happy to answer any questions, discuss alternative appointment times or help you decide which practitioner may be the best fit. If you'd like a phone call, you can include your preferred contact number and a suitable time.</span><textarea ref={messageRef} className="textarea textarea-bordered w-full font-normal" maxLength={1500} rows={4} placeholder="Share any questions, preferences or additional information here…" value={message} onChange={e=>{setMessage(e.target.value);setTested(false);}}/></label>
   <div className="pc-next-steps-note"><strong>What happens next?</strong><p>Our intake team will review your preferences, check current appointment availability and be in touch to help arrange your next steps.</p><p className="pc-form-hint">Please note that submitting your preferences does not reserve or confirm an appointment.</p></div>
   <p className="pc-form-hint">Staff test only: these options use cached availability, not a live diary check. Staff check Zanda and room availability where relevant before confirming. All times shown are Melbourne time.</p>
   <button className="btn btn-primary pc-request-submit" disabled={!chosen.length&&!support.length&&!message.trim()}>Test request · do not send</button>
   {tested&&<div role="status" className="alert text-sm"><div><strong>Test only—nothing sent.</strong>{chosenProfiles.length?<ul className="space-y-2 pt-2">{chosenProfiles.map((p,index)=><li key={p.key}><strong>{preferenceLabel(index)} · {p.name}</strong><br/>{times[p.key]==='different-time'?"I'm interested, but need a different appointment time":options(p).find(s=>s.id===times[p.key])?.label||'Please help me find a time'}</li>)}</ul>:<p>Guidance or question · no practitioner selected</p>}{!!support.length&&<ul className="space-y-2 pt-2">{support.map(choice=><li key={choice}>{choice}</li>)}</ul>}{message.trim()&&<p className="pt-2 whitespace-pre-wrap">Question: {message}</p>}</div></div>}
   <p className="pc-crisis-footer">This form is not monitored in real time and is not intended for urgent or crisis support. If you require immediate assistance, please call <a href="tel:000">000</a> or Lifeline on <a href="tel:131114">13 11 14</a>.</p>
  </div></form>
  <button className="btn btn-outline" type="button" onClick={onBack}>Back to email setup</button>
 </div>;
};
