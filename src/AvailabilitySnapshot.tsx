import React, { useState, useMemo } from "react";
import { Practitioner } from "./types";

interface Props {
  practitioners: Practitioner[];
}

type FilterType = "all" | "weekly" | "fortnightly";

function getAvailabilityLines(text: string | string[], type: FilterType): string[] {
  if (!text) return [];
  const lines = Array.isArray(text) ? text : text.split("\n");
  return lines
    .map(l => l.replace(/^\*\s*/, "").trim())
    .filter(l => {
      if (!l) return false;
      if (/\(Monthly:/i.test(l)) return false;
      if (type === "weekly") return /\(Weekly:/i.test(l);
      if (type === "fortnightly") return /\(Fortnightly:/i.test(l);
      return /\((Weekly|Fortnightly):/i.test(l);
    });
}

function formatLine(line: string): { time: string; type: string; date: string } {
  const typeMatch = line.match(/\((Weekly|Fortnightly):\s*Starting\s+(.+?)\)/i);
  const type = typeMatch ? typeMatch[1] : "";
  const date = typeMatch ? typeMatch[2].trim() : "";
  const time = line.replace(/\s*\((Weekly|Fortnightly):.*?\)/i, "").trim();
  return { time, type, date };
}

const AvailabilitySnapshot: React.FC<Props> = ({ practitioners }) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return practitioners
      .map(prac => {
        const locs = prac.locations
          .map(loc => ({
            location: loc.location,
            weekly: getAvailabilityLines(loc.availability || "", "weekly"),
            fortnightly: getAvailabilityLines(loc.availability || "", "fortnightly"),
            lines: getAvailabilityLines(loc.availability || "", filter),
          }))
          .filter(l => l.lines.length > 0);
        return { prac, locs };
      })
      .filter(({ prac, locs }) => {
        if (locs.length === 0) return false;
        if (!q) return true;
        return (
          prac.name.toLowerCase().includes(q) ||
          locs.some(l => l.location.toLowerCase().includes(q))
        );
      });
  }, [practitioners, filter, search]);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "weekly", label: "Weekly" },
    { key: "fortnightly", label: "Fortnightly" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="input input-bordered flex items-center gap-2 flex-1 min-w-48">
          <input
            type="search"
            className="grow"
            placeholder="Search practitioner or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <div className="join">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`join-item btn btn-sm ${filter === f.key ? "btn-primary" : "btn-ghost border border-base-300"}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-base-content/50 text-sm whitespace-nowrap">
          {visible.length} practitioner{visible.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid - 2 columns */}
      {visible.length === 0 ? (
        <div className="text-center text-base-content/40 py-16 text-sm">
          No availability found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map(({ prac, locs }) => (
            <div key={prac.name} className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4 gap-2">
                <h3 className="font-bold text-base text-base-content">{prac.name}</h3>
                {locs.map(loc => (
                  <div key={loc.location} className="mt-1">
                    <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1">
                      📍 {loc.location}
                    </div>
                    <ul className="space-y-1">
                      {loc.lines.map((line, i) => {
                        const { time, type, date } = formatLine(line);
                        return (
                          <li key={i} className="text-sm text-base-content flex items-baseline gap-2">
                            <span>{time}</span>
                            {type && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${type.toLowerCase() === "weekly" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {type}{date ? ` · from ${date}` : ""}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailabilitySnapshot;
