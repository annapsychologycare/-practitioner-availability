import React, { useMemo } from "react";
import { PRACTITIONERS_DATA } from "./practitionersData";
import { Practitioner } from "./types";
import { parseAvailability } from "./utils/emailBuilder";

const NETLIFY_BASE = "https://practitioneravailabilitypsychologycar.netlify.app";

function getPhotoUrl(p: Practitioner): string | null {
  if (!p.photo_url) return null;
  const match = p.photo_url.match(/\/photos\/(.+)$/);
  return match ? `${NETLIFY_BASE}/photos/${match[1]}` : p.photo_url;
}

function parseList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
}

interface CompareRowProps {
  label: string;
  children: React.ReactNode[];
}

const CompareRow: React.FC<CompareRowProps> = ({ label, children }) => (
  <div style={{ display: "flex", borderBottom: "1px solid #ede9f5" }}>
    {/* Row label */}
    <div
      style={{
        width: 120,
        minWidth: 120,
        padding: "14px 12px",
        background: "#faf9fd",
        borderRight: "1px solid #ede9f5",
        fontWeight: 700,
        fontSize: 12,
        color: "#2C244C",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        lineHeight: 1.4,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      {label}
    </div>
    {/* Cells */}
    {children.map((cell, i) => (
      <div
        key={i}
        style={{
          flex: 1,
          padding: "14px 16px",
          borderRight: i < children.length - 1 ? "1px solid #ede9f5" : "none",
          fontSize: 13,
          color: "#444",
          lineHeight: 1.7,
          minWidth: 0,
        }}
      >
        {cell}
      </div>
    ))}
  </div>
);

interface TagListProps {
  items: string[];
  color?: string;
}

const TagList: React.FC<TagListProps> = ({ items, color = "#2C244C" }) => {
  if (!items.length) return <span style={{ color: "#aaa", fontStyle: "italic" }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            background: "#F0EEF7",
            color,
            borderRadius: 12,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

interface AvailabilityCellProps {
  practitioner: Practitioner;
}

const AvailabilityCell: React.FC<AvailabilityCellProps> = ({ practitioner }) => {
  const locs = practitioner.locations || [];
  const hasAny = locs.some((l) => {
    const { weekly, fortnightly } = parseAvailability(l.availability);
    return weekly.length > 0 || fortnightly.length > 0;
  });

  if (!hasAny) {
    return (
      <span style={{ color: "#8D5273", fontStyle: "italic", fontSize: 12 }}>
        Waitlist only
      </span>
    );
  }

  return (
    <>
      {locs.map((loc, i) => {
        const { weekly, fortnightly } = parseAvailability(loc.availability);
        if (!weekly.length && !fortnightly.length) return null;
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8D5273",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              {loc.location}
            </div>
            {weekly.map((s, j) => (
              <div key={`w${j}`} style={{ fontSize: 12, color: "#366188" }}>
                • {s.replace(/ · from /, " — from ")}
              </div>
            ))}
            {fortnightly.map((s, j) => (
              <div key={`f${j}`} style={{ fontSize: 12, color: "#52A3BA" }}>
                • {s.replace(/ · from /, " — from ")} (fortnightly)
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface CompareProps {
  names: string[];
}

export const Compare: React.FC<CompareProps> = ({ names }) => {
  const practitioners = useMemo(() => {
    return names
      .map((name) =>
        PRACTITIONERS_DATA.find(
          (p) => p.name.toLowerCase().trim() === name.toLowerCase().trim()
        )
      )
      .filter(Boolean) as Practitioner[];
  }, [names]);

  if (!practitioners.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
        <p>No practitioners found. Please try again from the email link.</p>
        <a href="/" style={{ color: "#2C244C", fontWeight: 600 }}>
          ← Back to app
        </a>
      </div>
    );
  }

  const colCount = practitioners.length;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: "#F0EEF7",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #2C244C 0%, #8D5273 100%)",
          padding: "28px 24px 20px",
          textAlign: "center",
        }}
      >
        <img src="/logo.svg" alt="PsychologyCare" style={{ height: 56, width: "auto", marginBottom: 8 }} />
        <div
          style={{
            color: "#d8d0ec",
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Practitioner Comparison
        </div>
        <a
          href="/"
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to app
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 60px" }}>
        <h2
          style={{
            textAlign: "center",
            color: "#2C244C",
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 24,
          }}
        >
          Comparing {colCount} Practitioner{colCount > 1 ? "s" : ""}
        </h2>

        {/* Responsive wrapper — scrollable on small screens */}
        <div style={{ overflowX: "auto", borderRadius: 14, boxShadow: "0 4px 24px rgba(44,36,76,0.12)" }}>
          <div style={{ minWidth: colCount * 220 + 120 }}>

            {/* Practitioner header cards */}
            <div
              style={{
                display: "flex",
                background: "linear-gradient(135deg, #2C244C 0%, #8D5273 100%)",
                borderRadius: "14px 14px 0 0",
                overflow: "hidden",
              }}
            >
              {/* Label column spacer */}
              <div style={{ width: 120, minWidth: 120, background: "transparent" }} />

              {practitioners.map((p, i) => {
                const photoUrl = getPhotoUrl(p);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      padding: "20px 16px",
                      borderLeft: "1px solid rgba(255,255,255,0.12)",
                      textAlign: "center",
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={p.name}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          border: "3px solid rgba(255,255,255,0.35)",
                          objectFit: "cover",
                          display: "block",
                          margin: "0 auto 10px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.2)",
                          border: "3px solid rgba(255,255,255,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 10px",
                        }}
                      >
                        <span style={{ fontSize: 28, color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                          {p.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15, lineHeight: 1.3, marginBottom: 4 }}>
                      {p.name}
                    </div>
                    <div style={{ color: "#e8d4e4", fontSize: 12, lineHeight: 1.5 }}>{p.title}</div>
                    {p.link_to_bio && (
                      <a
                        href={p.link_to_bio}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: 10,
                          fontSize: 12,
                          color: "#e8d4e4",
                          textDecoration: "underline",
                        }}
                      >
                        View full profile →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comparison rows */}
            <div style={{ background: "#fff" }}>

              {/* Availability */}
              <CompareRow label="Availability">
                {practitioners.map((p, i) => (
                  <AvailabilityCell key={i} practitioner={p} />
                ))}
              </CompareRow>

              {/* Fees */}
              <CompareRow label="Fees">
                {practitioners.map((p, i) => (
                  <div key={i} style={{ whiteSpace: "pre-line" }}>
                    {p.fees || <span style={{ color: "#aaa", fontStyle: "italic" }}>—</span>}
                  </div>
                ))}
              </CompareRow>

              {/* Ages */}
              <CompareRow label="Ages Seen">
                {practitioners.map((p, i) => (
                  <div key={i} style={{ fontWeight: 600, color: "#2C244C" }}>
                    {p.age_range || <span style={{ color: "#aaa", fontStyle: "italic" }}>—</span>}
                  </div>
                ))}
              </CompareRow>

              {/* Locations */}
              <CompareRow label="Locations">
                {practitioners.map((p, i) => {
                  const locs = (p.locations || []).map((l) => l.location).filter(Boolean);
                  return locs.length ? (
                    <div key={i}>
                      {locs.map((l, j) => (
                        <div key={j} style={{ fontSize: 13, marginBottom: 2 }}>
                          📍 {l}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span key={i} style={{ color: "#aaa", fontStyle: "italic" }}>—</span>
                  );
                })}
              </CompareRow>

              {/* Presentations */}
              <CompareRow label="Presentations">
                {practitioners.map((p, i) => (
                  <TagList key={i} items={parseList(p.presentations)} color="#2C244C" />
                ))}
              </CompareRow>

              {/* Modalities */}
              <CompareRow label="Modalities">
                {practitioners.map((p, i) => (
                  <TagList key={i} items={parseList(p.modalities)} color="#8D5273" />
                ))}
              </CompareRow>

            </div>

            {/* Bottom rounded corners */}
            <div
              style={{
                background: "#faf9fd",
                borderTop: "1px solid #ede9f5",
                borderRadius: "0 0 14px 14px",
                padding: "14px 16px",
                textAlign: "center",
                fontSize: 12,
                color: "#999",
              }}
            >
              PsychologyCare · info@psychologycare.com.au · www.psychologycare.com.au
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <a
            href={`mailto:info@psychologycare.com.au`}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #2C244C 0%, #8D5273 100%)",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
              boxShadow: "0 3px 12px rgba(44,36,76,0.25)",
            }}
          >
            📬 Contact us to book
          </a>
        </div>
      </div>
    </div>
  );
};

export default Compare;
