import React, { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  label: string;
  value: string; // semicolon-separated string
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  hint?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
}) => {
  const selected = value
    ? value
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const add = (option: string) => {
    const trimmed = option.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    const next = [...selected, trimmed];
    onChange(next.join("; "));
    setSearch("");
    inputRef.current?.focus();
  };

  const remove = (option: string) => {
    const next = selected.filter((s) => s !== option);
    onChange(next.join("; "));
  };

  const filtered = options.filter(
    (opt) =>
      opt.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(opt)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) {
        add(filtered[0]);
      } else if (search.trim()) {
        // Allow adding custom entries not in list
        add(search.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    } else if (e.key === "Backspace" && !search && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <label className="label label-text text-xs font-semibold">{label}</label>
      {hint && <div className="text-xs mb-1" style={{ color: "#8D5273" }}>{hint}</div>}

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "#F0EEF7",
                color: "#2C244C",
                border: "1px solid #CDA8BA",
              }}
            >
              {s}
              <button
                type="button"
                onClick={() => remove(s)}
                className="ml-0.5 rounded-full hover:bg-mauve/20 transition-colors leading-none"
                style={{ color: "#8D5273", fontWeight: 700 }}
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input input-bordered input-sm w-full pr-8"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selected.length === 0
              ? placeholder || "Search to add…"
              : "Add more…"
          }
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
          >
            ×
          </button>
        )}

        {open && (filtered.length > 0 || (search.trim() && !selected.includes(search.trim()))) && (
          <div
            className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-52 overflow-y-auto mt-1"
            style={{ borderColor: "#CDA8BA" }}
          >
            {search.trim() && !options.includes(search.trim()) && !selected.includes(search.trim()) && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-base-100 transition-colors border-b"
                style={{ color: "#8D5273", borderColor: "#F0EEF7" }}
                onClick={() => add(search.trim())}
              >
                + Add custom: "<strong>{search.trim()}</strong>"
              </button>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-base-100 transition-colors"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => add(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs mt-1" style={{ color: "#8D5273" }}>
        {selected.length} selected · Press Backspace to remove last
      </div>
    </div>
  );
};

export default MultiSelect;
