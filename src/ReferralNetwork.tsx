import React, { useState, useMemo, useRef, useEffect } from "react";
import { CANONICAL_PRESENTATIONS, CANONICAL_MODALITIES } from "./constants";

interface Practitioner {
  id: number;
  name: string;
  title?: string;
  therapist_type?: string;
  gender?: string;
  age_range?: string;
  presentations?: string | string[];
  modalities?: string | string[];
  billing_types?: string;
  client_types?: string;
  bio?: string;
  short_bio?: string;
  link_to_bio?: string;
  qualifications?: string;
  languages?: string;
  photo_url?: string;
  active?: boolean;
  referral_only?: boolean;
  referral_contact?: string;
  referral_website?: string;
  referral_source?: string; // "former_pc" | "external"
  former_pc?: boolean;
  current_clinic?: string;
}

const BRAND = {
  lilac: "#7C6B9E",
  lightLilac: "#EAE6F2",
  teal: "#4A9B9A",
  text: "#2d2d2d",
  subtext: "#6b7280",
  border: "#e5e7eb",
  bg: "#fafafa",
};

function safeArr(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(/[,|]/).map(s => s.trim()).filter(Boolean);
}

// ── Reusable form components ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", border: `1px solid #e5e7eb`, borderRadius: 6,
  padding: "6px 10px", fontSize: 13, boxSizing: "border-box", background: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 13, color: "#2d2d2d", marginBottom: 4,
};

const THERAPIST_TYPES = [
  "Clinical Psychologist", "Registered Psychologist", "Psychologist",
  "Counsellor", "Social Worker", "Psychiatrist", "Neuropsychologist", "Other",
];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Other"];

const AGE_RANGE_OPTIONS = [
  "Children (5–12 Yrs)", "Adolescents (13–17 Yrs)", "Adults (18+ Yrs)",
  "Older Adults (65+ Yrs)", "All Ages",
];

const BILLING_OPTIONS = [
  "Medicare Rebate", "NDIS", "WorkSafe", "EAP", "Self Funded", "Third Party",
];

/** Simple select dropdown */
const SelectField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}> = ({ label, value, onChange, options, placeholder }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={labelStyle}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
      <option value="">{placeholder || "Select…"}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/** Searchable multi-select with chip display */
const SearchableMultiSelect: React.FC<{
  label: string; selected: string[]; onChange: (v: string[]) => void;
  options: string[]; placeholder?: string;
}> = ({ label, selected, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() =>
    options.filter(o => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o)),
    [options, search, selected]
  );

  const toggle = (o: string) => {
    onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
  };

  return (
    <div style={{ marginBottom: 12 }} ref={ref}>
      <label style={labelStyle}>{label}</label>
      {/* Chip display + trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          ...inputStyle, minHeight: 36, cursor: "pointer", display: "flex",
          flexWrap: "wrap", gap: 4, alignItems: "center", paddingBottom: selected.length ? 4 : 6,
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: "#9ca3af", fontSize: 13 }}>{placeholder || "Select…"}</span>
        )}
        {selected.map(s => (
          <span key={s} style={{
            background: "#ede9f7", color: "#7C6B9E", borderRadius: 20,
            padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
          }}>
            {s}
            <span
              onMouseDown={e => { e.stopPropagation(); toggle(s); }}
              style={{ cursor: "pointer", fontWeight: 700, marginLeft: 2 }}
            >×</span>
          </span>
        ))}
        <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 11 }}>▾</span>
      </div>
      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", zIndex: 999, background: "#fff",
          border: `1px solid #e5e7eb`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxHeight: 260, overflow: "hidden", display: "flex", flexDirection: "column",
          width: "calc(100% - 2px)", minWidth: 260,
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ ...inputStyle, fontSize: 12 }}
              onMouseDown={e => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 200 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 14px", fontSize: 12, color: "#9ca3af" }}>No options found</div>
            )}
            {filtered.map(o => (
              <div
                key={o}
                onMouseDown={e => { e.preventDefault(); toggle(o); }}
                style={{
                  padding: "7px 14px", fontSize: 13, cursor: "pointer",
                  background: "#fff", transition: "background 0.1s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f3ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                {o}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** Checkbox group for small sets (e.g. billing) */
const CheckboxGroup: React.FC<{
  label: string; selected: string[]; onChange: (v: string[]) => void; options: string[];
}> = ({ label, selected, onChange, options }) => {
  const toggle = (o: string) => onChange(
    selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]
  );
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", paddingTop: 4 }}>
        {options.map(o => (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer", fontWeight: "normal" }}>
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => toggle(o)}
              style={{ accentColor: "#7C6B9E" }}
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
};

// ── Add Referral Form ─────────────────────────────────────────────────────────

interface AddReferralFormProps {
  onAdd: (p: Practitioner) => void;
  onCancel: () => void;
  initialValues?: Practitioner;
}

const AddReferralForm: React.FC<AddReferralFormProps> = ({ onAdd, onCancel, initialValues }) => {
  const iv = initialValues;
  const [name, setName] = useState(iv?.name ?? "");
  const [title, setTitle] = useState(iv?.title ?? "");
  const [therapistType, setTherapistType] = useState(iv?.therapist_type ?? "");
  const [gender, setGender] = useState(iv?.gender ?? "");
  const [ageRange, setAgeRange] = useState(iv?.age_range ?? "");
  const [billingTypes, setBillingTypes] = useState<string[]>(
    iv?.billing_types ? iv.billing_types.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  const [presentations, setPresentations] = useState<string[]>(
    Array.isArray(iv?.presentations) ? iv!.presentations as string[] : []
  );
  const [modalities, setModalities] = useState<string[]>(
    Array.isArray(iv?.modalities) ? iv!.modalities as string[] : []
  );
  const [clientTypes, setClientTypes] = useState(iv?.client_types ?? "");
  const [shortBio, setShortBio] = useState(iv?.short_bio ?? "");
  const [qualifications, setQualifications] = useState(iv?.qualifications ?? "");
  const [languages, setLanguages] = useState(iv?.languages ?? "");
  const [referralContact, setReferralContact] = useState(iv?.referral_contact ?? "");
  const [referralWebsite, setReferralWebsite] = useState(iv?.referral_website ?? "");
  const [isFormerPC, setIsFormerPC] = useState(iv?.former_pc ?? (!iv?.referral_source || iv?.referral_source === "former_pc"));
  const [currentClinic, setCurrentClinic] = useState(iv?.current_clinic ?? "");

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string, type: "input" | "textarea" = "input") => (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      {type === "textarea"
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={inputStyle} />
      }
    </div>
  );

  const handleAdd = () => {
    if (!name.trim()) { alert("Name is required."); return; }
    const newP: Practitioner = {
      id: iv?.id ?? Date.now(),
      name: name.trim(),
      title,
      therapist_type: therapistType,
      gender,
      age_range: ageRange,
      presentations,
      modalities,
      billing_types: billingTypes.join(", "),
      client_types: clientTypes,
      short_bio: shortBio,
      qualifications,
      languages,
      referral_contact: referralContact,
      referral_website: referralWebsite,
      former_pc: isFormerPC,
      current_clinic: currentClinic.trim() || undefined,
      active: false,
      referral_only: true,
      referral_source: isFormerPC ? "former_pc" : "external",
    };
    onAdd(newP);
  };

  return (
    <div style={{ background: "#fff", border: `1px solid #e5e7eb`, borderRadius: 12, padding: 20, marginBottom: 24, position: "relative" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#7C6B9E" }}>{iv ? `✏️ Edit — ${iv.name}` : "➕ Add External Referral"}</h3>

      {/* Row 1: Name + Title */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div>{field("Full Name *", name, setName, "e.g. Dr Jane Smith")}</div>
        <div>{field("Title / Role", title, setTitle, "e.g. Clinical Psychologist")}</div>
      </div>

      {/* Row 2: Therapist Type + Gender */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <SelectField label="Therapist Type" value={therapistType} onChange={setTherapistType} options={THERAPIST_TYPES} placeholder="Select type…" />
        <SelectField label="Gender" value={gender} onChange={setGender} options={GENDER_OPTIONS} placeholder="Select gender…" />
      </div>

      {/* Row 3: Age Range + Languages */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <SelectField label="Age Range" value={ageRange} onChange={setAgeRange} options={AGE_RANGE_OPTIONS} placeholder="Select age range…" />
        <div>{field("Languages", languages, setLanguages, "e.g. English, Spanish")}</div>
      </div>

      {/* Billing Types — checkboxes */}
      <CheckboxGroup label="Billing Types" selected={billingTypes} onChange={setBillingTypes} options={BILLING_OPTIONS} />

      {/* Presentations — searchable multi-select */}
      <SearchableMultiSelect
        label="Specialties / Presentations"
        selected={presentations}
        onChange={setPresentations}
        options={CANONICAL_PRESENTATIONS}
        placeholder="Select presentations…"
      />

      {/* Modalities — searchable multi-select */}
      <SearchableMultiSelect
        label="Therapy Modalities"
        selected={modalities}
        onChange={setModalities}
        options={CANONICAL_MODALITIES}
        placeholder="Select modalities…"
      />

      {/* Former PC + Current Clinic */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", alignItems: "start" }}>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Former PC Practitioner?</label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 6 }}>
            <input
              type="checkbox"
              checked={isFormerPC}
              onChange={e => setIsFormerPC(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#7C6B9E", cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: isFormerPC ? "#7C6B9E" : "#6b7280", fontWeight: isFormerPC ? 600 : 400 }}>
              {isFormerPC ? "Yes — former PC practitioner" : "No — external referral"}
            </span>
          </label>
        </div>
        <div>{field("Current Clinic / Practice", currentClinic, setCurrentClinic, "e.g. Melbourne Psych Group")}</div>
      </div>

      {/* Row: Contact + Website */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div>{field("Contact / Email", referralContact, setReferralContact, "e.g. jane@example.com")}</div>
        <div>{field("Website / Profile URL", referralWebsite, setReferralWebsite, "e.g. https://…")}</div>
      </div>

      {field("Short Bio / Notes", shortBio, setShortBio, "Brief notes about this referral…", "textarea")}
      {field("Qualifications", qualifications, setQualifications, "e.g. MPsych(Clin), MAPS")}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={handleAdd}
          style={{ background: "#7C6B9E", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          {iv ? "Save Changes" : "Add to Network"}
        </button>
        <button onClick={onCancel}
          style={{ background: "#fff", color: "#6b7280", border: `1px solid #e5e7eb`, borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface ReferralCardProps {
  p: Practitioner;
  onEdit: (p: Practitioner) => void;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ p, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const presentations = safeArr(p.presentations);
  const modalities = safeArr(p.modalities);
  const isFormerPC = !p.referral_source || p.referral_source === "former_pc";

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: 18, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {p.photo_url && (
          <img src={p.photo_url} alt={p.name}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${BRAND.lightLilac}` }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: BRAND.text }}>{p.name}</h3>
            <span style={{
              background: isFormerPC ? BRAND.lightLilac : "#e0f2f1",
              color: isFormerPC ? BRAND.lilac : BRAND.teal,
              border: `1px solid ${isFormerPC ? BRAND.lilac : BRAND.teal}`,
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
            }}>
              {isFormerPC ? "Former PC" : "External"}
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: BRAND.subtext }}>
            {[p.title || p.therapist_type, p.gender, p.age_range].filter(Boolean).join(" · ")}
            {p.current_clinic && <span style={{ marginLeft: 6, color: BRAND.teal }}>📍 {p.current_clinic}</span>}
          </p>
          {p.short_bio && <p style={{ margin: "0 0 8px", fontSize: 13, color: BRAND.text, lineHeight: 1.5 }}>{p.short_bio}</p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {presentations.slice(0, expanded ? undefined : 5).map((s: string, i: number) => (
              <span key={i} style={{ background: "#f3f4f6", color: BRAND.text, borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>{s}</span>
            ))}
            {!expanded && presentations.length > 5 && (
              <button onClick={() => setExpanded(true)}
                style={{ background: "none", border: "none", color: BRAND.lilac, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                +{presentations.length - 5} more
              </button>
            )}
          </div>

          {modalities.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {modalities.map((m: string, i: number) => (
                <span key={i} style={{ background: "#ede9f7", color: BRAND.lilac, borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>{m}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: BRAND.subtext }}>
            {p.billing_types && <span>💳 {p.billing_types}</span>}
            {p.client_types && <span>👥 {p.client_types}</span>}
            {p.languages && <span>🌐 {p.languages}</span>}
          </div>

          {(p.referral_contact || p.referral_website || p.link_to_bio) && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13 }}>
              {p.referral_contact && (
                <span style={{ background: BRAND.lightLilac, color: BRAND.lilac, borderRadius: 8, padding: "4px 12px", fontWeight: 600 }}>
                  📞 {p.referral_contact}
                </span>
              )}
              {(p.referral_website || p.link_to_bio) && (
                <a href={p.referral_website || p.link_to_bio} target="_blank" rel="noreferrer"
                  style={{ background: BRAND.lightLilac, color: BRAND.lilac, borderRadius: 8, padding: "4px 12px", fontWeight: 600, textDecoration: "none" }}>
                  🔗 Profile / Website
                </a>
              )}
            </div>
          )}
        </div>
        <button onClick={() => onEdit(p)}
          style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: BRAND.subtext, cursor: "pointer", flexShrink: 0 }}>
          Edit
        </button>
      </div>
    </div>
  );
}

interface ReferralNetworkProps {
  practitioners: Practitioner[];
}

const ReferralNetwork: React.FC<ReferralNetworkProps> = ({ practitioners }) => {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingP, setEditingP] = useState<Practitioner | null>(null);
  const [overrides, setOverrides] = useState<Record<number, Practitioner>>({});
  // Extra referrals added in-session (not persisted — for persistence would need backend)
  const [extras, setExtras] = useState<Practitioner[]>([]);

  const referrals = useMemo(() => {
    const base = practitioners.filter(p => p.referral_only === true)
      .map(p => overrides[p.id as number] ?? p);
    return [...base, ...extras];
  }, [practitioners, extras, overrides]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return referrals.sort((a, b) => a.name.localeCompare(b.name));
    return referrals
      .filter(p => {
        const text = [p.name, p.title, p.therapist_type, p.short_bio, p.bio,
          ...(Array.isArray(p.presentations) ? p.presentations : [p.presentations || ""]),
          ...(Array.isArray(p.modalities) ? p.modalities : [p.modalities || ""])
        ].filter(Boolean).join(" ").toLowerCase();
        return q.split(" ").every(w => text.includes(w));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [referrals, search]);

  const handleAdd = (p: Practitioner) => {
    setExtras(prev => [...prev, { ...p, referral_source: "external" }]);
    setShowAddForm(false);
  };

  const handleEdit = (p: Practitioner) => {
    setEditingP(p);
  };

  const handleEditSave = (updated: Practitioner) => {
    // If it's an in-session extra, update it there; otherwise store as an override
    setExtras(prev => {
      const idx = prev.findIndex(e => e.id === updated.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return prev;
    });
    setOverrides(prev => ({ ...prev, [updated.id as number]: updated }));
    setEditingP(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: BRAND.lilac }}>🔗 Referral Network</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: BRAND.subtext, lineHeight: 1.6 }}>
          Practitioners no longer at Psychology Care and trusted external referrals — for when we don't have a suitable match in-house.
        </p>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialty, modality…"
            style={{ flex: 1, minWidth: 220, border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 14 }}
          />
          <button onClick={() => setShowAddForm(s => !s)}
            style={{ background: BRAND.lilac, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>
            ➕ Add External Referral
          </button>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 12, fontSize: 12, color: BRAND.subtext }}>
          <span>📋 {referrals.filter(p => !p.referral_source || p.referral_source === "former_pc").length} former PC</span>
          <span>🌐 {referrals.filter(p => p.referral_source === "external").length} external</span>
          <span>🔍 Showing {filtered.length} of {referrals.length}</span>
        </div>
      </div>

      {showAddForm && (
        <AddReferralForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      {editingP && (
        <AddReferralForm
          initialValues={editingP}
          onAdd={handleEditSave}
          onCancel={() => setEditingP(null)}
        />
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: BRAND.subtext }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <p>No referrals found{search ? ` matching "${search}"` : ""}.</p>
          {!search && <p style={{ fontSize: 13 }}>Add external referrals using the button above.</p>}
        </div>
      ) : (
        filtered.map((p, idx) => <ReferralCard key={idx} p={p} onEdit={handleEdit} />)
      )}
    </div>
  );
};

export default ReferralNetwork;
