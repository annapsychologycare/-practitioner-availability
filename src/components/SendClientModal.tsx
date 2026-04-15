import React, { useState, useMemo } from "react";
import { Send, X, ArrowLeft, Eye } from "lucide-react";
import { Practitioner } from "../types";
import { hasAfterHoursAvailability } from "../utils/afterHours";

interface Props {
  selected: Practitioner[];
  locationFilter: string;
  onClose: () => void;
  onSent: () => void;
}

const SENDER_OPTIONS = ["Anna Donaldson", "Charlotte Davenport"];

const INTRO_TEXT =
  "Thank you for reaching out to PsychologyCare. Based on your intake information, we've put together a list of practitioners we think could be a great fit for you.";

const CLOSING_TEXT =
  "At PsychologyCare, we place a strong emphasis on consistency and continuity of care. Once you secure a regular appointment time, that time is held just for you.\n\nFor example, if you book Mondays at 9:00AM, that becomes your dedicated therapy time each week or fortnight. We don't overbook or rotate clients through shared timeslots — your space is yours. We've found this consistency really supports therapeutic progress and creates a sense of stability.\n\nIf one of these practitioners resonates with you, simply let me know your preferred day and time and I'll secure it for you. If you'd like to talk through the options first, I'm very happy to do that as well.\n\nPlease don't hesitate to reach out with any questions at all — I'm here to help make this process feel as smooth as possible.";

// ── Availability helpers ─────────────────────────────────────────────────────

function parseAvailability(text: string | string[]): { weekly: string[]; fortnightly: string[] } {
  const weekly: string[] = [];
  const fortnightly: string[] = [];
  if (!text) return { weekly, fortnightly };
  const lines = Array.isArray(text)
    ? text.map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean)
    : text.split("\n").map((l) => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
  for (const line of lines) {
    if (/\(Monthly:/i.test(line)) continue;
    const cleaned = line
      .replace(/ at /i, " ")
      .replace(/\s*\((Weekly|Fortnightly): Starting ([^)]+)\)/i, " · from $2");
    if (/\(Weekly:/i.test(line)) weekly.push(cleaned);
    else if (/\(Fortnightly:/i.test(line)) fortnightly.push(cleaned);
  }
  return { weekly, fortnightly };
}

function renderSlotLine(slot: string, type: "weekly" | "fortnightly"): string {
  const dotIdx = slot.indexOf(" · from ");
  if (dotIdx > -1) {
    const dayTime = slot.substring(0, dotIdx).trim();
    const date = slot.substring(dotIdx + 8).trim();
    const formatted = /\sat\s/.test(dayTime)
      ? dayTime
      : dayTime.replace(/^(\S+)\s+/, "$1 at ");
    return `• ${formatted} (${type}) — from ${date}`;
  }
  return `• ${slot}`;
}

function buildAvailabilitySection(
  locations: Array<{ location: string; availability: string | string[] }>
): string {
  const activeLocs = locations.filter((l) => {
    const { weekly, fortnightly } = parseAvailability(l.availability || "");
    return weekly.length > 0 || fortnightly.length > 0;
  });
  if (activeLocs.length === 0) {
    return `<div style="padding:18px 22px 0;"><div style="font-size:11px;font-weight:700;color:#8D5273;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Availability</div><div style="font-size:14px;color:#555;font-style:italic;line-height:1.6;">Currently fully booked — waitlist availability only.<br><span style="font-style:normal;color:#666;">We can add you to the waitlist for your preferred days and times.</span></div></div>`;
  }
  let html = "";
  for (const loc of activeLocs) {
    const { weekly, fortnightly } = parseAvailability(loc.availability);
    const locLabel = ` — ${loc.location}`;
    const slots = [
      ...weekly.map((s) => renderSlotLine(s, "weekly")),
      ...fortnightly.map((s) => renderSlotLine(s, "fortnightly")),
    ];
    html += `<div style="padding:18px 22px 0;"><div style="font-size:11px;font-weight:700;color:#8D5273;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px;">Availability${locLabel}</div><div style="font-size:14px;color:#333;line-height:2;">${slots.join("<br>")}</div></div>`;
  }
  return html;
}

function formatFeesInline(fees: string): string {
  return fees
    .replace(/B\/H:/g, "Business Hours:")
    .replace(/A\/H:/g, "After Hours:")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" &nbsp;&middot;&nbsp; ");
}

function formatMedicareInline(rebate: string): string {
  if (!rebate) return "";
  const lines = rebate.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const first = lines[0];
  const isAmount = /^[\$\d]/.test(first);
  if (isAmount) {
    const amt = first.startsWith("$") ? first : `$${first}`;
    const extras = lines.slice(1);
    let html = `${amt} per session`;
    if (extras.length)
      html += `<br><span style="font-size:12px;color:#777;font-style:italic;">${extras.join("<br>")}</span>`;
    html += `<br><span style="font-size:12px;color:#777;font-style:italic;">Valid with an eligible Mental Health Treatment Plan and GP referral.</span>`;
    return html;
  }
  return `<span style="font-size:13px;color:#777;font-style:italic;">${first}</span>`;
}

// ── Main email HTML builder ──────────────────────────────────────────────────

function buildEmailHtml(
  clientName: string,
  note: string,
  senderName: string,
  practitioners: Array<{
    name: string;
    title: string;
    fees: string;
    medicare_rebate: string;
    availabilityLocations: Array<{ location: string; availability: string | string[] }>;
    link_to_bio: string;
    short_bio?: string;
    working_hours?: string;
  }>
): string {
  let cards = "";
  for (const p of practitioners) {
    const availHtml = buildAvailabilitySection(p.availabilityLocations || []);
    const feesInline = formatFeesInline(p.fees || "");
    const medicareInline = formatMedicareInline(p.medicare_rebate || "");
    const profileLink = p.link_to_bio
      ? `<div style="padding:12px 22px;background:#faf9fd;border-top:1px solid #ede9f5;text-align:right;"><a href="${p.link_to_bio}" style="font-size:13px;color:#8D5273;font-weight:600;text-decoration:none;">View full profile →</a></div>`
      : "";

    cards += `
      <div style="border:1px solid #c4bbd8;border-radius:10px;margin-bottom:24px;overflow:hidden;">
        <div style="padding:20px 22px;border-bottom:1px solid #ede9f5;">
          <div style="font-size:17px;font-weight:700;color:#2C244C;">${p.name}</div>
          <div style="font-size:13px;color:#8D5273;margin-top:3px;">${p.title}</div>
          ${p.short_bio ? `<div style="font-size:13px;color:#666;font-style:italic;margin-top:10px;line-height:1.7;">${p.short_bio}</div>` : ""}
          ${p.working_hours ? `<div style="font-size:12px;color:#8D5273;margin-top:8px;line-height:1.6;">🕐 ${p.working_hours}</div>` : ""}
        </div>
        ${availHtml}
        ${feesInline || medicareInline ? `
        <div style="padding:14px 22px 16px;font-size:13px;color:#444;line-height:1.9;border-top:1px solid #e8e4f0;">
          ${feesInline ? `<div><span style="font-weight:700;color:#2C244C;">Fees:</span> ${feesInline}</div>` : ""}
          ${medicareInline ? `<div style="margin-top:4px;"><span style="font-weight:700;color:#2C244C;">Medicare Rebate:</span> ${medicareInline}</div>` : ""}
        </div>` : ""}
        ${profileLink}
      </div>`;
  }

  const goodToKnow = `
    <div style="background:#ffffff;padding:24px 28px;border-top:1px solid #ede9f5;">
      <div style="font-size:13px;font-weight:700;color:#2C244C;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">Good to Know</div>
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:#2C244C;margin-bottom:4px;">Medicare Rebates</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">Medicare allows up to 10 sessions per calendar year under a Mental Health Treatment Plan. You pay the full fee upfront and the rebate is processed directly to your account. Ask your GP for a referral and MHTP if you don't already have one.</div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:#2C244C;margin-bottom:4px;">After-Hours Appointments</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">Please note that appointments booked for 5 PM (and later) and Weekend appointments are classified as after-hours appointments and attract a higher fee.</div>
      </div>
      <div style="margin-bottom:0;">
        <div style="font-size:13px;font-weight:700;color:#2C244C;margin-bottom:4px;">Private Health Insurance</div>
        <div style="font-size:13px;color:#555;line-height:1.7;">Please contact your insurer to confirm coverage for your specific practitioner type — our practice includes psychologists, counsellors, mental health social workers, and psychotherapists. Please also note that Medicare and private health insurance cannot be used together for the same appointment.</div>
      </div>
    </div>`;

  const closingHtml = CLOSING_TEXT.replace(/\n/g, "<br>");

  const signature = `
    <div style="border-top:1px solid #ede9f5;padding-top:16px;margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:#2C244C;margin-bottom:6px;">PsychologyCare VIC</div>
      <div style="font-size:12px;color:#666;line-height:1.9;">
        PH: 03 9088 1122 &nbsp;&nbsp; Fax: 03 9972 2606<br>
        Email: <a href="mailto:info@psychologycare.com.au" style="color:#8D5273;text-decoration:none;">info@psychologycare.com.au</a> &nbsp;&nbsp;
        Web: <a href="https://www.psychologycare.com.au" style="color:#8D5273;text-decoration:none;">www.psychologycare.com.au</a><br>
        167 Wattletree Road, MALVERN 3144 &nbsp;|&nbsp; 183A Greville Street, PRAHRAN 3181 &nbsp;|&nbsp; 185A Greville Street, PRAHRAN 3181
      </div>
    </div>`;

  const disclaimer = `
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #ede9f5;">
      <div style="font-size:11px;color:#999;line-height:1.7;">
        <strong style="color:#888;">DISCLAIMER:</strong> PsychologyCare is not a mental health crisis service and cannot provide urgent or immediate support. If immediate mental health assistance is required, please contact emergency services on 000 or Lifeline on 13 11 14.<br><br>
        This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed. This message contains confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by email if you have received this e-mail by mistake and delete this email from your system. If you are not the intended recipient you are notified that disclosing, copying, distributing or taking any action in reliance on the contents of this information is strictly prohibited.<br><br>
        Please note: There are inherent confidentiality risks in communicating by email. While safeguards are in place to ensure your privacy, you should not use email communication if you are concerned about any breaches of privacy that might inadvertently occur.
      </div>
    </div>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;padding:28px 0;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 12px rgba(44,36,76,0.10);">
        <div style="height:4px;background:linear-gradient(90deg,#2C244C 0%,#8D5273 60%,#CDA8BA 100%);"></div>
        <div style="padding:32px 28px;">
          <div style="font-size:16px;font-weight:600;color:#2C244C;margin-bottom:10px;">Hi ${clientName},</div>
          <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 28px;">${INTRO_TEXT}</p>
          ${note ? `<div style="background:#F0EEF7;border-left:3px solid #8D5273;padding:12px 16px;border-radius:4px;font-size:14px;font-style:italic;color:#555;margin-bottom:20px;">${note}</div>` : ""}
          ${cards}
        </div>
        ${goodToKnow}
        <div style="padding:28px 28px 24px;border-top:1px solid #ede9f5;background:#fff;">
          <p style="font-size:14px;line-height:1.8;color:#555;margin:0 0 24px;">${closingHtml}</p>
          <p style="font-size:14px;color:#555;margin:0 0 4px;">Warm regards,</p>
          <p style="font-size:14px;font-weight:700;color:#2C244C;margin:0 0 20px;">${senderName}</p>
          ${signature}
          ${disclaimer}
        </div>
        <div style="background:#2C244C;padding:14px 28px;text-align:center;">
          <div style="font-size:12px;color:#CDA8BA;">PsychologyCare &nbsp;·&nbsp; info@psychologycare.com.au</div>
        </div>
      </div>
    </div>`;
}

// ── Component ────────────────────────────────────────────────────────────────

const SendClientModal: React.FC<Props> = ({ selected, locationFilter, onClose, onSent }) => {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("anna@psychologycare.com.au");
  const [senderName, setSenderName] = useState(SENDER_OPTIONS[0]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const practitionerData = useMemo(
    () =>
      selected.map((p) => {
        const locs = locationFilter
          ? p.locations.filter((l) =>
              l.location.toLowerCase().includes(locationFilter.toLowerCase())
            )
          : p.locations;
        return {
          name: p.name,
          title: p.title,
          therapist_type: p.therapist_type,
          fees: p.fees,
          medicare_rebate: p.medicare_rebate,
          availabilityLocations: locs,
          link_to_bio: p.link_to_bio,
          after_hours: hasAfterHoursAvailability(
            locs.map((l) => ({ availability: l.availability }))
          ),
          accepts_couples: p.accepts_couples,
          alert: p.alert,
          short_bio: p.short_bio,
          working_hours: (p as any).working_hours,
        };
      }),
    [selected, locationFilter]
  );

  const previewHtml = useMemo(
    () => buildEmailHtml(clientName || "Client", note, senderName, practitionerData),
    [clientName, note, senderName, practitionerData]
  );

  const handlePreview = () => {
    if (!clientName.trim()) { setError("Please enter the client's name."); return; }
    setError("");
    setStep("preview");
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const ccList = ccEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.includes("@"));

      const payload = {
        action: "SEND_PRACTITIONER_EMAIL",
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        cc: ccList,
        senderName,
        emailHtml: previewHtml,
      };
      await window.tasklet.sendMessageToAgent(JSON.stringify(payload));
      onSent();
    } catch (e) {
      console.error("Failed to send:", e);
      setError("Something went wrong. Please try again.");
      setStep("form");
    } finally {
      setSending(false);
    }
  };

  const ccDisplay = ccEmails.split(",").map((e) => e.trim()).filter(Boolean).join(", ");

  return (
    <div className="modal modal-open">
      <div
        className={`modal-box ${step === "preview" ? "max-w-3xl" : "max-w-lg"}`}
        style={{ maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
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
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X size={16} />
          </button>
        </div>

        {step === "form" ? (
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
                  {SENDER_OPTIONS.map((name) => (
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
              <button onClick={handlePreview} className="btn btn-primary">
                <Eye size={16} /> Preview Email →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-base-content/60 mb-3 flex-shrink-0 space-y-0.5">
              {clientEmail.trim() && <div>To: <strong>{clientEmail}</strong></div>}
              {ccDisplay && <div>CC: <strong>{ccDisplay}</strong></div>}
              <div>From: <strong>{senderName}</strong></div>
            </div>

            <div
              className="flex-1 overflow-hidden rounded-lg border border-base-300"
              style={{ minHeight: 0 }}
            >
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
