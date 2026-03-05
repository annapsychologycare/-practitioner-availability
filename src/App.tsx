import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { PRACTITIONERS_DATA } from "./practitionersData";
import { Practitioner } from "./types";
import FindPractitioner from "./FindPractitioner";
import Directory from "./Directory";
import AvailabilitySnapshot from "./AvailabilitySnapshot";
import { createRoot } from "react-dom/client";
import "./index.css";

const STORAGE_KEY = "pc_practitioners_v4";

function loadPractitioners(): Practitioner[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return PRACTITIONERS_DATA as unknown as Practitioner[];
}

// Error boundary to catch crashes and show diagnostic info
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

type Tab = "find" | "directory" | "snapshot";

export default function App() {
  const [tab, setTab] = useState<Tab>("find");
  const [practitioners] = useState<Practitioner[]>(loadPractitioners);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-primary text-primary-content shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">PsychologyCare</h1>
          <p className="text-primary-content/80 text-sm">Practitioner Matching & Availability Tool</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="tabs tabs-bordered">
            <button
              className={`tab tab-lg font-medium ${tab === "find" ? "tab-active" : ""}`}
              onClick={() => setTab("find")}
            >
              🔍 Find a Practitioner
            </button>
            <button
              className={`tab tab-lg font-medium ${tab === "directory" ? "tab-active" : ""}`}
              onClick={() => setTab("directory")}
            >
              👥 Directory
            </button>
            <button
              className={`tab tab-lg font-medium ${tab === "snapshot" ? "tab-active" : ""}`}
              onClick={() => setTab("snapshot")}
            >
              📋 Availability Snapshot
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ErrorBoundary>
          {tab === "find" && <FindPractitioner practitioners={practitioners} />}
          {tab === "directory" && <Directory practitioners={practitioners} />}
          {tab === "snapshot" && <AvailabilitySnapshot practitioners={practitioners} />}
        </ErrorBoundary>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
