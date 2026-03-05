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
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.therapist_type.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.therapist_type.localeCompare(b.therapist_type) || a.name.localeCompare(b.name);
      });
  }, [practitioners, search, sortBy]);

  return (
    <div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{selected.name}</h3>
                  <p className="text-sm text-base-content/60">{selected.title}</p>
                  {selected.qualifications && <p className="text-xs text-base-content/50 italic">{selected.qualifications}</p>}
                  {selected.pronouns && <p className="text-xs text-base-content/40">{selected.pronouns}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
              
              {selected.alert && (
                <div className="alert alert-warning py-2 px-3 text-sm mb-4">⚠️ {selected.alert}</div>
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
                  {selected.locations.map((loc, i) => (
                    <div key={i} className="mb-2">
                      <div className="text-xs font-semibold text-base-content/60">📍 {loc.location}</div>
                      {loc.availability ? (
                        <div className="text-sm text-success whitespace-pre-line">{loc.availability}</div>
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
          const hasAvail = p.locations.some(l => l.availability && l.availability.trim());
          return (
            <div
              key={p.id}
              className="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => setSelected(p)}
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-primary truncate">{p.name}</div>
                    <div className="text-xs text-base-content/60 mt-0.5">{p.title}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end ml-2">
                    <span className={`badge badge-sm ${hasAvail ? "badge-success" : "badge-ghost"}`}>
                      {hasAvail ? "Available" : "Waitlist"}
                    </span>
                    {p.accepts_couples && <span className="badge badge-info badge-xs">Couples</span>}
                    {p.alert && <span className="badge badge-warning badge-xs">⚠</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap mt-2">
                  <span className="badge badge-outline badge-xs">{p.gender || "—"}</span>
                  <span className="badge badge-outline badge-xs">{p.age_range}</span>
                  {p.pap_clinician === "Yes" && <span className="badge badge-secondary badge-xs">PAP</span>}
                  {p.after_hours && <span className="badge badge-accent badge-xs">AH</span>}
                </div>
                <div className="flex gap-1 flex-wrap mt-1">
                  {p.locations.slice(0, 2).map((l, i) => (
                    <span key={i} className="text-xs text-base-content/50 truncate">📍 {l.location}</span>
                  ))}
                  {p.locations.length > 2 && <span className="text-xs text-base-content/40">+{p.locations.length - 2}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
