import React, { useState, useCallback } from "react";

type IntakeType = "form" | "transcript" | "notes";

const IntakeTab: React.FC = () => {
  const [intakeType, setIntakeType] = useState<IntakeType>("form");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSummarise = useCallback(async () => {
    if (!text.trim()) return;

    setSending(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/.netlify/functions/process-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "intake",
          intake_type: intakeType,
          text: text,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as Record<string, string>).error || "Failed to send"
        );
      }

      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [text, intakeType]);

  const handleClear = useCallback(() => {
    setText("");
    setSent(false);
    setError("");
  }, []);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          📝 Intake Summary
        </h2>
        <p className="text-gray-500 text-sm">
          Paste an intake form submission, call transcript, or call notes below.
          AI will extract the key matching criteria and email you a summary you
          can paste straight into the client&apos;s file in Zanda.
        </p>
      </div>

      {/* Input Section */}
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
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Text area */}
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm leading-relaxed resize-y focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
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
                Sending...
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

      {/* Success confirmation */}
      {sent && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xl">✅</span>
            <h3 className="text-lg font-bold text-gray-900">
              Summary on its way!
            </h3>
          </div>
          <p className="text-gray-600 text-sm">
            The AI is processing your intake text now. You&apos;ll receive the
            structured summary by email within a minute or two. You can then
            copy it straight into Zanda.
          </p>
          <button
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            onClick={handleClear}
          >
            Process another intake
          </button>
        </div>
      )}
    </div>
  );
};

export default IntakeTab;
