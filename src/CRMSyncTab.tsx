import React, { useState } from "react";
import { PRACTITIONERS_DATA } from "./practitionersData";

// ── Field mapping definitions ──────────────────────────────────────────────
const FIELD_SOURCES = [
  { field: "Presentations (Clinical Interests)", appKey: "presentations", crmField: "Clinical_Interests", source: "crm", note: "✅ Live — synced from CRM" },
  { field: "Modalities", appKey: "modalities", crmField: "Modalities", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Bio", appKey: "bio", crmField: "Bio", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Short Bio", appKey: "short_bio", crmField: "Short_Bio", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Ages Accepted", appKey: "ages_accepted", crmField: "Ages", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Session Types (Individual/Couples)", appKey: "session_types", crmField: "Client_Types", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Languages", appKey: "languages", crmField: "Languages_I_am_fluent_in", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Pronouns", appKey: "pronouns", crmField: "Pronouns", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Email", appKey: "email", crmField: "Email", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Role / Modality type", appKey: "role", crmField: "Modality", source: "available", note: "🟡 Available in CRM — not yet synced" },
  { field: "Locations", appKey: "locations", crmField: "—", source: "manual", note: "🔵 Manual — set in app config" },
  { field: "Availability", appKey: "availability", crmField: "—", source: "manual", note: "🔵 Manual — CSV import from Zanda" },
  { field: "Photo", appKey: "photo_url", crmField: "—", source: "manual", note: "🔵 Manual — uploaded directly" },
  { field: "Client Gender Accepted", appKey: "client_gender_accepted", crmField: "—", source: "manual", note: "🔵 Manual — set in app config" },
];

// ── CRM snapshot data (pulled 20 Jul 2026) ────────────────────────────────
// name → { presentations, modalities, bio, short_bio, ages, client_types, languages, pronouns, email, role }
const CRM_DATA: Record<string, {
  in_crm: boolean;
  crm_presentations: string[];
  crm_modalities: string[];
  crm_bio: string;
  crm_short_bio: string;
  crm_ages: string[];
  crm_client_types: string[];
  crm_languages: string;
  crm_pronouns: string;
  crm_email: string;
  crm_role: string[];
}> = {
  "Alex Barry": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Cognitive Behavioural Therapy (CBT)","Dialectical Behaviour Therapy (DBT)","Mindfulness-Based Cognitive Therapy (MBCT)","Narrative Therapy","Schema Therapy","Trauma-Informed Care"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Clinical Psychologist"] },
  "Rebekah Barson": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Couples","Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Brigid Blanckenberg": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Cognitive Behavioural Therapy (CBT)","Mindfulness-Based Cognitive Therapy (MBCT)"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Afrikaans", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Amy Bortz": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Ruby Bouhadana": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Attachment-Based Therapy","Behavioural Activation (BA)","Cognitive Behavioural Therapy (CBT)","Dialectical Behaviour Therapy (DBT)","Emotion-Focused Therapy (EFT)","Exposure and Response Prevention (ERP)","Internal Family Systems (IFS) / Parts Work (Informed)","Internal Family Systems (IFS) / Parts Work (Level 1 Certified)","Interpersonal Therapy (IPT)","Motivational Interviewing (MI)","Schema Therapy"], crm_bio: "Ruby Bouhadana has a full bio in CRM", crm_short_bio: "A warm clinical psychology registrar integrating IFS, CBT, ACT, schema and mindfulness to support adults toward self-understanding, compassion and emotionally grounded change.", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "ruby.psychologycare@gmail.com", crm_role: ["Clinical Psychologist"] },
  "Dr Maddie Brygel": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Clinical Psychologist"] },
  "Nick Burden": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Motivational Interviewing (MI)"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "He/Him", crm_email: "", crm_role: ["Mental Health Social Worker"] },
  "Dr Krista De Castella": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: ["Couples"], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Allison Conyer": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Cognitive Behavioural Therapy (CBT)","Emotion-Focused Therapy (EFT)","Gottman Method Couples Therapy"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Couples","Family"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Niloo Danaei": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Farsi", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Dr Christine Deftereos": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Greek", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Clinical Psychologist"] },
  "Oliver Eastwood": { in_crm: false, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: [], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Meg Edelman": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Cognitive Behavioural Therapy (CBT)","Dialectical Behaviour Therapy (DBT)","Mindfulness-Based Cognitive Therapy (MBCT)","Schema Therapy"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Kiira Gavralas": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Jillian Giannios": { in_crm: false, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: [], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Ella Graj": { in_crm: false, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: [], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Cristina Jimenez": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Couples","Individual"], crm_languages: "English, Spanish", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Chiara Killey": { in_crm: true, crm_presentations: [], crm_modalities: ["Acceptance and Commitment Therapy (ACT)","Cognitive Behavioural Therapy (CBT)","Dialectical Behaviour Therapy (DBT)","Schema Therapy"], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Nicholas Kleeman": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "He/Him", crm_email: "", crm_role: ["Psychologist"] },
  "Ricki Knoetze": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Afrikaans", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Joshua Kugel": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "He/Him", crm_email: "", crm_role: ["Psychologist"] },
  "Therese Van Maanen": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Couples"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Belinda Pacella": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Poorna Selvaraja": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Tamil", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
  "Dr David Spektor": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: [], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Peter Steele": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "He/Him", crm_email: "", crm_role: ["Psychologist"] },
  "Stephanie Stewart": { in_crm: false, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: [], crm_client_types: [], crm_languages: "", crm_pronouns: "", crm_email: "", crm_role: [] },
  "Clare Tuttleby": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist"] },
  "Elizabeth White": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Clinical Psychologist"] },
  "Karen Pereira York": { in_crm: true, crm_presentations: [], crm_modalities: [], crm_bio: "", crm_short_bio: "", crm_ages: ["18 Yrs +"], crm_client_types: ["Individual"], crm_languages: "English, Portuguese", crm_pronouns: "She/Her", crm_email: "", crm_role: ["Psychologist Registrar"] },
};

// Populate crm_presentations from the live PRACTITIONERS_DATA (already synced)
PRACTITIONERS_DATA.forEach((p: any) => {
  if (CRM_DATA[p.name]) {
    CRM_DATA[p.name].crm_presentations = p.presentations || [];
  }
});

// ── Helper badges ─────────────────────────────────────────────────────────
function Badge({ type, label }: { type: "crm" | "available" | "manual" | "missing"; label: string }) {
  const styles: Record<string, string> = {
    crm: "bg-green-900 text-green-200 border border-green-700",
    available: "bg-yellow-900 text-yellow-200 border border-yellow-700",
    manual: "bg-blue-900 text-blue-200 border border-blue-700",
    missing: "bg-red-900 text-red-200 border border-red-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[type]}`}>
      {label}
    </span>
  );
}

function CountCell({ app, crm, fieldSynced }: { app: number; crm: number; fieldSynced: boolean }) {
  if (!fieldSynced) {
    return (
      <td className="px-3 py-2 text-center text-sm">
        <span className="text-slate-400">{app}</span>
        {crm > 0 && <span className="text-yellow-400 ml-1">→{crm}</span>}
      </td>
    );
  }
  const match = app === crm;
  return (
    <td className="px-3 py-2 text-center text-sm">
      <span className={match ? "text-green-400 font-semibold" : "text-yellow-400"}>{app}</span>
    </td>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function CRMSyncTab() {
  const [activeSection, setActiveSection] = useState<"fields" | "practitioners">("fields");
  const [expandedPrac, setExpandedPrac] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Section switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection("fields")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "fields" ? "bg-purple-700 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
        >
          📋 Field Sources
        </button>
        <button
          onClick={() => setActiveSection("practitioners")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === "practitioners" ? "bg-purple-700 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
        >
          👥 Practitioner Sync Status
        </button>
      </div>

      {activeSection === "fields" && (
        <div>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span><span className="text-slate-300">Currently synced from CRM</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span><span className="text-slate-300">Available in CRM — not yet synced</span></div>
            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><span className="text-slate-300">Manual only (no CRM field)</span></div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-300 text-left">
                  <th className="px-4 py-3 font-semibold">App Field</th>
                  <th className="px-4 py-3 font-semibold">CRM Field</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {FIELD_SOURCES.map((f) => (
                  <tr key={f.field} className="bg-slate-800/40 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-100 font-medium">{f.field}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{f.crmField}</td>
                    <td className="px-4 py-3">
                      <Badge
                        type={f.source as any}
                        label={f.source === "crm" ? "✅ Synced" : f.source === "available" ? "🟡 Available" : "🔵 Manual"}
                      />
                      <span className="ml-2 text-slate-400 text-xs">{f.note.replace(/^[^\s]+\s/, "")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-yellow-950/40 border border-yellow-700/40 rounded-xl text-sm text-yellow-200">
            <strong>💡 Ready to sync:</strong> Modalities, Bio, Short Bio, Ages, Session Types, Languages, Pronouns and Email are all populated in Zoho CRM and ready to pull into the app. Ask me to sync any of these fields.
          </div>
        </div>
      )}

      {activeSection === "practitioners" && (
        <div>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-300 text-left">
                  <th className="px-4 py-3 font-semibold">Practitioner</th>
                  <th className="px-4 py-3 font-semibold text-center">In CRM?</th>
                  <th className="px-4 py-3 font-semibold text-center">Presentations</th>
                  <th className="px-4 py-3 font-semibold text-center">Modalities</th>
                  <th className="px-4 py-3 font-semibold">CRM Ages</th>
                  <th className="px-4 py-3 font-semibold">CRM Session Types</th>
                  <th className="px-4 py-3 font-semibold">Languages</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {PRACTITIONERS_DATA.map((p: any) => {
                  const crm = CRM_DATA[p.name];
                  const inCRM = crm?.in_crm ?? false;
                  const appPres = (p.presentations || []).length;
                  const crmPres = (crm?.crm_presentations || []).length;
                  const appMod = (p.modalities || []).length;
                  const crmMod = (crm?.crm_modalities || []).length;
                  const isExpanded = expandedPrac === p.name;

                  return (
                    <React.Fragment key={p.name}>
                      <tr className={`${inCRM ? "bg-slate-800/40" : "bg-red-950/20"} hover:bg-slate-700/30 transition-colors`}>
                        <td className="px-4 py-2.5 font-medium text-slate-100">{p.name}</td>
                        <td className="px-4 py-2.5 text-center">
                          {inCRM
                            ? <span className="text-green-400 text-base">✅</span>
                            : <Badge type="missing" label="Not in CRM" />}
                        </td>
                        {/* Presentations — currently synced */}
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-green-400 font-semibold">{appPres}</span>
                          <span className="text-slate-500 text-xs ml-1">synced</span>
                        </td>
                        {/* Modalities — available but not synced */}
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-slate-300">{appMod}</span>
                          {inCRM && crmMod > 0 && crmMod !== appMod && (
                            <span className="text-yellow-400 text-xs ml-1">({crmMod} in CRM)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {inCRM ? (crm.crm_ages.join(", ") || "—") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {inCRM ? (crm.crm_client_types.join(", ") || "—") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {inCRM ? (crm.crm_languages || "—") : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          {inCRM && (
                            <button
                              onClick={() => setExpandedPrac(isExpanded ? null : p.name)}
                              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              {isExpanded ? "▲ hide" : "▼ more"}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && crm && (
                        <tr className="bg-slate-900/60">
                          <td colSpan={8} className="px-6 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400 font-semibold mb-1">CRM Role</p>
                                <p className="text-slate-200">{crm.crm_role.join(", ") || "—"}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-semibold mb-1">Pronouns</p>
                                <p className="text-slate-200">{crm.crm_pronouns || "—"}</p>
                              </div>
                              {crm.crm_short_bio && (
                                <div className="col-span-2">
                                  <p className="text-slate-400 font-semibold mb-1">Short Bio (CRM)</p>
                                  <p className="text-slate-200 leading-relaxed">{crm.crm_short_bio}</p>
                                </div>
                              )}
                              {crmMod > 0 && (
                                <div className="col-span-2">
                                  <p className="text-slate-400 font-semibold mb-1">Modalities in CRM ({crmMod})</p>
                                  <p className="text-slate-300">{crm.crm_modalities.join(" · ")}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs mt-3">Last CRM sync: 20 Jul 2026. Presentations are live-synced. Yellow = CRM has different data, ready to pull.</p>
        </div>
      )}
    </div>
  );
}
