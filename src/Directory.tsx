import React, { useState, useMemo } from "react";
import { Practitioner } from "./types";

interface Props {
  practitioners: Practitioner[];
}

export default function Directory({ practitioners }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [selected, setSelected] = useState<Practitioner | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return practitioners
      .filter(p => !(p as any).referral_only)
      .filter(p => !q || p.name.toLowerCase().includes(q) || (p.title || "").toLowerCase().includes(q) || (p.therapist_type || "").toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.therapist_type.localeCompare(b.therapist_type) || a.name.localeCompare(b.name);
      });
  }, [practitioners, search, sortBy]);

  return (
    <div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Gradient header with photo */}
            <div style={{ background: "linear-gradient(135deg,#2C244C 0%,#8D5273 100%)", borderRadius: "16px 16px 0 0", padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {(selected as any).photo_url ? (
                  <img src={`/photos/${(selected as any).photo_url.split('/').pop()}`} width={72} height={72}
                    style={{ borderRadius: "50%", border: "3px solid rgba(255,255,255,0.35)", objectFit: "cover", width: 72, height: 72, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", flexShrink: 0 }}>
                    {selected.name.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{selected.name}</h3>
                  <p style={{ fontSize: 13, color: "#e8d4e4", margin: "2px 0 0" }}>{selected.title}</p>
                  {selected.qualifications && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "2px 0 0", fontStyle: "italic" }}>{selected.qualifications}</p>}
                  {selected.pronouns && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>{selected.pronouns}</p>}
                </div>
                <button onClick={() => setSelected(null)} style={{ color: "#fff", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, flexShrink: 0, lineHeight: "32px" }}>✕</button>
              </div>
            </div>
            <div className="p-6">
              {selected.alert && (
                <div style={{ backgroundColor: "#00B8C8", color: "white", borderRadius: "10px", padding: "8px 14px", fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,184,200,0.35)", marginBottom: "16px" }}>
                🚨 {selected.alert}
              </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div><span className="font-semibold">Fees:</span><div className="whitespace-pre-line">{selected.fees}</div></div>
                <div><span className="font-semibold">Medicare:</span><div className="whitespace-pre-line">{selected.medicare_rebate}</div></div>
                <div><span className="font-semibold">Gender:</span> {selected.gender || "—"}</div>
                <div><span className="font-semibold">Ages:</span> {selected.age_range || "—"}</div>
                <div><span className="font-semibold">Clients:</span> {selected.client_types || "—"}</div>
                <div><span className="font-semibold">Languages:</span> {selected.languages || "English"}</div>
                {selected.billing_types && <div className="col-span-2"><span className="font-semibold">Billing:</span> {selected.billing_types}</div>}
                {selected.after_hours && <div className="col-span-2"><span className="font-semibold">After hours:</span> {selected.after_hours}</div>}
                {selected.religions_groups && <div className="col-span-2"><span className="font-semibold">Cultural/Religious:</span> {selected.religions_groups}</div>}
              </div>

              <div className="space-y-3">
                {selected.presentations && (
                  <div>
                    <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Presentations</div>
                    <div className="text-sm">{selected.presentations}</div>
                  </div>
                )}
                {selected.modalities && (
                  <div>
                    <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Modalities</div>
                    <div className="text-sm">{selected.modalities}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Availability</div>
                  {(selected.locations || []).map((loc, i) => (
                    <div key={i} className="mb-2">
                      <div className="text-xs font-semibold text-base-content/60">📍 {loc.location}</div>
                      {loc.availability ? (
                        <div className="text-sm whitespace-pre-line" style={{ color: "#366188" }}>{Array.isArray(loc.availability) ? loc.availability.join('\n') : loc.availability}</div>
                      ) : (
                        <div className="text-sm text-base-content/40 italic">None listed</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selected.bio && (
                <div className="mt-4">
                  <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-2">About</div>
                  <div className="text-sm text-base-content/80 whitespace-pre-line leading-relaxed">{selected.bio}</div>
                </div>
              )}

              {selected.link_to_bio && (
                <div className="mt-4">
                  <a href={selected.link_to_bio} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    View Full Bio ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name or type..."
          className="input input-bordered flex-1"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select select-bordered select-sm" value={sortBy} onChange={e => setSortBy(e.target.value as "name" | "type")}>
          <option value="name">Sort by name</option>
          <option value="type">Sort by type</option>
        </select>
        <div className="text-sm text-base-content/60 whitespace-nowrap">{filtered.length} practitioners</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => {
          const hasAvail = (p.locations || []).some(l => {
            if (!l.availability) return false;
            if (Array.isArray(l.availability)) return l.availability.length > 0;
            return l.availability.trim().length > 0;
          });
          return (
            <div
              key={p.name}
              className="card bg-white shadow-sm cursor-pointer hover:shadow-md transition-all" style={{ border: "1px solid #CDA8BA" }}
              onClick={() => setSelected(p)}
            >
              <div className="card-body p-0 overflow-hidden">
                {/* Card photo header */}
                <div style={{ background: "linear-gradient(135deg,#2C244C 0%,#8D5273 100%)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  {(p as any).photo_url ? (
                    <img src={`/photos/${(p as any).photo_url.split('/').pop()}`} width={48} height={48}
                      style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", objectFit: "cover", width: 48, height: 48, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", flexShrink: 0 }}>
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#e8d4e4" }}>{p.title}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`badge badge-sm ${hasAvail ? "badge-success" : "badge-ghost"}`}>
                      {hasAvail ? "Available" : "Waitlist"}
                    </span>
                    {p.accepts_couples && <span className="badge badge-info badge-xs">Couples</span>}
                    {p.alert && <span style={{ backgroundColor: "#00B8C8", color: "white", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: 700, marginLeft: "4px" }}>🚨 Note</span>}
                  </div>
                </div>
                {/* Card lower section */}
                <div style={{ padding: "10px 14px 12px" }}>
                  <div className="flex gap-1 flex-wrap mb-1">
                    <span className="badge badge-outline badge-xs">{p.gender || "—"}</span>
                    <span className="badge badge-outline badge-xs">{p.age_range}</span>
                    {p.pap_clinician === "Yes" && <span className="badge badge-secondary badge-xs">PAP</span>}
                    {p.after_hours && <span className="badge badge-accent badge-xs">AH</span>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {(p.locations || []).slice(0, 2).map((l, i) => (
                      <span key={i} className="text-xs text-base-content/50 truncate">📍 {l.location}</span>
                    ))}
                    {(p.locations || []).length > 2 && <span className="text-xs text-base-content/40">+{(p.locations || []).length - 2}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
