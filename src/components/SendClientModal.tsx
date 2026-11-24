import {availabilityHorizon} from '../utils/availabilityHorizon';
import React, { useState, useMemo, useEffect } from "react";
import { Send, X, ArrowLeft, Eye, Clipboard, ClipboardCheck } from "lucide-react";
import { Practitioner } from "../types";
import { hasAfterHoursAvailability } from "../utils/afterHours";
import { loadEmailTemplateConfig } from "../emailTemplateConfig";
import { buildEmailHtml } from "../utils/emailBuilder";
import {useNoticeClock} from '../utils/useNoticeClock';
import {suppressKristaIntake} from '../utils/practitionerIntakePause';

import {ClientPagePreview} from './ClientPagePreview';
import {buildClientInvitationEmail} from '../utils/clientInvitationEmail';

interface Props {
  selected: Practitioner[];
  locationFilter: string;
  onClose: () => void;
  onSent: () => void;
  includeMonthly?: boolean;
  sessionType?: string;
  clientAge60Plus?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

const SendClientModal: React.FC<Props> = ({ selected, locationFilter, onClose, onSent, includeMonthly = false, sessionType = "Individual", clientAge60Plus = false }) => {
  // Load config from localStorage (reflects any edits made in Email Template tab)
  const config = useMemo(() => loadEmailTemplateConfig(), []);
  const noticeNow = useNoticeClock();

  const [step, setStep] = useState<"form" | "preview" | "client-preview">("form");
  const [copied, setCopied] = useState(false);
  const [emailFormat,setEmailFormat]=useState<'invitation'|'original'>('invitation');
  const [clientName, setClientName] = useState("");
  const [recommendationNotes,setRecommendationNotes]=useState<Record<string,string>>({});
 const [feeArrangements,setFeeArrangements]=useState<Record<string,{businessHours?:number;afterHours?:number;standard?:number;approved:boolean}>>({});
  const [clientEmail, setClientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("anna@psychologycare.com.au");
  const [senderName, setSenderName] = useState(config.senders[0] || "Anna Donaldson");
  const [openingParagraph, setOpeningParagraph] = useState(config.intro_text);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [diaryVerified, setDiaryVerified] = useState(false);
  const needsDiaryReview=selected.map(suppressKristaIntake).some(p=>p.requires_diary_verification);
  const reviewReady=!needsDiaryReview || diaryVerified;
  const selectionKey=selected.map(p=>p.name).join('|');
  useEffect(()=>{setDiaryVerified(false);setStep('form');},[selectionKey,locationFilter,sessionType]);

  const practitionerData = useMemo(
    () =>
      selected.map(suppressKristaIntake).map((p) => {
        // For supervision sessions, use supervision_availability instead of regular locations
        let locs;
        if (sessionType === "Supervision") {
          const supAvail: any[] = (p as any).supervision_availability || [];
          // Convert days/times format into the availability string format the email builder expects
          locs = supAvail.map((entry: any) => {
            const lines: string[] = [];
            for (const d of entry.days || []) {
              for (const t of d.times || []) {
                lines.push(`${d.day}s at ${t}`);
              }
            }
            return { location: entry.location || "Telehealth", availability: lines.join("\n") };
          });
        } else {
          locs = locationFilter
            ? p.locations.filter((l) =>
                l.location.toLowerCase().includes(locationFilter.toLowerCase())
              )
            : p.locations;
        }
        return {
          name: p.name,
          title: p.title,
          therapist_type: p.therapist_type,
          fees: p.fees,
          medicare_rebate: p.medicare_rebate,
          availabilityLocations: locs,
          link_to_bio: p.link_to_bio,
          after_hours: hasAfterHoursAvailability(
            locs.map((l: any) => ({ availability: l.availability }))
          ),
          accepts_couples: p.accepts_couples,
          client_note: p.client_note,
          upcoming_leave_client_notice: p.upcoming_leave_client_notice,
          upcoming_leave_show_from: p.upcoming_leave_show_from,
          upcoming_leave_hide_after: p.upcoming_leave_hide_after,
          short_bio: p.short_bio,
          working_hours: (p as any).working_hours,
          location_notes: (p as any).location_notes,
          photo_url: (p as any).photo_url,
        };
      }),
    [selected, locationFilter, sessionType]
  );

  const previewHtml = useMemo(
    () => emailFormat==='invitation'
      ? buildClientInvitationEmail(clientName,note,senderName,practitionerData,config,openingParagraph)
      : buildEmailHtml(clientName || "Client", note, senderName, practitionerData, { ...config, intro_text: openingParagraph }, includeMonthly, { age60Plus: clientAge60Plus }),
    [emailFormat,clientName, note, senderName, practitionerData, config, openingParagraph, includeMonthly, clientAge60Plus, noticeNow]
  );

  const handleCopyEmail = async () => {
    if(emailFormat==='invitation'){setError('Test only: private client links are not connected. This invitation cannot be copied or sent yet.');return;}
    const previewHtml = buildEmailHtml(clientName || 'Client', note, senderName, practitionerData, {...config, intro_text: openingParagraph}, includeMonthly, {age60Plus: clientAge60Plus});
    if(!reviewReady){setError('Review and confirm Krista’s live diary before copying or offering appointments.');return;}
    try {
      // Copy as rich HTML so it pastes correctly into email clients
      const blob = new Blob([previewHtml], { type: "text/html" });
      const item = new ClipboardItem({ "text/html": blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback: use a contenteditable div so execCommand copies rendered HTML
      try {
        const div = document.createElement("div");
        div.contentEditable = "true";
        div.innerHTML = previewHtml;
        div.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
        document.body.appendChild(div);
        const range = document.createRange();
        range.selectNodeContents(div);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("copy");
        document.body.removeChild(div);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        console.error("Copy failed", e);
      }
    }
  };

  const handlePreview = () => {
    if(!reviewReady){setError('Review and confirm Krista’s live diary before previewing or offering appointments.');return;}
    if (!clientName.trim()) { setError("Please enter the client's name."); return; }
    setError("");
    setStep("preview");
  };

  const handleSend = async () => {
    setError('Test mode: live emails and client notifications are disabled. No message has been sent.');
  };

  const ccDisplay = ccEmails.split(",").map((e) => e.trim()).filter(Boolean).join(", ");

  return (
    <div className="modal modal-open">
      <div
        className={`modal-box ${step === "client-preview" ? "max-w-6xl" : step === "preview" ? "max-w-3xl" : "max-w-lg"}`}
        style={{ maxHeight: "90vh", height: step === "preview" ? "90vh" : undefined, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step !== "form" && (
              <button onClick={() => setStep("form")} className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeft size={16} />
              </button>
            )}
            <h3 className="font-bold text-lg">
              {step === "client-preview" ? "Client page · staff test preview" : step === "form" ? "Send to Client" : "Preview Email"}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        {needsDiaryReview && <div className="border rounded p-3 mb-3 text-sm" style={{borderColor:'#8D5273'}}>
          <strong>Staff-only diary revalidation required — Krista</strong>
          <p>These are confirmed recurring options, not automatically checked live availability. Verify each relevant fortnightly occurrence over the next {availabilityHorizon().weeks} weeks against Pending/Confirmed/Completed appointments and diary/PAP/room blocks, including 90 minutes plus a 15-minute break (8:30–10:15am / 12–1:45pm). Resolve any booked/blocked occurrence before offering. No automated overlap checking has occurred.</p>
          <label className="flex gap-2 mt-2"><input type="checkbox" checked={diaryVerified} onChange={e=>{setDiaryVerified(e.target.checked);if(!e.target.checked)setStep('form');}} />I have checked Krista’s Zanda diary and room availability for these recurring appointments and confirmed the options in this email for this client. No unconfirmed times will be offered.</label>
        </div>}

        {step === "client-preview" ? (
          <ClientPagePreview practitioners={practitionerData} includeMonthly={includeMonthly} age60Plus={clientAge60Plus} now={new Date(noticeNow)} clientName={clientName} recommendationNotes={recommendationNotes} feeArrangements={feeArrangements} onBack={()=>setStep('form')}/>
        ) : step === "form" ? (
          <>
            {/* Selected practitioners summary */}
            <div className="mb-4 p-3 bg-base-200 rounded-lg flex-shrink-0">
              <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2">
                Sending {selected.length} Practitioner{selected.length !== 1 ? "s" : ""}
              </div>
              {selected.map((p, i) => (
                <div key={i} className="text-sm font-medium text-base-content/80">
                  • {p.name} — {p.title}
                </div>
              ))}
            </div>

            <div className="space-y-3 flex-shrink-0 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {/* Sender */}
              <div>
                <label className="label label-text font-semibold pb-1">Sending As</label>
                <select
                  className="select select-bordered w-full"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                >
                  {config.senders.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div>
                <label className="label label-text font-semibold pb-1">
                  Client Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  className="input input-bordered w-full"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              {/* Client Email */}
              <div>
                <label className="label label-text font-semibold pb-1">
                  Client Email{" "}
                  <span className="text-base-content/40 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah@email.com"
                  className="input input-bordered w-full"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>

              {/* CC */}
              <div>
                <label className="label label-text font-semibold pb-1">
                  CC{" "}
                  <span className="text-base-content/40 font-normal">
                    (comma-separated)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="anna@psychologycare.com.au"
                  className="input input-bordered w-full"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                />
              </div>

              {/* Opening Paragraph */}
              <div>
                <div className="flex items-center justify-between pb-1">
                  <label className="label label-text font-semibold">Opening Paragraph</label>
                  {openingParagraph !== config.intro_text && (
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setOpeningParagraph(config.intro_text)}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <textarea
                  className="textarea textarea-bordered w-full text-sm"
                  rows={4}
                  value={openingParagraph}
                  onChange={(e) => setOpeningParagraph(e.target.value)}
                />
              </div>

              {/* Client-appropriate recommendation notes are local to this preview, never inferred. */}
              <fieldset className="space-y-3"><legend className="font-semibold text-sm">Why these practitioners? · optional client-facing notes</legend><p className="text-xs leading-relaxed">Only include information appropriate for this client. Avoid diagnoses, sensitive intake details or guarantees of suitability. Notes stay in this test session only.</p>{selected.map(p=><label className="block text-sm" key={p.name}>Why we've included {p.name}<textarea className="textarea textarea-bordered w-full mt-1" rows={2} maxLength={600} value={recommendationNotes[p.name]||''} onChange={e=>setRecommendationNotes(previous=>({...previous,[p.name]:e.target.value}))} placeholder="Optional personalised explanation for this client"/></label>)}</fieldset>
              <details className="text-sm"><summary className="font-semibold cursor-pointer">Approved individual fee arrangements · optional test preview</summary><p className="text-xs my-2">Only enter arrangements already approved for this client. Leave unchanged categories empty. This does not update practitioner fees, CRM or Zanda, and is not copied into the original email. Preview only; verify source documentation before any future live use.</p>{selected.map(p=><fieldset key={p.name} className="border rounded-xl p-3 my-3 space-y-2"><legend>{p.name}</legend>{([['standard','Standard fee'],['businessHours','Business-hours fee'],['afterHours','After-hours fee']] as const).map(([key,label])=><label key={key} className="block text-xs">{label} · AUD<input className="input input-bordered input-sm w-full" type="number" min="0.01" step="0.01" value={feeArrangements[p.name]?.[key]??''} onChange={e=>{const value=e.target.value;setFeeArrangements(previous=>({...previous,[p.name]:{...previous[p.name],approved:false,[key]:value===''?undefined:Number(value)}}));}}/></label>)}<label className="flex gap-2 text-xs"><input type="checkbox" checked={!!feeArrangements[p.name]?.approved} onChange={e=>setFeeArrangements(previous=>({...previous,[p.name]:{...previous[p.name],approved:e.target.checked}}))}/>I have verified these individual fees are approved for this client.</label></fieldset>)}</details>
              {/* Personal Note */}
              <div>
                <label className="label label-text font-semibold pb-1">
                  Personal Note{" "}
                  <span className="text-base-content/40 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Add a personal note for this client..."
                  className="textarea textarea-bordered w-full text-sm"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error text-sm mt-3 py-2 flex-shrink-0">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action mt-4 flex-shrink-0">
              <button onClick={onClose} className="btn btn-ghost">Cancel</button>
              <button type="button" className="btn btn-outline" disabled={!reviewReady || !selected.length} onClick={()=>{setError('');setStep('client-preview');}}>
                <Eye size={16}/> Preview as client
              </button>
              <button onClick={handlePreview} className="btn btn-primary">
                <Eye size={16} /> Preview Email →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0 mb-3 space-y-2 rounded-xl border p-3" style={{background:'#f7f5fa',borderColor:'#e5deed',color:'#36454f'}}>
              <label className="block text-xs font-semibold">Email format
                <select className="select select-bordered select-sm w-full mt-1" value={emailFormat} onChange={e=>{setEmailFormat(e.target.value as 'invitation'|'original');setError('');}}>
                  <option value="invitation">New client-page invitation · test only</option>
                  <option value="original">Original full availability email</option>
                </select>
              </label>
              {emailFormat==='invitation'&&<p className="text-xs leading-relaxed"><strong>Staff preview only.</strong> Try the email button to view your selected practitioners. Copying and sending stay disabled until private client links are ready.</p>}
            </div>
            <div className="text-xs text-base-content/60 mb-3 px-1 flex-shrink-0 flex flex-wrap gap-x-5 gap-y-1">
              {clientEmail.trim() && <div>To: <strong>{clientEmail}</strong></div>}
              {ccDisplay && <div>CC: <strong>{ccDisplay}</strong></div>}
              <div>From: <strong>{senderName}</strong></div>
            </div>

            <div
              className="flex-1 overflow-hidden rounded-lg border border-base-300"
              style={{ minHeight: 120, background:'#f3f0f7' }}
            >
              <iframe
                srcDoc={previewHtml}
                onLoad={e=>{
                  const doc=e.currentTarget.contentDocument;
                  doc?.querySelector('[data-client-options-preview]')?.addEventListener('click',event=>{event.preventDefault();if(reviewReady)setStep('client-preview');});
                }}
                style={{ display:"block", width: "100%", height: "100%", border: "none", minHeight: 0 }}
                title="Email Preview"
              />
            </div>

            {error && (
              <div className="alert alert-error text-sm mt-3 py-2 flex-shrink-0">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action mt-4 flex-shrink-0">
              <button onClick={() => setStep("form")} className="btn btn-ghost" disabled={sending}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                onClick={handleCopyEmail}
                disabled={emailFormat==='invitation'}
                className="btn btn-outline"
                style={{ borderColor: "#8D5273", color: copied ? "#47B2AE" : "#8D5273" }}
                title="Copy email to paste into your PMS"
              >
                {copied ? <><ClipboardCheck size={16} /> Copied!</> : <><Clipboard size={16} /> Copy Email</>}
              </button>
              <button onClick={handleSend} className="btn btn-success" disabled={true}>
                {sending ? (
                  <><span className="loading loading-spinner loading-sm" /> Sending...</>
                ) : (
                  <><Send size={16} /> Sending disabled · test only</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default SendClientModal;
