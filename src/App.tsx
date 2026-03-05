import React, { useState } from "react";
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
        {tab === "find" && <FindPractitioner practitioners={practitioners} />}
        {tab === "directory" && <Directory practitioners={practitioners} />}
        {tab === "snapshot" && <AvailabilitySnapshot practitioners={practitioners} />}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
