import React, { ReactNode, useState, useCallback } from "react";
import FindPractitioner from "./FindPractitioner";
import Directory from "./Directory";
import AvailabilitySnapshot from "./AvailabilitySnapshot";
import IntakeTab from "./components/IntakeTab";
import ManageAvailability from "./ManageAvailability";
import TaxonomyTab from "./TaxonomyTab";
import EmailTemplateTab from "./EmailTemplateTab";
import ReferralNetwork from "./ReferralNetwork";
import AuditTab from "./AuditTab";
import { CRMSyncTab } from "./CRMSyncTab";
import { createRoot } from "react-dom/client";
import { PRACTITIONERS_DATA, AVAILABILITY_LAST_UPDATED as AVAILABILITY_LAST_UPDATED_STATIC } from "./practitionersData";
import { loadEmailTemplateConfig, saveEmailTemplateConfig, EmailTemplateConfig } from "./emailTemplateConfig";
import type { Practitioner } from "./types";

const DATA_PATH = "/tasklet/agent/home/practitioners_data.json";

// Error boundary wrapper - simple passthrough (Tasklet outer layer handles errors)
const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;

// Detect compare mode from URL query params
function getCompareNames(): string[] | null {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("compare");
  if (!raw) return null;
  const names = decodeURIComponent(raw).split(",").map((n) => n.trim()).filter(Boolean);
  return names.length >= 1 ? names : null;
}

type Tab = "find" | "directory" | "manage" | "snapshot" | "intake" | "referral" | "taxonomy" | "email" | "audit" | "crm";

function AppMain() {
  const [tab, setTab] = useState<Tab>("find");
  const [practitioners, setPractitioners] = useState<Practitioner[]>(PRACTITIONERS_DATA as unknown as Practitioner[]);
  const [emailConfig, setEmailConfig] = useState<EmailTemplateConfig>(loadEmailTemplateConfig);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<string>(AVAILABILITY_LAST_UPDATED_STATIC);

  // Read the timestamp at runtime from the meta file so it's never stale
  React.useEffect(() => {
    window.tasklet.readFileFromDisk("/tasklet/agent/home/apps/practitioner-availability/availability_meta.json")
      .then((raw: string) => {
        try {
          const meta = JSON.parse(raw);
          if (meta.last_updated) setAvailabilityDate(meta.last_updated);
        } catch {}
      })
      .catch(() => {});
  }, []);

  const showStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const saveToDisk = useCallback(async (updated: Practitioner[]) => {
    try {
      await window.tasklet.writeFileToDisk(DATA_PATH, JSON.stringify(updated, null, 2));
      await window.tasklet.runCommand(
        `cd /tasklet/agent/home && python3 -c "
import json, subprocess
with open('practitioners_data.json') as f:
    data = json.load(f)
# Regenerate practitionersData.ts
lines = ['// Auto-generated — do not edit. Run import_availability.py to update.']
lines.append('import type { Practitioner } from \"./types\";')
lines.append('')
lines.append('export const practitionersData: Practitioner[] = ' + json.dumps(data, indent=2) + ';')
lines.append('')
lines.append('export const PRACTITIONERS_DATA = practitionersData;')
# Preserve existing AVAILABILITY_LAST_UPDATED if set
try:
    with open('apps/practitioner-availability/practitionersData.ts') as tf:
        for tline in tf:
            if 'AVAILABILITY_LAST_UPDATED' in tline:
                lines.append(tline.strip())
                break
        else:
            lines.append('export const AVAILABILITY_LAST_UPDATED = \"(unsaved)\";')
except Exception:
    lines.append('export const AVAILABILITY_LAST_UPDATED = \"(unsaved)\";')
with open('apps/practitioner-availability/practitionersData.ts', 'w') as f:
    f.write('\\n'.join(lines))
print('TS regenerated')
"`
      );
      showStatus("✅ Saved");
    } catch (e) {
      showStatus("❌ Save failed");
    }
  }, []);

  const handleUpdate = useCallback((updated: Practitioner) => {
    setPractitioners(prev => {
      const next = prev.map(p => p.name === updated.name ? updated : p);
      saveToDisk(next);
      return next;
    });
  }, [saveToDisk]);

  const handleBulkUpdate = useCallback((updated: Practitioner[]) => {
    setPractitioners(updated);
    saveToDisk(updated);
  }, [saveToDisk]);

  const handleConfigChange = useCallback((config: EmailTemplateConfig) => {
    setEmailConfig(config);
    saveEmailTemplateConfig(config);
  }, []);

  const tabs = [
    { key: "find", label: "🔍 Find a Practitioner" },
    { key: "directory", label: "📖 Directory" },
    { key: "manage", label: "✏️ Manage Practitioners" },
    { key: "snapshot", label: "📋 Availability Snapshot" },
    { key: "intake", label: "📝 Intake" },
    { key: "referral", label: "🔗 Referral Network" },
    { key: "taxonomy", label: "🏷️ Taxonomy" },
    { key: "email", label: "📧 Email Template" },
    { key: "audit", label: "🗂️ Audit Log" },
    { key: "crm", label: "🔗 CRM Sync" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #2C244C 0%, #8D5273 100%)" }} className="text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center">
          <img src="/logo.svg" alt="PsychologyCare" style={{ height: 72, width: "auto", marginBottom: 10 }} />
          <p style={{ color: "#d8d0ec", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
            Practitioner Matching &amp; Client Intake
          </p>
          <div style={{ marginTop: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.35)",
              borderRadius: 20, padding: "5px 16px",
              fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600,
              color: "#fff", letterSpacing: "0.01em"
            }}>
              📅 Availability updated: {availabilityDate}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: "#e8e4f0" }}>
        <div className="max-w-7xl mx-auto px-4 flex gap-4 items-center">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className="px-4 py-3 font-medium text-sm border-b-2 transition-all"
              style={tab === t.key
                ? { color: "#2C244C", borderColor: "#2C244C" }
                : { color: "#666", borderColor: "transparent" }
              }
              onMouseEnter={e => { if (tab !== t.key) (e.target as HTMLElement).style.color = "#8D5273"; }}
              onMouseLeave={e => { if (tab !== t.key) (e.target as HTMLElement).style.color = "#666"; }}
            >
              {t.label}
            </button>
          ))}

        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorBoundary>
          {tab === "find" && <FindPractitioner practitioners={practitioners} />}
          {tab === "directory" && <Directory practitioners={practitioners} />}
          {tab === "manage" && <ManageAvailability practitioners={practitioners} onUpdate={handleUpdate} />}
          {tab === "snapshot" && <AvailabilitySnapshot practitioners={practitioners} />}
          {tab === "intake" && <IntakeTab />}
          {tab === "referral" && <ReferralNetwork practitioners={practitioners} />}
          {tab === "taxonomy" && <TaxonomyTab practitioners={practitioners} onBulkUpdate={handleBulkUpdate} />}
          {tab === "email" && <EmailTemplateTab config={emailConfig} onConfigChange={handleConfigChange} />}
          {tab === "audit" && <AuditTab />}
          {tab === "crm" && (
            <div className="bg-slate-900 rounded-2xl p-6 min-h-[60vh]">
              <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>🔗 CRM Sync — Field Sources</h2>
              <p className="text-slate-400 text-sm mb-6">Shows which app fields are synced from Zoho CRM and which are managed manually. Use this to plan future CRM mapping.</p>
              <CRMSyncTab />
            </div>
          )}
          {saveStatus && (
            <div style={{
              position: "fixed", bottom: 24, right: 24, background: "#2C244C", color: "#fff",
              padding: "10px 20px", borderRadius: 8, fontFamily: "'Poppins', sans-serif",
              fontSize: 14, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}>
              {saveStatus}
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>PsychologyCare VIC · Melbourne</p>
          <p className="mt-2 text-gray-500">For professional inquiries: info@psychologycare.com.au</p>
        </div>
      </footer>
    </div>
  );
}

function AppContent() {
  return (
    <ErrorBoundary>
      <AppMain />
    </ErrorBoundary>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<AppContent />);
