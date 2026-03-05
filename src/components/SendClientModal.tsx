import React, { useState, useMemo } from "react";
import { Send, X, Loader, ArrowLeft, Eye } from "lucide-react";
import { Practitioner } from "../types";
import { hasAfterHoursAvailability } from "../utils/afterHours";

interface Props {
  selected: Practitioner[];
  locationFilter: string;
  onClose: () => void;
  onSent: () => void;
}

// Mirrors email-template-config.json
const TEMPLATE = {
  subject: "Your Practitioner Options – PsychologyCare",
  intro: "Thank you for reaching out to PsychologyCare. Based on your intake information, we've put together a list of practitioners we think could be a great fit for you.",
  closing: "At PsychologyCare, we place a strong emphasis on consistency and continuity of care. Once you secure a regular appointment time, that time is held just for you.\n\nFor example, if you book Mondays at 9:00AM, that becomes your dedicated therapy time each week or fortnight. We don't overbook or rotate clients through shared timeslots — your space is yours. We've found this consistency really supports therapeutic progress and creates a sense of stability.\n\nIf one of these practitioners resonates with you, simply let me know your preferred day and time and I'll secure it for you. If you'd like to talk through the options first, I'm very happy to do that as well.\n\nPlease don't hesitate to reach out with any questions at all — I'm here to help make this process feel as smooth as possible.",
  signoff: "Warm regards,\nAnna & Charlotte",
  fields: {
    credentials: false,
    availability: true,
    fees: true,
    medicare: true,
    afterHours: true,
    couples: true,
    bio: true,
  },
};

function nl2br(text: string) {
  return text.replace(/\n/g, "<br>");
}

function parseAvailability(text: string): { weekly: string[]; fortnightly: string[] } {
  const weekly: string[] = [];
  const fortnightly: string[] = [];
  if (!text) return { weekly, fortnightly };
  const lines = text.split("\n").map(l => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
  for (const line of lines) {
    if (/\(Monthly:/i.test(line)) continue;
    const cleaned = line
      .replace(/ at /, " ")
      .replace(/\s*\((Weekly|Fortnightly): Starting ([^)]+)\)/, " · from $2");
    if (/\(Weekly:/i.test(line)) weekly.push(cleaned);
    else if (/\(Fortnightly:/i.test(line)) fortnightly.push(cleaned);
  }
  return { weekly, fortnightly };
}

function buildAvailabilityHtml(locations: Array<{ location: string; availability: string }>): string {
  const activeLocs = locations.filter(l => {
    const { weekly, fortnightly } = parseAvailability(l.availability || "");
    return weekly.length > 0 || fortnightly.length > 0;
  });
  if (activeLocs.length === 0) return `<span style="color:#999;font-style:italic;">Please contact us for availability</span>`;
  let html = "";
  for (const loc of activeLocs) {
    const { weekly, fortnightly } = parseAvailability(loc.availability);
    html += `<div style="margin-bottom:14px;">`;
    if (activeLocs.length > 1) {
      html += `<div style="font-weight:700;color:#2C244C;font-size:13px;margin-bottom:7px;border-bottom:1px solid #f0eef7;padding-bottom:4px;">${loc.location}</div>`;
    }
    if (weekly.length > 0) {
      html += `<div style="margin-bottom:8px;"><div style="font-size:11px;font-weight:700;color:#2a6e2a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Weekly</div>`;
      for (const slot of weekly) html += `<div style="font-size:13px;color:#333;margin-bottom:2px;">• ${slot}</div>`;
      html += `</div>`;
    }
    if (fortnightly.length > 0) {
      html += `<div style="margin-bottom:6px;"><div style="font-size:11px;font-weight:700;color:#1e5c8a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Fortnightly</div>`;
      for (const slot of fortnightly) html += `<div style="font-size:13px;color:#333;margin-bottom:2px;">• ${slot}</div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }
  return html;
}

function buildEmailHtml(
  clientName: string,
  note: string,
  practitioners: Array<{
    name: string; title: string; therapist_type: string; fees: string;
    medicare_rebate: string; availabilityLocations: Array<{ location: string; availability: string }>; link_to_bio: string;
    after_hours: boolean; accepts_couples: boolean; alert?: string; short_bio?: string;
  }>
): string {
  const f = TEMPLATE.fields;

  const row = (label: string, value: string) =>
    `<div style="display:flex;gap:8px;margin-bottom:10px;align-items:flex-start;font-size:13px;line-height:1.5;">
      <span style="color:#8D5273;font-weight:700;min-width:130px;flex-shrink:0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;padding-top:1px;">${label}</span>
      <span style="color:#333;flex:1;">${value}</span>
    </div>`;

  let cards = "";
  for (const p of practitioners) {
    const firstName = p.name.split(" ")[0];
    let body = "";

    if (f.credentials && p.therapist_type) {
      body += row("Credentials", p.therapist_type);
    }
    if (f.availability && p.availabilityLocations) {
      body += row("Availability", buildAvailabilityHtml(p.availabilityLocations));
    }
    if (f.fees && p.fees) {
      const feesHtml = p.fees
        .replace(/B\/H:/g, "Business Hours:")
        .replace(/A\/H:/g, "After Hours:")
        .replace(/\n/g, "<br>");
      body += row("Fees", feesHtml);
    }
    if (f.medicare && p.medicare_rebate) {
      const lines = p.medicare_rebate.split('\n').map(l => l.trim()).filter(Boolean);
      const firstLine = lines[0];
      const extraLines = lines.slice(1);
      const isAmount = /^[\$\d]/.test(firstLine);
      const rebateVal = isAmount ? (firstLine.startsWith('$') ? firstLine : `$${firstLine}`) : null;
      const extraHtml = extraLines.map(l => `<br><span style="font-size:12px;color:#777;font-style:italic;">${l}</span>`).join('');
      const rebateDisplay = rebateVal
        ? `${rebateVal} per session${extraHtml}<br><span style="font-size:12px;color:#777;font-style:italic;">Valid with an eligible Mental Health Treatment Plan and GP referral.</span>`
        : `<span style="font-size:13px;color:#777;font-style:italic;">${firstLine}</span>`;
      body += row("Medicare Rebate", rebateDisplay);
    }

    let chips = "";
    if (f.couples && p.accepts_couples) {
      chips += `<span style="font-size:11px;padding:3px 10px;border-radius:12px;background:#e8f0f8;color:#36454F;border:1px solid #366188;">✓ Accepts couples</span>`;
    }
    const bioBtn = (f.bio && p.link_to_bio)
      ? `<a href="${p.link_to_bio}" style="display:inline-block;background:#8D5273;color:white;text-decoration:none;padding:8px 18px;border-radius:6px;font-size:13px;font-weight:600;">View ${firstName}'s Profile →</a>`
      : "";
    const footer = (chips || bioBtn)
      ? `<div style="border-top:1px solid #f0eef7;padding:12px 20px;background:#fafafa;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">${chips}</div>
          ${bioBtn}
        </div>`
      : "";

    cards += `
      <div style="border:1px solid #e8e6f0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
        <div style="background:#2C244C;padding:16px 20px;">
          <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:2px;">${p.name}</div>
          <div style="font-size:13px;color:#CDA8BA;">${p.title}</div>
        </div>
        ${p.short_bio ? `<div style="padding:12px 20px 0;font-size:13px;color:#555;font-style:italic;">${p.short_bio}</div>` : ''}
        <div style="padding:16px 20px;">${body}</div>
        ${footer}
      </div>`;
  }

  const goodToKnow = `
    <div style="background:#F8F6FC;border:1px solid #e0daf0;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:14px;font-weight:700;color:#2C244C;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:14px;">Good to Know</div>
      <div style="margin-bottom:16px;font-size:13px;line-height:1.6;color:#444;">
        <div style="font-weight:700;color:#2C244C;margin-bottom:4px;">After-Hours Appointments</div>
        <div>Please note that appointments booked for 5:00 PM or later, and all weekend appointments, are classified as after-hours and attract a higher fee.</div>
      </div>
      <div style="margin-bottom:16px;font-size:13px;line-height:1.6;color:#444;">
        <div style="font-weight:700;color:#2C244C;margin-bottom:4px;">Medicare Rebates</div>
        <div>If you have a valid Mental Health Treatment Plan (MHTP) and GP referral, you are entitled to a Medicare rebate for a maximum of 10 sessions per calendar year. Please note that you will need to pay the full fee at the time of your appointment — we will then process the rebate and Medicare will pay this directly back to you. If you don't currently have a Mental Health Treatment Plan, simply visit your GP and request one.</div>
      </div>
      <div style="margin-bottom:0;font-size:13px;line-height:1.6;color:#444;">
        <div style="font-weight:700;color:#2C244C;margin-bottom:4px;">Private Health Insurance (PHI)</div>
        <div>If you have Private Health Insurance, please contact your insurer directly to confirm what your policy covers for the specific type of service you'll be receiving, as cover varies depending on your fund, policy, and the practitioner's discipline. Please note that Medicare and Private Health Insurance <strong>cannot</strong> be used for the same appointment — you will need to choose one or the other.</div>
      </div>
    </div>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f0eef7;padding:24px 0;">
      <div style="max-width:620px;margin:0 auto;background:white;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(44,36,76,0.15);">
        <div style="padding:32px;color:#333;">
          <div style="font-size:17px;font-weight:600;color:#2C244C;margin-bottom:12px;">Hi ${clientName},</div>
          <p style="font-size:14px;line-height:1.6;color:#444;margin-bottom:16px;">${TEMPLATE.intro}</p>
          ${note ? `<div style="background:#F0EEF7;border-left:3px solid #8D5273;padding:12px 16px;border-radius:4px;font-size:14px;font-style:italic;color:#555;margin-bottom:20px;">${note}</div>` : ""}
          ${cards}
          ${goodToKnow}
          <p style="font-size:14px;line-height:1.6;color:#444;margin-bottom:16px;">${nl2br(TEMPLATE.closing)}</p>
          <p style="font-size:14px;color:#333;">${nl2br(TEMPLATE.signoff)}</p>
        </div>
        <div style="background:#36454F;padding:20px 32px;text-align:center;">
          <p style="color:#aaa;font-size:11px;margin:3px 0;"><a href="https://psychologycare.com.au" style="color:#CDA8BA;text-decoration:none;">psychologycare.com.au</a></p>
          <p style="color:#aaa;font-size:11px;margin:3px 0;">© 2026 PsychologyCare. All rights reserved.</p>
        </div>
      </div>
    </div>`;
}

const SendClientModal: React.FC<Props> = ({ selected, locationFilter, onClose, onSent }) => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const practitionerData = useMemo(() =>
    selected.map(p => {
      const locs = locationFilter
        ? p.locations.filter(l => l.location.toLowerCase().includes(locationFilter.toLowerCase()))
        : p.locations;
      return {
        name: p.name,
        title: p.title,
        therapist_type: p.therapist_type,
        fees: p.fees,
        medicare_rebate: p.medicare_rebate,
        availabilityLocations: locs,
        link_to_bio: p.link_to_bio,
        after_hours: hasAfterHoursAvailability(locs.map(l => ({ availability: l.availability }))),
        accepts_couples: p.accepts_couples,
        alert: p.alert,
        short_bio: p.short_bio,
      };
    }),
    [selected, locationFilter]
  );

  const previewHtml = useMemo(() =>
    buildEmailHtml(clientName || "Client", note, practitionerData),
    [clientName, note, practitionerData]
  );

  const handlePreview = () => {
    if (!clientName.trim()) { setError("Please enter the client's name."); return; }
    if (!clientEmail.trim() || !clientEmail.includes("@")) { setError("Please enter a valid email address."); return; }
    setError("");
    setStep("preview");
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const practitionersForEmail = practitionerData.map(p => ({
        ...p,
        availabilityGroups: p.availabilityLocations.map(loc => {
          const { weekly, fortnightly } = parseAvailability(loc.availability || "");
          return { location: loc.location, weekly, fortnightly };
        }).filter(g => g.weekly.length > 0 || g.fortnightly.length > 0),
        availabilityLocations: undefined,
      }));
      const payload = {
        action: "SEND_PRACTITIONER_EMAIL",
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        cc: "anna@psychologycare.com.au",
        note: note.trim(),
        practitioners: practitionersForEmail,
      };

      const response = await fetch("/.netlify/functions/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to send email");
      onSent();
    } catch (e) {
      console.error("Failed to send:", e);
      setError("Something went wrong. Please try again.");
      setStep("form");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className={`modal-box ${step === "preview" ? "max-w-3xl" : "max-w-lg"}`} style={{ maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step === "preview" && (
              <button onClick={() => setStep("form")} className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeft size={16} />
              </button>
            )}
            <h3 className="font-bold text-lg">
              {step === "form" ? "Send to Client" : "Preview Email"}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16} /></button>
        </div>

        {step === "form" ? (
          <>
            <div className="mb-4 p-3 bg-base-200 rounded-lg flex-shrink-0">
              <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2">
                Sending {selected.length} Practitioner{selected.length !== 1 ? "s" : ""}
              </div>
              {selected.map((p, i) => (
                <div key={i} className="text-sm font-medium text-base-content/80">• {p.name} — {p.title}</div>
              ))}
            </div>

            <div className="space-y-3 flex-shrink-0">
              <div>
                <label className="label label-text font-semibold pb-1">Client Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  className="input input-bordered w-full"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="label label-text font-semibold pb-1">Client Email <span className="text-error">*</span></label>
                <input
                  type="email"
                  placeholder="e.g. sarah@email.com"
                  className="input input-bordered w-full"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label label-text font-semibold pb-1">Personal Note <span className="text-base-content/40 font-normal">(optional)</span></label>
                <textarea
                  placeholder="e.g. Based on your intake, we think these practitioners would be a great fit..."
                  className="textarea textarea-bordered w-full text-sm"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
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
              <button onClick={handlePreview} className="btn btn-primary">
                <Eye size={16} /> Preview Email →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-base-content/60 mb-3 flex-shrink-0">
              Sending to: <strong>{clientEmail}</strong> · CC: anna@psychologycare.com.au
            </div>

            <div className="flex-1 overflow-hidden rounded-lg border border-base-300" style={{ minHeight: 0 }}>
              <iframe
                srcDoc={previewHtml}
                style={{ width: "100%", height: "100%", border: "none", minHeight: "450px" }}
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
              <button onClick={handleSend} className="btn btn-success" disabled={sending}>
                {sending ? (
                  <><span className="loading loading-spinner loading-sm" /> Sending...</>
                ) : (
                  <><Send size={16} /> Confirm & Send</>
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
