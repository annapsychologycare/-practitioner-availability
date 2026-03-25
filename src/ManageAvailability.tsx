import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Practitioner, Location } from "./types";

interface Props {
  practitioners: Practitioner[];
  onUpdate: (p: Practitioner) => void;
}

// Normalize field that could be string or string[] into editable string
function toEditableString(val: unknown, sep = "; "): string {
  if (!val) return "";
  if (Array.isArray(val)) return (val as string[]).join(sep);
  return String(val);
}

// ── Collapsible Section ───────────────────────────────────────────────────────

const Section: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid #CDA8BA" }}>
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 transition-colors text-left font-semibold text-sm" style={{ backgroundColor: "#F0EEF7", color: "#2C244C" }}
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

// ── Field Components ──────────────────────────────────────────────────────────

const TextField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="label label-text text-xs font-semibold">{label}</label>
    <input
      type="text"
      className="input input-bordered input-sm w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string }> = ({ label, value, onChange, rows = 3, placeholder, hint }) => (
  <div>
    <label className="label label-text text-xs font-semibold">{label}</label>
    {hint && <div className="text-xs text-base-content/50 mb-1">{hint}</div>}
    <textarea
      className="textarea textarea-bordered w-full text-sm"
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// ── Practitioner Editor ───────────────────────────────────────────────────────

function PractitionerEditor({ p, onUpdate, onClose }: { p: Practitioner; onUpdate: (p: Practitioner) => void; onClose: () => void }) {
  // Basic info
  const [title, setTitle] = useState(p.title || "");
  const [gender, setGender] = useState(p.gender || "");
  const [pronouns, setPronouns] = useState(p.pronouns || "");
  const [ageRange, setAgeRange] = useState(p.age_range || "");
  const [clientTypes, setClientTypes] = useState(toEditableString(p.client_types));
  const [therapistType, setTherapistType] = useState(p.therapist_type || "");

  // Clinical
  const [presentations, setPresentations] = useState(toEditableString(p.presentations));
  const [modalities, setModalities] = useState(toEditableString(p.modalities));

  // Fees & billing
  const [fees, setFees] = useState(p.fees || "");
  const [medicareRebate, setMedicareRebate] = useState(p.medicare_rebate || "");
  const [billingTypes, setBillingTypes] = useState(p.billing_types || "");

  // Style
  const [style, setStyle] = useState((p as any).style || "");

  // Profile
  const [shortBio, setShortBio] = useState(p.short_bio || "");
  const [bio, setBio] = useState(p.bio || "");
  const [qualifications, setQualifications] = useState(p.qualifications || "");
  const [additionalInfo, setAdditionalInfo] = useState(p.additional_info || "");
  const [linkToBio, setLinkToBio] = useState(p.link_to_bio || "");
  const [languages, setLanguages] = useState(p.languages || "");
  const [spareTime, setSpareTime] = useState(p.spare_time || "");
  const [papClinician, setPapClinician] = useState(p.pap_clinician || "");
  const [religionsGroups, setReligionsGroups] = useState(p.religions_groups || "");

  // Alert
  const [alert, setAlert] = useState(p.alert || "");

  // Locations & availability
  const [locations, setLocations] = useState<Location[]>(p.locations.map(l => ({
    ...l,
    availability: Array.isArray(l.availability) ? (l.availability as string[]).join("\n") : (l.availability || "")
  })));

  const [saved, setSaved] = useState(false);

  const updateAvailability = (idx: number, val: string) => {
    setLocations(prev => prev.map((l, i) => i === idx ? { ...l, availability: val } : l));
  };
  const addLocation = () => {
    setLocations(prev => [...prev, { location: "", availability: "" }]);
  };
  const removeLocation = (idx: number) => {
    setLocations(prev => prev.filter((_, i) => i !== idx));
  };
  const updateLocationName = (idx: number, val: string) => {
    setLocations(prev => prev.map((l, i) => i === idx ? { ...l, location: val } : l));
  };

  const save = () => {
    const today = new Date().toISOString().split("T")[0];
    const updated: Practitioner = {
      ...p,
      title,
      gender,
      pronouns,
      age_range: ageRange,
      client_types: clientTypes,
      therapist_type: therapistType,
      presentations,
      modalities,
      fees,
      medicare_rebate: medicareRebate,
      billing_types: billingTypes,
      short_bio: shortBio,
      bio,
      qualifications,
      additional_info: additionalInfo,
      link_to_bio: linkToBio,
      languages,
      spare_time: spareTime,
      pap_clinician: papClinician,
      religions_groups: religionsGroups,
      style,
      alert,
      locations,
      last_updated: today,
    };
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-3 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold">{p.name}</h3>
            <p className="text-sm text-base-content/60">{p.title}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {/* Alert/Note */}
          <Section title="⚠️ Alert / Note (internal only)" defaultOpen={!!alert}>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={3}
              value={alert}
              onChange={e => setAlert(e.target.value)}
              placeholder="Internal notes, restrictions, etc."
            />
          </Section>

          {/* Basic Info */}
          <Section title="Basic Info" defaultOpen={false}>
            <TextField label="Title" value={title} onChange={setTitle} placeholder="e.g. Psychologist" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Gender" value={gender} onChange={setGender} />
              <TextField label="Pronouns" value={pronouns} onChange={setPronouns} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Age Range" value={ageRange} onChange={setAgeRange} placeholder="e.g. 18 Yrs +" />
              <TextField label="Client Types" value={clientTypes} onChange={setClientTypes} placeholder="e.g. Individual, Couples" />
            </div>
            <TextField label="Therapist Type" value={therapistType} onChange={setTherapistType} placeholder="e.g. Psychologist" />
            <TextField label="Languages" value={languages} onChange={setLanguages} />
          </Section>

          {/* Clinical */}
          <Section title="Presentations & Modalities" defaultOpen={false}>
            <TextAreaField
              label="Presentations"
              value={presentations}
              onChange={setPresentations}
              rows={4}
              hint="Separate with semicolons (;)"
              placeholder="Anxiety; Depression; Trauma..."
            />
            <TextAreaField
              label="Modalities"
              value={modalities}
              onChange={setModalities}
              rows={3}
              hint="Separate with semicolons (;) or slashes (/)"
              placeholder="CBT / ACT / Schema Therapy..."
            />
          </Section>

          {/* Fees & Billing */}
          <Section title="Fees & Billing" defaultOpen={false}>
            <TextAreaField
              label="Fees"
              value={fees}
              onChange={setFees}
              rows={2}
              placeholder="B/H: $235&#10;A/H: $275"
            />
            <TextField label="Medicare Rebate" value={medicareRebate} onChange={setMedicareRebate} placeholder="e.g. 96.65" />
            <TextField label="Billing Types" value={billingTypes} onChange={setBillingTypes} placeholder="e.g. Self Funded (Private paying), Medicare Rebate" />
          </Section>

          {/* Profile & Bio */}
          <Section title="Profile & Bio" defaultOpen={false}>
            <TextField label="Therapist Style" value={style} onChange={setStyle} placeholder="e.g. Calm, Compassionate, Warm, Direct" />
            <div className="text-xs text-base-content/50 mb-2">Comma-separated personality keywords shown as tags in search</div>
            <TextAreaField label="Short Bio (email/cards)" value={shortBio} onChange={setShortBio} rows={3} placeholder="Brief description for emails..." />
            <TextAreaField label="Full Bio" value={bio} onChange={setBio} rows={6} placeholder="Full practitioner bio..." />
            <TextField label="Qualifications" value={qualifications} onChange={setQualifications} />
            <TextAreaField label="Additional Info" value={additionalInfo} onChange={setAdditionalInfo} rows={3} />
            <TextField label="Link to Bio" value={linkToBio} onChange={setLinkToBio} placeholder="https://psychologycare.com.au/..." />
            <TextField label="Spare Time / Interests" value={spareTime} onChange={setSpareTime} />
            <TextField label="PAP Clinician" value={papClinician} onChange={setPapClinician} />
            <TextField label="Religion / Groups" value={religionsGroups} onChange={setReligionsGroups} />
          </Section>

          {/* Availability */}
          <Section title="Availability by Location" defaultOpen={true}>
            <div className="text-xs text-base-content/50 mb-2">
              Format: <span className="font-mono bg-base-200 px-1 rounded">* Mondays at 9am (Weekly: Starting 25th Feb)</span> or <span className="font-mono bg-base-200 px-1 rounded">* Tuesdays at 3PM (Fortnightly: Starting 26th Feb)</span>
            </div>

            {locations.map((loc, idx) => (
              <div key={idx} className="mb-3 rounded-xl p-4" style={{ backgroundColor: "#F0EEF7" }}>
                <div className="flex gap-2 mb-2">
                  <select
                    className="select select-bordered select-sm flex-1"
                    value={loc.location}
                    onChange={e => updateLocationName(idx, e.target.value)}
                  >
                    <option value="">Select location...</option>
                    <option key="greville" value="Greville St, Prahran">Greville St, Prahran</option>
                    <option key="malvern" value="Wattletree Rd, Malvern">Wattletree Rd, Malvern</option>
                    <option key="stkilda" value="Victoria St, St Kilda">Victoria St, St Kilda</option>
                    <option key="telehealth" value="Telehealth">Telehealth</option>
                    {loc.location && !["Greville St, Prahran", "Wattletree Rd, Malvern", "Victoria St, St Kilda", "Telehealth"].includes(loc.location) && (
                      <option key="custom" value={loc.location}>{loc.location}</option>
                    )}
                  </select>
                  <button onClick={() => removeLocation(idx)} className="btn btn-ghost btn-sm btn-circle text-error">✕</button>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full text-sm font-mono"
                  rows={4}
                  value={loc.availability as string}
                  onChange={e => updateAvailability(idx, e.target.value)}
                  placeholder={"* Mondays at 9am (Weekly: Starting 25th Feb)\n* Tuesdays at 3PM (Fortnightly: Starting 26th Feb)"}
                />
              </div>
            ))}

            <button onClick={addLocation} className="btn btn-outline btn-sm">+ Add Location</button>
          </Section>
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 flex gap-3 justify-end flex-shrink-0 border-t border-base-300">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={save} className={`btn ${saved ? "btn-success" : "btn-primary"}`}>
            {saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main List ─────────────────────────────────────────────────────────────────

const ManageAvailability: React.FC<Props> = ({ practitioners, onUpdate }) => {
  const [editing, setEditing] = useState<Practitioner | null>(null);
  const [search, setSearch] = useState("");

  const filtered = [...practitioners].sort((a, b) => a.name.localeCompare(b.name)).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getAvailabilitySummary = (p: Practitioner): string => {
    const lines = p.locations
      .filter(l => l.availability && (Array.isArray(l.availability) ? l.availability.length > 0 : (l.availability as string).trim()))
      .flatMap(l => Array.isArray(l.availability) ? l.availability : (l.availability as string).split("\n").filter(s => s.trim()));
    return lines.length > 0 ? lines[0].trim() + (lines.length > 1 ? ` +${lines.length - 1} more` : "") : "";
  };

  const hasAvailability = (p: Practitioner) => p.locations.some(l => l.availability && (Array.isArray(l.availability) ? l.availability.length > 0 : (l.availability as string).trim()));

  return (
    <div>
      {editing && (
        <PractitionerEditor
          p={editing}
          onUpdate={onUpdate}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search practitioners..."
          className="input input-bordered flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="text-sm text-base-content/60 whitespace-nowrap">
          {filtered.filter(hasAvailability).length} / {filtered.length} have availability
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map(p => {
          const avail = hasAvailability(p);
          const summary = getAvailabilitySummary(p);
          return (
            <div key={p.name} className="card bg-white shadow-sm transition-colors" style={{ border: "1px solid #CDA8BA" }}>
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{p.name}</span>
                      <span className={`badge badge-sm ${avail ? "badge-success" : "badge-ghost"}`}>
                        {avail ? "Has availability" : "No availability"}
                      </span>
                      {p.alert && <span className="badge badge-warning badge-sm">⚠ Note</span>}
                    </div>
                    <div className="text-sm text-base-content/60 mt-0.5">{p.title}</div>
                    {summary && (
                      <div className="text-sm text-success mt-1 truncate">{summary}</div>
                    )}
                    <div className="flex gap-1 flex-wrap mt-1">
                      {p.locations.map((l, i) => (
                        <span key={i} className="badge badge-outline badge-xs">📍 {l.location}</span>
                      ))}
                    </div>
                    {p.last_updated && (
                      <div className="text-xs text-base-content/40 mt-1">Last updated: {p.last_updated}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(p)}
                    className="btn btn-primary btn-sm flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ManageAvailability;
