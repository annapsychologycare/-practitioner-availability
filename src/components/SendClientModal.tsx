import React, { useState, useMemo } from "react";
import { Send, X, ArrowLeft, Eye, Clipboard, ClipboardCheck } from "lucide-react";
import { Practitioner } from "../types";
import { hasAfterHoursAvailability } from "../utils/afterHours";
import { loadEmailTemplateConfig } from "../emailTemplateConfig";
import { buildEmailHtml } from "../utils/emailBuilder";

interface Props {
  selected: Practitioner[];
  locationFilter: string;
  onClose: () => void;
  onSent: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const SendClientModal: React.FC<Props> = ({ selected, locationFilter, onClose, onSent }) => {
  // Load config from localStorage (reflects any edits made in Email Template tab)
  const config = useMemo(() => loadEmailTemplateConfig(), []);

  const [step, setStep] = useState<"form" | "preview">("form");
  const [copied, setCopied] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("anna@psychologycare.com.au");
  const [senderName, setSenderName] = useState(config.senders[0] || "Anna Donaldson");
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
          location_notes: (p as any).location_notes,
          photo_url: (p as any).photo_url,
        };
      }),
    [selected, locationFilter]
  );

  const previewHtml = useMemo(
    () => buildEmailHtml(clientName || "Client", note, senderName, practitionerData, config),
    [clientName, note, senderName, practitionerData, config]
  );

  const handleCopyEmail = () => {
    try {
      // Use a hidden textarea + execCommand — works in sandboxed iframes
      const ta = document.createElement("textarea");
      ta.value = previewHtml;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

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

      // Send via serverless function (keeps webhook URL server-side)
      const response = await fetch("/.netlify/functions/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error?.includes("Webhook URL not configured")) {
          throw new Error("Email service not configured. Please contact Anna.");
        }
        throw new Error(`Send failed (${response.status})`);
      }

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
              <button
                onClick={handleCopyEmail}
                className="btn btn-outline"
                style={{ borderColor: "#8D5273", color: copied ? "#47B2AE" : "#8D5273" }}
                title="Copy email to paste into your PMS"
              >
                {copied ? <><ClipboardCheck size={16} /> Copied!</> : <><Clipboard size={16} /> Copy Email</>}
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
