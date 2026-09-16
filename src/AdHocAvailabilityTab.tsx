/**
 * AdHocAvailabilityTab.tsx
 * Shows a practitioner's upcoming available slots for ad-hoc/waitlist clients.
 * Sources:
 *   1. Recurring slots (weekly/fortnightly/monthly) with no confirmed booking
 *   2. Cancelled appointments (client cancelled → slot now free)
 */

import React, { useState, useCallback } from "react";
import type { Practitioner } from "./types";

const BRAND = "#2C244C";
const ROSE  = "#8D5273";
const ZANDA_CONN = "conn_xv49yqpd5marmz16g37p";
const ZANDA_BASE = "https://zandaapi.zandahealth.com";

// Zanda availability flag IDs (same as import script)
const FLAG_WEEKLY      = 144564;
const FLAG_FORTNIGHTLY = 211297;
const FLAG_MONTHLY     = 211298;

// Availability client IDs (same as import script)
const AVAILABILITY_CLIENTS: Record<number, "Weekly" | "Fortnightly" | "Monthly"> = {
  4756809: "Weekly",
  5009709: "Fortnightly",
  5145600: "Monthly",
};

type SlotKind = "Weekly" | "Fortnightly" | "Monthly" | "Cancelled";

type AvailableSlot = {
  date: string;       // YYYY-MM-DD
  dateLabel: string;  // "Mon 16 Sep"
  time: string;       // "9am"
  location: string;
  kind: SlotKind;
  appointmentId?: number;
};

type Props = { practitioners: Practitioner[] };

// ── Helpers ────────────────────────────────────────────────────────────────

function toMelbDate(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m ? `${hr}:${String(m).padStart(2, "0")}${suffix}` : `${hr}${suffix}`;
}

function mapLocation(apiLoc: string, pracName: string): string {
  const l = apiLoc.toLowerCase();
  if (pracName === "Amy Bortz" && l.includes("online")) return "Burke Rd, Camberwell";
  if (pracName === "Nicholas Kleeman" && l.includes("online")) return "185A Greville St, Prahran";
  if (l.includes("online") || l.includes("telehealth")) return "Telehealth";
  if (l.includes("camberwell") || l.includes("burke")) return "Burke Rd, Camberwell";
  if (l.includes("183")) return "183A Greville St, Prahran";
  if (l.includes("185") || l.includes("greville")) return "185A Greville St, Prahran";
  return apiLoc;
}

const KIND_COLORS: Record<SlotKind, { bg: string; text: string; label: string }> = {
  Weekly:     { bg: "#d1fae5", text: "#065f46", label: "Weekly" },
  Fortnightly:{ bg: "#ede9fe", text: "#4c1d95", label: "Fortnightly" },
  Monthly:    { bg: "#dbeafe", text: "#1e3a8a", label: "Monthly" },
  Cancelled:  { bg: "#fef9c3", text: "#92400e", label: "Cancellation" },
};

// ── Zanda API calls via window.tasklet.invokeTool ──────────────────────────

async function zandaGet(path: string): Promise<any> {
  const res = await (window as any).tasklet.invokeTool({
    connectionId: ZANDA_CONN,
    toolName: "remote_http_call",
    args: {
      url: ZANDA_BASE + path,
      method: "GET",
      extraHeaders: {
        Accept: "application/vnd.zandaapi+json",
        "X-Time-Zone": "Australia/Melbourne",
      },
    },
  });
  if (!res.ok) throw new Error(res.error ?? "API error");
  const raw = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
  return raw.body ?? raw;
}

async function fetchAppointmentsForClient(
  clientId: number,
  dateFrom: string,
  dateTo: string
): Promise<any[]> {
  const items: any[] = [];
  let cursor = "";
  while (true) {
    const qs = new URLSearchParams({
      clientId: String(clientId),
      dateFrom,
      dateTo,
      pageSize: "200",
      ...(cursor ? { cursor } : {}),
    });
    const res = await zandaGet(`/api/v1/appointments?${qs}`);
    const batch: any[] = (res.items ?? []).map((i: any) => i.data ?? i);
    items.push(...batch);
    if (!res.hasNextPage) break;
    cursor = res.nextCursor ?? "";
    if (!cursor) break;
  }
  return items;
}

// ── Main component ──────────────────────────────────────────────────────────

const AdHocAvailabilityTab: React.FC<Props> = ({ practitioners }) => {
  const [selectedPrac, setSelectedPrac] = useState<string>("");
  const [includeMonthly, setIncludeMonthly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const prac = practitioners.find(p => p.name === selectedPrac) ?? null;

  const run = useCallback(async () => {
    if (!selectedPrac) return;
    setLoading(true);
    setError(null);
    setSlots(null);

    try {
      const today = new Date();
      const melbToday = toMelbDate(today);
      const dateFrom = toMelbDate(addDays(today, 1)); // tomorrow
      const dateTo   = toMelbDate(addDays(today, 56)); // 8 weeks out

      // ── 1. Fetch all recurring availability appointments ───────────────

      const allAvailAppts: any[] = [];
      for (const [clientId, freqType] of Object.entries(AVAILABILITY_CLIENTS)) {
        if (freqType === "Monthly" && !includeMonthly) continue;
        const appts = await fetchAppointmentsForClient(Number(clientId), dateFrom, dateTo);
        for (const a of appts) allAvailAppts.push({ ...a, _freqType: freqType });
      }

      // Filter to this practitioner's recurring availability (pending/active only)
      const pracAvailSlots = allAvailAppts.filter(a => {
        const name = a.practitioner?.name ?? "";
        return (
          name === selectedPrac &&
          a.attendanceState === "Pending" &&
          a.isActive !== false
        );
      });

      // Build set of date+time keys for recurring slots
      const recurringSlotKeys = new Set<string>();
      const recurringSlots: AvailableSlot[] = pracAvailSlots.map(a => {
        const date = a.startDate?.substring(0, 10) ?? "";
        const time = formatTime(a.startTime ?? "00:00:00");
        const location = mapLocation(a.location?.name ?? "", selectedPrac);
        const key = `${date}|${time}`;
        recurringSlotKeys.add(key);
        return {
          date,
          dateLabel: formatDateLabel(date),
          time,
          location,
          kind: a._freqType as SlotKind,
          appointmentId: a.id,
        };
      });

      // ── 2. Fetch ALL appointments for this practitioner to find CXLs ──
      // We fetch by searching across all clients — use the /appointments endpoint
      // filtered by practitioner. Zanda doesn't have a direct prac filter so we
      // use a large page fetch and filter client-side.
      // We'll use the Zanda /practitioners endpoint to get the practitioner's id first.
      
      let cancelledSlots: AvailableSlot[] = [];

      try {
        // Get practitioner list to find their Zanda ID
        const pracsRes = await zandaGet("/api/v1/practitioners?pageSize=100");
        const pracList: any[] = (pracsRes.items ?? []).map((i: any) => i.data ?? i);
        const zandaPrac = pracList.find((p: any) =>
          (p.name ?? "").toLowerCase().includes(selectedPrac.split(" ").pop()?.toLowerCase() ?? "")
        );

        if (zandaPrac?.id) {
          // Fetch CXL appointments for this practitioner
          const qs = new URLSearchParams({
            practitionerId: String(zandaPrac.id),
            dateFrom,
            dateTo,
            pageSize: "200",
          });
          // Note: if this endpoint doesn't support practitionerId filter, we fall back
          try {
            const apptRes = await zandaGet(`/api/v1/appointments?${qs}`);
            const appts: any[] = (apptRes.items ?? []).map((i: any) => i.data ?? i);

            // Filter to cancelled (CXL) that are NOT availability clients
            const availClientIds = new Set(Object.keys(AVAILABILITY_CLIENTS).map(Number));
            const cxlAppts = appts.filter(a =>
              a.attendanceState === "Cancelled" &&
              !availClientIds.has(a.client?.id) &&
              a.practitioner?.name === selectedPrac
            );

            cancelledSlots = cxlAppts.map(a => {
              const date = a.startDate?.substring(0, 10) ?? "";
              const time = formatTime(a.startTime ?? "00:00:00");
              return {
                date,
                dateLabel: formatDateLabel(date),
                time,
                location: mapLocation(a.location?.name ?? "", selectedPrac),
                kind: "Cancelled" as SlotKind,
                appointmentId: a.id,
              };
            });
          } catch {
            // Practitioner filter not supported — skip CXL fetch
          }
        }
      } catch {
        // Silently skip if prac lookup fails
      }

      // ── 3. Deduplicate — if a recurring slot also has a CXL, keep recurring ──
      const combined = [
        ...recurringSlots,
        ...cancelledSlots.filter(c => !recurringSlotKeys.has(`${c.date}|${c.time}`)),
      ].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      setSlots(combined);
      setLastRun(new Date().toLocaleTimeString("en-AU", { timeZone: "Australia/Melbourne", hour: "2-digit", minute: "2-digit" }));
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedPrac, includeMonthly]);

  // Copy slots as plain text
  const copyText = () => {
    if (!slots) return;
    const lines = slots.map(s => `${s.dateLabel}  ${s.time}  ${s.location}  [${s.kind}]`);
    navigator.clipboard.writeText(lines.join("\n"));
  };

  // Group by date for display
  const grouped = slots ? slots.reduce<Record<string, AvailableSlot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {}) : {};

  const weeklyCount     = slots?.filter(s => s.kind === "Weekly").length ?? 0;
  const fortnightlyCount= slots?.filter(s => s.kind === "Fortnightly").length ?? 0;
  const monthlyCount    = slots?.filter(s => s.kind === "Monthly").length ?? 0;
  const cancelledCount  = slots?.filter(s => s.kind === "Cancelled").length ?? 0;

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      <h2 style={{ color: BRAND, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        🗓️ Ad-hoc Availability
      </h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
        Shows upcoming available slots for a practitioner — recurring openings plus any client cancellations. Use for waitlist and ad-hoc bookings.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: BRAND, marginBottom: 4 }}>
            Practitioner
          </label>
          <select
            value={selectedPrac}
            onChange={e => { setSelectedPrac(e.target.value); setSlots(null); }}
            style={{
              border: "1.5px solid #ccc", borderRadius: 8, padding: "8px 12px",
              fontSize: 14, minWidth: 240, background: "#fff", color: BRAND,
            }}
          >
            <option value="">— Select practitioner —</option>
            {[...practitioners]
              .filter(p => p.acceptingNewClients !== false && p.name !== "Cristina Jimenez")
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))
            }
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#444", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={includeMonthly}
            onChange={e => setIncludeMonthly(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: BRAND }}
          />
          Include monthly slots
        </label>

        <button
          onClick={run}
          disabled={!selectedPrac || loading}
          style={{
            background: selectedPrac && !loading ? BRAND : "#ccc",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 24px", fontSize: 14, fontWeight: 600,
            cursor: selectedPrac && !loading ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Loading…" : "Fetch Availability"}
        </button>
      </div>

      {/* Practitioner alert banner */}
      {prac?.alert && (
        <div style={{
          background: "#fef9c3", border: "1px solid #fbbf24",
          borderRadius: 8, padding: "10px 16px", marginBottom: 16,
          fontSize: 13, color: "#92400e",
        }}>
          ⚠️ {prac.alert.includes("|") ? prac.alert.split("|")[1].trim() : prac.alert}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 16px", color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#666", fontSize: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          Fetching availability from Zanda…
        </div>
      )}

      {/* Results */}
      {slots && !loading && (
        <>
          {/* Summary bar */}
          <div style={{
            background: "#f5f3ff", border: `1.5px solid #e0d7f5`,
            borderRadius: 10, padding: "12px 20px", marginBottom: 20,
            display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
          }}>
            <span style={{ fontWeight: 700, color: BRAND, fontSize: 15 }}>
              {slots.length} available slot{slots.length !== 1 ? "s" : ""}
            </span>
            {weeklyCount > 0 && <span style={{ fontSize: 13, background: "#d1fae5", color: "#065f46", borderRadius: 12, padding: "2px 10px" }}>🟢 {weeklyCount} weekly</span>}
            {fortnightlyCount > 0 && <span style={{ fontSize: 13, background: "#ede9fe", color: "#4c1d95", borderRadius: 12, padding: "2px 10px" }}>🟣 {fortnightlyCount} fortnightly</span>}
            {monthlyCount > 0 && <span style={{ fontSize: 13, background: "#dbeafe", color: "#1e3a8a", borderRadius: 12, padding: "2px 10px" }}>🔵 {monthlyCount} monthly</span>}
            {cancelledCount > 0 && <span style={{ fontSize: 13, background: "#fef9c3", color: "#92400e", borderRadius: 12, padding: "2px 10px" }}>⭐ {cancelledCount} cancellation{cancelledCount !== 1 ? "s" : ""}</span>}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>as of {lastRun} today</span>
            <button
              onClick={copyText}
              style={{ background: "#e9e4f5", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, color: BRAND, cursor: "pointer", fontWeight: 600 }}
            >
              📋 Copy
            </button>
          </div>

          {slots.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#888", fontSize: 14 }}>
              No available slots found in the next 8 weeks.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(grouped).sort().map(([date, daySlots]) => (
                <div key={date} style={{ borderRadius: 10, overflow: "hidden", border: "1.5px solid #e8e4f0" }}>
                  {/* Date header */}
                  <div style={{ background: BRAND, color: "#fff", padding: "8px 16px", fontWeight: 600, fontSize: 14 }}>
                    {formatDateLabel(date)}
                  </div>
                  {/* Slots */}
                  <div>
                    {daySlots.map((s, i) => {
                      const c = KIND_COLORS[s.kind];
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 16px",
                          borderBottom: i < daySlots.length - 1 ? "1px solid #f0ecf8" : "none",
                          background: i % 2 === 0 ? "#fff" : "#faf9fd",
                        }}>
                          <span style={{
                            background: c.bg, color: c.text,
                            borderRadius: 10, padding: "2px 10px",
                            fontSize: 11, fontWeight: 700, minWidth: 90, textAlign: "center",
                          }}>
                            {c.label}
                          </span>
                          <span style={{ fontWeight: 700, color: BRAND, fontSize: 15, minWidth: 60 }}>
                            {s.time}
                          </span>
                          <span style={{ color: "#555", fontSize: 13 }}>
                            {s.location}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdHocAvailabilityTab;
