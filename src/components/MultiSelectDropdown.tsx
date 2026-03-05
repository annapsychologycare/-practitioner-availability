import React, { useState, useRef, useEffect } from "react";

interface Props {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectDropdown({ label, options, selected, onChange, placeholder }: Props) {
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

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter(s => s !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div ref={ref} className="relative">
      <label className="label label-text font-semibold pb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn btn-sm btn-bordered w-full justify-between font-normal border border-base-300 bg-base-100 hover:bg-base-200 text-left"
        style={{ minHeight: "2rem", height: "auto", paddingTop: "0.3rem", paddingBottom: "0.3rem" }}
      >
        <span className="truncate text-sm">
          {selected.length === 0
            ? (placeholder || `Any ${label.toLowerCase()}`)
            : selected.length === 1
            ? selected[0]
            : `${selected.length} selected`}
        </span>
        <span className="ml-1 text-base-content/50">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-64 bg-base-100 border border-base-300 rounded-lg shadow-lg"
          style={{ maxHeight: "280px", overflowY: "auto" }}>
          <div className="p-2 border-b border-base-200 sticky top-0 bg-base-100">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered input-xs w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
            {selected.length > 0 && (
              <button
                className="btn btn-ghost btn-xs mt-1 w-full text-xs"
                onClick={() => onChange([])}
              >
                Clear all ({selected.length})
              </button>
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-base-content/50 text-center">No results</div>
          ) : (
            filtered.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-base-200 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs checkbox-primary"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span>{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
