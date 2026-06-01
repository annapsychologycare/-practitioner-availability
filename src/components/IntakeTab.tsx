import React, { useState, useCallback } from "react";

type IntakeType = "form" | "transcript" | "notes";

interface IntakeSummary {
  client_name?: string | null;
  client_age?: string | null;
  gender?: string | null;
  presenting_issues?: string[] | null;
  risk_indicators?: string[] | null;
  location_preference?: string | null;
  timing_preference?: string | null;
  frequency?: string | null;
  modality_preference?: string | null;
  funding?: string | null;
  previous_therapy?: string | null;
  referral_source?: string | null;
  additional_notes?: string | null;
}

const IntakeTab: React.FC = () => {
  const [intakeType, setIntakeType] = useState<IntakeType>("form");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<IntakeSummary | null>(null);
  const [error, setError] = useState("");

  const handleSummarise = useCallback(async () => {
    if (!text.trim()) return;

    setSending(true);
    setError("");
    setSummary(null);

    try {
      const res = await fetch("/.netlify/functions/process-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake_type: intakeType,
          text: text,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Failed to process intake"
        );
      }

      const result = (await res.json()) as IntakeSummary;
      setSummary(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [text, intakeType]);

  const handleClear = useCallback(() => {
    setText("");
    setSummary(null);
    setError("");
  }, []);

  const handleCopySummary = useCallback(async () => {
    if (!summary) return;

    const lines: string[] = [];

    if (summary.client_name) lines.push(`Client: ${summary.client_name}`);
    if (summary.client_age) lines.push(`Age: ${summary.client_age}`);
    if (summary.gender) lines.push(`Gender: ${summary.gender}`);

    if (summary.presenting_issues && summary.presenting_issues.length > 0) {
      lines.push("\nPresenting Issues:");
      summary.presenting_issues.forEach((issue) => {
        lines.push(`• ${issue}`);
      });
    }

    if (summary.risk_indicators && summary.risk_indicators.length > 0) {
      lines.push("\nRisk Indicators:");
      summary.risk_indicators.forEach((risk) => {
        lines.push(`• ${risk}`);
      });
    }

    if (summary.location_preference)
      lines.push(`\nLocation Preference: ${summary.location_preference}`);
    if (summary.timing_preference)
      lines.push(`Timing: ${summary.timing_preference}`);
    if (summary.frequency) lines.push(`Frequency: ${summary.frequency}`);
    if (summary.modality_preference)
      lines.push(`Modality: ${summary.modality_preference}`);
    if (summary.funding) lines.push(`Funding: ${summary.funding}`);
    if (summary.previous_therapy)
      lines.push(`Previous Therapy: ${summary.previous_therapy}`);
    if (summary.referral_source)
      lines.push(`Referral Source: ${summary.referral_source}`);
    if (summary.additional_notes)
      lines.push(`\nAdditional Notes:\n${summary.additional_notes}`);

    const copyText = lines.join("\n");

    try {
      await navigator.clipboard.writeText(copyText);
      alert("Summary copied to clipboard!");
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Summary copied to clipboard!");
    }
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          📝 Intake Summary
        </h2>
        <p className="text-gray-500 text-sm">
          Paste an intake form submission, call transcript, or call notes below.
          AI will instantly extract the key matching criteria for practitioner
          selection.
        </p>
      </div>

      {/* Input Section */}
      {!summary && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                { key: "form", icon: "📋", label: "Intake Form" },
                { key: "transcript", icon: "📞", label: "Call Transcript" },
                { key: "notes", icon: "📝", label: "Call Notes" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  intakeType === opt.key
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setIntakeType(opt.key)}
                disabled={sending}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Text area */}
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm leading-relaxed resize-y focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none disabled:bg-gray-50"
            placeholder={
              intakeType === "form"
                ? "Paste the intake form content here..."
                : intakeType === "transcript"
                  ? "Paste the call transcript here..."
                  : "Paste your call notes here..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />

          {/* Character count */}
          {text.length > 0 && (
            <p className="text-xs text-gray-400">
              {text.length.toLocaleString()} characters
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleSummarise}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                <>✨ Summarise</>
              )}
            </button>
            {text && !sending && (
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                onClick={handleClear}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Summary display */}
      {summary && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">✅</span>
              <h3 className="text-lg font-bold text-gray-900">
                Intake Summary
              </h3>
            </div>
            <button
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors flex items-center gap-2"
              onClick={handleCopySummary}
            >
              📋 Copy
            </button>
          </div>

          {/* Summary content */}
          <div className="space-y-3 text-sm">
            {summary.client_name && (
              <div>
                <p className="text-gray-500 font-semibold">Client Name</p>
                <p className="text-gray-900">{summary.client_name}</p>
              </div>
            )}

            {(summary.client_age || summary.gender) && (
              <div>
                <p className="text-gray-500 font-semibold">Demographics</p>
                <p className="text-gray-900">
                  {[summary.client_age, summary.gender]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}

            {summary.presenting_issues &&
              summary.presenting_issues.length > 0 && (
                <div>
                  <p className="text-gray-500 font-semibold">
                    Presenting Issues
                  </p>
                  <ul className="text-gray-900 space-y-1">
                    {summary.presenting_issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

            {summary.risk_indicators && summary.risk_indicators.length > 0 && (
              <div>
                <p className="text-gray-500 font-semibold">Risk Indicators</p>
                <ul className="text-gray-900 space-y-1">
                  {summary.risk_indicators.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.location_preference && (
              <div>
                <p className="text-gray-500 font-semibold">
                  Location Preference
                </p>
                <p className="text-gray-900">{summary.location_preference}</p>
              </div>
            )}

            {summary.timing_preference && (
              <div>
                <p className="text-gray-500 font-semibold">Timing</p>
                <p className="text-gray-900">{summary.timing_preference}</p>
              </div>
            )}

            {summary.frequency && (
              <div>
                <p className="text-gray-500 font-semibold">Frequency</p>
                <p className="text-gray-900">{summary.frequency}</p>
              </div>
            )}

            {summary.modality_preference && (
              <div>
                <p className="text-gray-500 font-semibold">Modality</p>
                <p className="text-gray-900">{summary.modality_preference}</p>
              </div>
            )}

            {summary.funding && (
              <div>
                <p className="text-gray-500 font-semibold">Funding</p>
                <p className="text-gray-900">{summary.funding}</p>
              </div>
            )}

            {summary.previous_therapy && (
              <div>
                <p className="text-gray-500 font-semibold">Previous Therapy</p>
                <p className="text-gray-900">{summary.previous_therapy}</p>
              </div>
            )}

            {summary.referral_source && (
              <div>
                <p className="text-gray-500 font-semibold">Referral Source</p>
                <p className="text-gray-900">{summary.referral_source}</p>
              </div>
            )}

            {summary.additional_notes && (
              <div>
                <p className="text-gray-500 font-semibold">
                  Additional Notes
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {summary.additional_notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-200 flex gap-2">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex-1"
              onClick={handleClear}
            >
              Process another intake
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeTab;
