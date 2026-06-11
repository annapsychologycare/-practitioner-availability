import React, { useState, useMemo } from "react";

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

interface AddReferralFormProps {
  onAdd: (p: Practitioner) => void;
  onCancel: () => void;
}

const AddReferralForm: React.FC<AddReferralFormProps> = ({ onAdd, onCancel }) => {
  const [form, setForm] = useState({
    name: "", title: "", therapist_type: "", gender: "",
    age_range: "", presentations: "", modalities: "", billing_types: "",
    client_types: "", short_bio: "", qualifications: "", languages: "",
    referral_contact: "", referral_website: "",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = () => {
    if (!form.name.trim()) { alert("Name is required."); return; }
    const newP: Practitioner = {
      id: Date.now(),
      name: form.name.trim(),
      title: form.title,
      therapist_type: form.therapist_type,
      gender: form.gender,
      age_range: form.age_range,
      presentations: form.presentations.split(",").map(s => s.trim()).filter(Boolean),
      modalities: form.modalities.split(",").map(s => s.trim()).filter(Boolean),
      billing_types: form.billing_types,
      client_types: form.client_types,
      short_bio: form.short_bio,
      qualifications: form.qualifications,
      languages: form.languages,
      referral_contact: form.referral_contact,
      referral_website: form.referral_website,
      active: false,
      referral_only: true,
      referral_source: "external",
    };
    onAdd(newP);
  };

  const field = (label: string, key: string, placeholder?: string, type: "input" | "textarea" = "input") => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: BRAND.text, marginBottom: 4 }}>{label}</label>
      {type === "textarea"
        ? <textarea value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
            style={{ width: "100%", border: `1px solid ${BRAND.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 13, resize: "vertical", minHeight: 60 }} />
        : <input value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
            style={{ width: "100%", border: `1px solid ${BRAND.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 13 }} />
      }
    </div>
  );

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, color: BRAND.lilac }}>➕ Add External Referral</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div>{field("Full Name *", "name", "e.g. Dr Jane Smith")}</div>
        <div>{field("Title / Role", "title", "e.g. Clinical Psychologist")}</div>
        <div>{field("Therapist Type", "therapist_type", "e.g. Psychologist")}</div>
        <div>{field("Gender", "gender", "e.g. Female")}</div>
        <div>{field("Age Range", "age_range", "e.g. 18 Yrs +")}</div>
        <div>{field("Client Types", "client_types", "e.g. Individual, Couples")}</div>
        <div>{field("Billing Types", "billing_types", "e.g. Medicare Rebate, Self Funded")}</div>
        <div>{field("Languages", "languages", "e.g. English, Spanish")}</div>
        <div>{field("Contact / Email", "referral_contact", "e.g. jane@example.com or (03) 9xxx xxxx")}</div>
        <div>{field("Website / Profile URL", "referral_website", "e.g. https://...")}</div>
      </div>
      {field("Specialties / Presentations (comma-separated)", "presentations", "e.g. Anxiety, Trauma, ADHD")}
      {field("Modalities (comma-separated)", "modalities", "e.g. CBT, EMDR, ACT")}
      {field("Short Bio / Notes", "short_bio", "Brief notes about this referral…", "textarea")}
      {field("Qualifications", "qualifications", "e.g. MPsych(Clin), MAPS")}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={handleAdd}
          style={{ background: BRAND.lilac, color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
          Add to Network
        </button>
        <button onClick={onCancel}
          style={{ background: "#fff", color: BRAND.subtext, border: `1px solid ${BRAND.border}`, borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
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
  // Extra referrals added in-session (not persisted — for persistence would need backend)
  const [extras, setExtras] = useState<Practitioner[]>([]);

  const referrals = useMemo(() => {
    // Combine former PC practitioners (referral_only) with any extras added in-session
    const base = practitioners.filter(p => p.referral_only === true);
    return [...base, ...extras];
  }, [practitioners, extras]);

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
    // For now just alert — a full edit form could be added
    alert(`To edit ${p.name}'s details, please ask your admin to update their profile.`);
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
