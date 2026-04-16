import React, { useState, useEffect, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, RefreshCw, X, Download, ExternalLink } from "lucide-react";

const PENDING_PATH = "/tmp/availability_upload_pending.json";
const RESULT_PATH = "/tmp/availability_upload_result.json";
const CSV_PATH = "/tmp/availability_upload.csv";
const BACKUP_PENDING_PATH = "/tmp/backup_pending.json";
const BACKUP_RESULT_PATH = "/tmp/backup_result.json";
const STORAGE_KEY = "pc_practitioners_v8";

const AvailabilityUpload: React.FC = () => {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ log: string; success: boolean; backupUrl?: string; backupFile?: string } | null>(null);
  const [error, setError] = useState("");

  // Backup-only state
  const [backupProcessing, setBackupProcessing] = useState(false);
  const [backupResult, setBackupResult] = useState<{ success: boolean; driveUrl?: string; fileName?: string; error?: string } | null>(null);

  // On mount: check for existing result or pending state
  useEffect(() => {
    const checkState = async () => {
      try {
        const resultRaw = await window.tasklet.runCommand(
          `cat '${RESULT_PATH}' 2>/dev/null || echo '__NOFILE__'`
        );
        const resultText = resultRaw.log.trim();
        if (resultText && resultText !== "__NOFILE__") {
          try {
            const parsed = JSON.parse(resultText);
            if (parsed.type === "clear") {
              // Clear operation completed — show reload button via clearAvailResult state
              setClearAvailResult({ success: parsed.success, message: parsed.success ? "✓ All availability cleared. Reload the app to see changes." : (parsed.log || "Failed to clear availability.") });
              setProcessing(false);
              return;
            }
            if (parsed.log !== undefined) {
              setResult({ log: parsed.log, success: parsed.success, backupUrl: parsed.backupUrl, backupFile: parsed.backupFile });
              setProcessing(false);
              return;
            }
          } catch {}
        }
        const pendingRaw = await window.tasklet.runCommand(
          `cat '${PENDING_PATH}' 2>/dev/null || echo '__NOFILE__'`
        );
        const pendingText = pendingRaw.log.trim();
        if (pendingText && pendingText !== "__NOFILE__") {
          setProcessing(true);
        }

        // Check backup result too
        const backupResultRaw = await window.tasklet.runCommand(
          `cat '${BACKUP_RESULT_PATH}' 2>/dev/null || echo '__NOFILE__'`
        );
        const backupResultText = backupResultRaw.log.trim();
        if (backupResultText && backupResultText !== "__NOFILE__") {
          try {
            const parsed = JSON.parse(backupResultText);
            if (parsed.success !== undefined) {
              setBackupResult(parsed);
              setBackupProcessing(false);
            }
          } catch {}
        } else {
          const backupPendingRaw = await window.tasklet.runCommand(
            `cat '${BACKUP_PENDING_PATH}' 2>/dev/null || echo '__NOFILE__'`
          );
          if (backupPendingRaw.log.trim() !== "__NOFILE__") {
            setBackupProcessing(true);
          }
        }
      } catch {}
    };
    checkState();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setResult(null);
      setError("");
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? "";
        setCsvText(text);
        const rows = text.split("\n").filter((l) => l.trim()).length - 1;
        setRowCount(Math.max(0, rows));
      };
      reader.readAsText(file);
    },
    []
  );

  const handleProcess = useCallback(async () => {
    if (!csvText) return;
    setProcessing(true);
    setError("");
    setResult(null);

    try {
      // Clear old results
      await window.tasklet.runCommand(`rm -f '${RESULT_PATH}' '${BACKUP_RESULT_PATH}'`);

      // Write CSV via base64
      const b64 = btoa(
        new Uint8Array(new TextEncoder().encode(csvText)).reduce(
          (s, b) => s + String.fromCharCode(b),
          ""
        )
      );
      const chunkSize = 4000;
      const chunks: string[] = [];
      for (let i = 0; i < b64.length; i += chunkSize) {
        chunks.push(b64.substring(i, i + chunkSize));
      }
      await window.tasklet.runCommand(`echo '${chunks[0]}' > /tmp/avail_b64.txt`);
      for (let i = 1; i < chunks.length; i++) {
        await window.tasklet.runCommand(
          `echo '${chunks[i]}' >> /tmp/avail_b64.txt`
        );
      }
      await window.tasklet.runCommand(
        `base64 -d /tmp/avail_b64.txt > '${CSV_PATH}'`
      );

      // Write pending flag
      const pendingJson = JSON.stringify({ fileName, timestamp: Date.now() });
      const pendingB64 = btoa(pendingJson);
      await window.tasklet.runCommand(
        `echo '${pendingB64}' | base64 -d > '${PENDING_PATH}'`
      );

      // Send message to agent
      // Note: sendMessageToAgent can time out while agent is still processing — that's OK.
      // The CSV is already written; we just continue to polling regardless.
      try {
        await window.tasklet.sendMessageToAgent("AVAILABILITY_CSV_UPLOAD");
      } catch {
        // Timeout or send error — agent likely received the message and is processing.
        // Continue to polling.
      }

      // Poll for result every 4 seconds (agent takes 20-40s to process)
      const maxAttempts = 30; // 2 minutes max
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 4000));
        try {
          const raw = await window.tasklet.runCommand(
            `cat '${RESULT_PATH}' 2>/dev/null || echo '__NOFILE__'`
          );
          const text = raw.log.trim();
          if (text && text !== "__NOFILE__") {
            const parsed = JSON.parse(text);
            if (parsed.log !== undefined) {
              setResult({ log: parsed.log, success: parsed.success, backupUrl: parsed.backupUrl, backupFile: parsed.backupFile });
              setProcessing(false);
              // Clear pending flag
              await window.tasklet.runCommand(`rm -f '${PENDING_PATH}'`);
              return;
            }
          }
        } catch {}
      }
      // Timed out
      setError("Processing is taking longer than expected. Please check back shortly or reload the app.");
      setProcessing(false);
    } catch (err) {
      // Use console.warn not console.error to avoid triggering the app error boundary
      console.warn("Upload error:", err);
      setError("Failed to submit CSV for processing. Please try again.");
      setProcessing(false);
    }
  }, [csvText, fileName]);

  const handleBackupNow = useCallback(async () => {
    setBackupProcessing(true);
    setBackupResult(null);
    try {
      await window.tasklet.runCommand(`rm -f '${BACKUP_RESULT_PATH}'`);
      const pendingJson = JSON.stringify({ timestamp: Date.now() });
      const pendingB64 = btoa(pendingJson);
      await window.tasklet.runCommand(
        `echo '${pendingB64}' | base64 -d > '${BACKUP_PENDING_PATH}'`
      );
      await window.tasklet.sendMessageToAgent("BACKUP_REQUEST");
    } catch (err) {
      console.warn("Backup error:", err);
      setBackupResult({ success: false, error: "Failed to start backup. Please try again." });
      setBackupProcessing(false);
    }
  }, []);

  const handleReload = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const handleClear = useCallback(async () => {
    setCsvText("");
    setFileName("");
    setRowCount(0);
    setResult(null);
    setError("");
    setProcessing(false);
    try {
      await window.tasklet.runCommand(
        `rm -f '${PENDING_PATH}' '${RESULT_PATH}' '${CSV_PATH}' /tmp/avail_b64.txt`
      );
    } catch {}
  }, []);

  const handleClearBackup = useCallback(async () => {
    setBackupResult(null);
    setBackupProcessing(false);
    try {
      await window.tasklet.runCommand(`rm -f '${BACKUP_PENDING_PATH}' '${BACKUP_RESULT_PATH}'`);
    } catch {}
  }, []);

  const [clearingAvail, setClearingAvail] = useState(false);
  const [clearAvailResult, setClearAvailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearInProgressRef = React.useRef(false);

  const handleClearAllAvailability = useCallback(async () => {
    if (clearInProgressRef.current) return; // prevent double execution
    clearInProgressRef.current = true;
    setShowClearConfirm(false);
    setClearingAvail(true);
    setClearAvailResult(null);
    try {
      // Clean up any stale result files first
      await window.tasklet.runCommand("rm -f /tmp/backup_pending.json /tmp/backup_result.json /tmp/availability_upload_pending.json /tmp/availability_upload_result.json /tmp/clear_result.json");

      // Send async message to agent — may time out while agent is processing, that's OK.
      // The agent will run clear_availability.py which writes the result file.
      // We poll for the result file rather than waiting for runCommand to return.
      try {
        await window.tasklet.sendMessageToAgent("CLEAR_AVAILABILITY");
      } catch {
        // Timeout expected — agent likely received the message and is processing.
      }

      // Poll for result every 4 seconds (max ~80 seconds)
      const maxAttempts = 20;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 4000));
        try {
          const raw = await window.tasklet.runCommand("cat '/tmp/availability_upload_result.json' 2>/dev/null || echo '__NOFILE__'");
          const text = raw.log.trim();
          if (text && text !== "__NOFILE__") {
            const parsed = JSON.parse(text);
            if (parsed.type === "clear") {
              setClearAvailResult({
                success: parsed.success,
                message: parsed.success ? "✓ All availability cleared. Reload the app to see changes." : (parsed.log || "Failed to clear availability.")
              });
              setClearingAvail(false);
              clearInProgressRef.current = false;
              return;
            }
          }
        } catch {}
      }
      // Timed out polling
      setClearAvailResult({ success: false, message: "Clear timed out. Reload the app to check if availability was cleared." });
    } catch (err) {
      console.warn("Clear error:", err);
      setClearAvailResult({ success: false, message: "Failed to send clear request. Please try again." });
    } finally {
      setClearingAvail(false);
      clearInProgressRef.current = false;
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="bg-white rounded-xl p-6 shadow-sm"
        style={{ border: "1px solid #CDA8BA" }}
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: "#2C244C" }}>
          📊 Update Availability
        </h2>
        <p className="text-sm" style={{ color: "#36454F", opacity: 0.7 }}>
          Export appointment data from Zanda Reports filtered by availability
          flags, then upload the CSV here to instantly update all practitioner
          availability. Manual edits made in the Manage tab are always preserved.
        </p>
      </div>

      {/* Backup section */}
      <div
        className="bg-white rounded-xl p-6 shadow-sm space-y-4"
        style={{ border: "1px solid #CDA8BA" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold mb-1" style={{ color: "#2C244C" }}>
              💾 Backup All Practitioner Data
            </h3>
            <p className="text-sm" style={{ color: "#36454F", opacity: 0.7 }}>
              Save a full backup of all practitioner info (bios, fees, presentations, availability, alerts) to Google Drive before making changes. A backup is also created automatically before every CSV import.
            </p>
          </div>
          <button
            className="btn gap-2 shrink-0"
            style={{ backgroundColor: "#2C244C", color: "white", border: "none" }}
            onClick={handleBackupNow}
            disabled={backupProcessing}
          >
            {backupProcessing ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Backing up…
              </>
            ) : (
              <>
                <Download size={16} />
                Create Backup Now
              </>
            )}
          </button>
        </div>

        {backupProcessing && (
          <p className="text-sm italic" style={{ color: "#36454F", opacity: 0.55 }}>
            Generating spreadsheet and saving to Google Drive… usually 15–20 seconds.
          </p>
        )}

        {backupResult && (
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
            style={{
              backgroundColor: backupResult.success ? "#F0EEF7" : "#FEF2F2",
              border: `1px solid ${backupResult.success ? "#CDA8BA" : "#FECACA"}`
            }}
          >
            <div className="flex items-center gap-2">
              {backupResult.success ? (
                <CheckCircle size={16} style={{ color: "#47B2AE" }} />
              ) : (
                <AlertCircle size={16} className="text-error" />
              )}
              <span className="text-sm" style={{ color: "#2C244C" }}>
                {backupResult.success
                  ? `✓ Backed up: ${backupResult.fileName}`
                  : backupResult.error || "Backup failed"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {backupResult.success && backupResult.driveUrl && (
                <a
                  href={backupResult.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs gap-1"
                  style={{ backgroundColor: "#8D5273", color: "white", border: "none" }}
                >
                  <ExternalLink size={12} />
                  Open in Drive
                </a>
              )}
              <button className="btn btn-ghost btn-xs" onClick={handleClearBackup}>
                <X size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        className="bg-white rounded-xl p-6 shadow-sm"
        style={{ border: "1px solid #CDA8BA" }}
      >
        <h3 className="font-semibold mb-3" style={{ color: "#2C244C" }}>
          How to export from Zanda:
        </h3>
        <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: "#36454F" }}>
          <li>Go to <strong>Settings → Practice → Data Export</strong> → select <strong>All data</strong> → on the next screen select <strong>Appointments only</strong> (uncheck everything else) → <strong>Export</strong></li>
          <li>Come back in a few minutes and download the export file</li>
          <li>Open in Excel and add a filter to each column</li>
          <li><strong>Remove non-2026 rows:</strong> In the <strong>Start</strong> column filter, uncheck <em>2026</em> so only non-2026 rows are visible → click the first visible data row → Cmd+Shift+Down Arrow to select all → right-click → <strong>Delete rows</strong> → reset filter to show all</li>
          <li><strong>Trim to next 6 weeks:</strong> In the <strong>Start</strong> column filter, uncheck dates from tomorrow through to 6 weeks away so dates <em>outside</em> that window are visible → select all visible rows → delete → reset filter to show all (should now only show appointments in the next 6 weeks)</li>
          <li><strong>Remove real client appointments:</strong> In the <strong>Appointment Type</strong> column, filter to show <strong>Client appointments only</strong> → select all visible rows → delete (we only need the availability placeholder appointments, which are stored as Personal appointments)</li>
          <li><strong>Remove non-availability personal appointments:</strong> Filter <strong>Appointment Type</strong> to show <strong>Personal Appointments only</strong> → in the <strong>Appointment Flag</strong> column, filter to show everything <em>except</em> Weekly Availability and Fortnightly Availability → select all visible rows → delete</li>
          <li>Reset filter to show all — only <strong>Weekly Availability</strong> and <strong>Fortnightly Availability</strong> rows should remain</li>
          <li>Delete all other columns, leaving only: <strong>Start, Diary, Location, Appointment Flag</strong></li>
          <li>Save as CSV named <strong>Practitioner availability ddmmyyyy</strong> and upload below</li>
        </ol>
        <div
          className="mt-4 rounded-lg px-4 py-3 text-xs"
          style={{ backgroundColor: "#F0EEF7", color: "#8D5273" }}
        >
          💡 <strong>Between uploads:</strong> Use the{" "}
          <strong>Manage tab</strong> to make one-off changes (notes, bios,
          fees, alerts). Those edits always survive the next CSV upload.
          <br />
          <strong>Auto-backup:</strong> A backup is automatically saved to Google Drive every time you process a CSV — so you can always roll back.
        </div>
      </div>

      {/* Upload section */}
      <div
        className="bg-white rounded-xl p-6 shadow-sm space-y-4"
        style={{ border: "1px solid #CDA8BA" }}
      >
        <label className="block">
          <span className="text-sm font-medium" style={{ color: "#2C244C" }}>
            Select Zanda CSV export
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={processing}
            className="file-input file-input-bordered w-full mt-2"
          />
        </label>

        {fileName && !processing && (
          <p className="text-sm" style={{ color: "#47B2AE" }}>
            ✓ <strong>{fileName}</strong> — {rowCount} appointment rows ready to process
          </p>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          <button
            className="btn btn-primary gap-2"
            onClick={handleProcess}
            disabled={!csvText || processing}
          >
            {processing ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Processing…
              </>
            ) : (
              <>
                <Upload size={18} />
                Process CSV
              </>
            )}
          </button>

          {(csvText || result) && !processing && (
            <button className="btn btn-ghost btn-sm gap-1" onClick={handleClear}>
              <X size={15} /> Clear
            </button>
          )}
        </div>

        {processing && (
          <p className="text-sm italic" style={{ color: "#36454F", opacity: 0.55 }}>
            Creating backup then updating availability for all practitioners — usually 30–50 seconds…
          </p>
        )}

        {error && (
          <div className="alert alert-error text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result log */}
      {result && (
        <div
          className="bg-white rounded-xl p-6 shadow-sm space-y-4"
          style={{ border: "1px solid #CDA8BA" }}
        >
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle size={20} style={{ color: "#47B2AE" }} />
            ) : (
              <AlertCircle size={20} className="text-error" />
            )}
            <h3 className="text-lg font-bold" style={{ color: "#2C244C" }}>
              {result.success ? "Import Complete!" : "Import finished with warnings"}
            </h3>
          </div>

          {result.backupUrl && (
            <div
              className="rounded-lg px-4 py-2 flex items-center justify-between gap-3"
              style={{ backgroundColor: "#F0EEF7" }}
            >
              <span className="text-xs" style={{ color: "#8D5273" }}>
                💾 Backup saved: <strong>{result.backupFile}</strong>
              </span>
              <a
                href={result.backupUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-xs gap-1"
                style={{ backgroundColor: "#8D5273", color: "white", border: "none" }}
              >
                <ExternalLink size={12} />
                Open in Drive
              </a>
            </div>
          )}

          <div
            className="rounded-lg p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-64"
            style={{ backgroundColor: "#F0EEF7" }}
          >
            {result.log}
          </div>

          {result.success && (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                className="btn btn-primary gap-2"
                onClick={handleReload}
              >
                <RefreshCw size={16} />
                Reload app to see changes
              </button>
              <p className="text-xs" style={{ color: "#36454F", opacity: 0.55 }}>
                Reloads fresh data — your manual edits are all preserved.
              </p>
            </div>
          )}
        </div>
      )}
      {/* Clear All Availability section */}
      <div
        className="bg-white rounded-xl p-6 shadow-sm space-y-4"
        style={{ border: "1px solid #CDA8BA" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold mb-1" style={{ color: "#2C244C" }}>
              🗑️ Clear All Availability
            </h3>
            <p className="text-sm" style={{ color: "#36454F", opacity: 0.7 }}>
              Removes all availability slots from every practitioner. All other data (bios, alerts, fees, notes) is preserved. Use this if you want to start fresh before uploading a new CSV.
            </p>
          </div>
          {!showClearConfirm && !clearingAvail && !clearAvailResult && (
            <button
              className="btn gap-2 shrink-0"
              style={{ backgroundColor: "#8D5273", color: "white", border: "none" }}
              onClick={() => setShowClearConfirm(true)}
            >
              🗑️ Clear All Availability
            </button>
          )}
          {clearingAvail && (
            <button className="btn gap-2 shrink-0" disabled style={{ backgroundColor: "#8D5273", color: "white", border: "none" }}>
              <span className="loading loading-spinner loading-sm" />
              Clearing…
            </button>
          )}
        </div>

        {showClearConfirm && (
          <div
            className="rounded-lg px-4 py-4 space-y-3"
            style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#2C244C" }}>
              ⚠️ Are you sure you want to clear ALL availability?
            </p>
            <p className="text-sm" style={{ color: "#36454F" }}>
              This removes every availability slot from all practitioners. Bios, alerts, fees and notes are preserved. <strong>Make sure you have a backup first.</strong>
            </p>
            <div className="flex gap-3">
              <button
                className="btn btn-sm"
                style={{ backgroundColor: "#8D5273", color: "white", border: "none" }}
                onClick={handleClearAllAvailability}
              >
                Yes, clear all availability
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {clearAvailResult && (
          <div
            className="rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
            style={{
              backgroundColor: clearAvailResult.success ? "#F0EEF7" : "#FEF2F2",
              border: `1px solid ${clearAvailResult.success ? "#CDA8BA" : "#FECACA"}`
            }}
          >
            <span className="text-sm" style={{ color: "#2C244C" }}>
              {clearAvailResult.message}
            </span>
            {clearAvailResult.success && (
              <button
                className="btn btn-primary btn-sm gap-2"
                onClick={handleReload}
              >
                <RefreshCw size={14} />
                Reload app
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityUpload;
