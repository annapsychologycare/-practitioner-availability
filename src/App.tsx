import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import FindPractitioner from "./FindPractitioner";
import Directory from "./Directory";
import AvailabilitySnapshot from "./AvailabilitySnapshot";
import IntakeTab from "./components/IntakeTab";
import { createRoot } from "react-dom/client";
import { PRACTITIONERS_DATA } from "./practitionersData";
import "./index.css";

// Error boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "sans-serif", color: "#333" }}>
          <h2 style={{ color: "#c00" }}>Something went wrong</h2>
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Tab = "find" | "directory" | "snapshot" | "intake";

function AppContent() {
  const [tab, setTab] = useState<Tab>("find");

  const tabs = [
    { key: "find", label: "🔍 Find a Practitioner" },
    { key: "directory", label: "📖 Directory" },
    { key: "snapshot", label: "📋 Availability Snapshot" },
    { key: "intake", label: "📝 Intake" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: "#2C244C" }} className="text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center">
          <img src="/logo.svg" alt="PsychologyCare" style={{ height: 72, width: "auto", marginBottom: 10 }} />
          <p style={{ color: "#d8d0ec", fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}>
            Practitioner Matching &amp; Client Intake
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm" style={{ borderColor: "#e8e4f0" }}>
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
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
          {tab === "find" && <FindPractitioner practitioners={PRACTITIONERS_DATA} />}
          {tab === "directory" && <Directory practitioners={PRACTITIONERS_DATA} />}
          {tab === "snapshot" && <AvailabilitySnapshot practitioners={PRACTITIONERS_DATA} />}
          {tab === "intake" && <IntakeTab />}
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

const root = createRoot(document.getElementById("root")!);
root.render(<AppContent />);
