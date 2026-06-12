import React, { useState } from 'react';
import { AVAILABILITY_LAST_UPDATED } from '../practitionersData';

const COLORS = {
  darkPurple: '#2C244C',
  mauve: '#8D5273',
  lightLilac: '#F0EEF7',
  lightMauve: '#CDA8BA',
  coolBlue: '#366188',
  warmBlue: '#52A3BA',
};

interface IntakeSummary {
  client_name: string | null;
  age: string | null;
  sex: string | null;
  gender: string | null;
  presenting_issues: string[];
  risk_indicators: string | null;
  risk_suicidality: string | null;
  risk_selfharm: string | null;
  risk_eating: string | null;
  risk_substances: string | null;
  risk_other: string | null;
  location_preference: string | null;
  timing: string | null;
  frequency: string | null;
  modality_preference: string | null;
  therapy_style: string | null;
  funding: string | null;
  previous_therapy: string | null;
  diagnosis: string | null;
  medication: string | null;
  referral_source: string | null;
  specific_practitioner: string | null;
  additional_notes: string | null;
}

interface PractitionerMatch {
  name: string;
  match_score: 'Strong' | 'Good' | 'Possible';
  reasons: string[];
  availability_note: string;
  photo_url?: string;
  title?: string;
  gender?: string;
  locations?: { location: string; availability: string }[];
  billing_types?: string[];
}

interface MatchResult {
  summary: IntakeSummary;
  matches: PractitionerMatch[];
  email_intro: string | null;
  ai_display_summary: string | null;
  ai_powered: boolean;
}

const NETLIFY_BASE = 'https://practitioneravailabilitypsychologycar.netlify.app';

const scoreColor = (score: string) => {
  if (score === 'Strong') return '#2e7d32';
  if (score === 'Good') return COLORS.coolBlue;
  return COLORS.mauve;
};

const scoreBg = (score: string) => {
  if (score === 'Strong') return '#e8f5e9';
  if (score === 'Good') return '#e3f2fd';
  return '#f8e8ef';
};

export default function IntakeTab() {
  const [text, setText] = useState('');
  const [intakeType, setIntakeType] = useState<'form' | 'transcript' | 'notes'>('notes');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);
    try {
      const res = await fetch('/.netlify/functions/match-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, intake_type: intakeType }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        setError('Request timed out — the AI took too long to respond. Please try again.');
      } else {
        setError(e.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const summaryText = result ? buildSummaryText(result.summary) : '';

  const handleCopy = async () => {
    if (!result) return;
    const fullText = buildFullCopyText(result);
    const copyText = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        try {
          const el = document.createElement('textarea');
          el.value = text;
          el.style.position = 'fixed';
          el.style.left = '-9999px';
          document.body.appendChild(el);
          el.focus();
          el.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(el);
          return ok;
        } catch {
          return false;
        }
      }
    };
    const ok = await copyText(fullText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ color: COLORS.darkPurple, margin: 0 }}>📝 Intake & Practitioner Matching</h2>
        <span style={{ fontSize: 12, color: '#6b5b8a', background: '#f0eef7', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          📅 Availability updated {AVAILABILITY_LAST_UPDATED}
        </span>
      </div>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Paste intake notes, a form response, or a call transcript. Get an instant summary and practitioner match suggestions.
      </p>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['form', 'transcript', 'notes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setIntakeType(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: `2px solid ${intakeType === t ? COLORS.mauve : '#ccc'}`,
              background: intakeType === t ? COLORS.mauve : 'white',
              color: intakeType === t ? 'white' : '#555',
              cursor: 'pointer',
              fontWeight: intakeType === t ? 600 : 400,
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {t === 'form' ? '📋 Form' : t === 'transcript' ? '🎙️ Transcript' : '📝 Notes'}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste intake information here..."
        rows={10}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${COLORS.lightMauve}`,
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        style={{
          marginTop: 12,
          padding: '10px 28px',
          background: loading || !text.trim() ? '#ccc' : `linear-gradient(135deg, ${COLORS.darkPurple}, ${COLORS.mauve})`,
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {loading ? '⏳ Matching...' : '✨ Summarise & Match Practitioners'}
      </button>

      {loading && (
        <p style={{ color: COLORS.mauve, marginTop: 12, fontSize: 13 }}>
          Matching against practitioner roster…
        </p>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: 16, background: '#ffeaea', borderRadius: 8, color: '#c00', fontSize: 13 }}>
          <strong>⚠️ Matching unavailable</strong>
          <div style={{ marginTop: 6, color: '#800' }}>
            Matching service error. Please try again or contact your Tasklet agent.
          </div>
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer', color: '#a00', fontSize: 12 }}>Technical detail</summary>
            <div style={{ marginTop: 4, fontSize: 12, fontFamily: 'monospace' }}>{error}</div>
          </details>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 32 }}>
          {/* Summary section */}
          <div style={{
            background: COLORS.lightLilac,
            borderRadius: 12,
            padding: 20,
            marginBottom: 32,
            borderLeft: `4px solid ${COLORS.mauve}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: COLORS.darkPurple, fontSize: 16 }}>📋 Intake Summary</h3>
              <button
                onClick={handleCopy}
                style={{
                  padding: '6px 14px',
                  background: copied ? '#2e7d32' : COLORS.mauve,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Summary + Matches'}
              </button>
            </div>
            {result.ai_display_summary ? (
              <AISummaryDisplay text={result.ai_display_summary} />
            ) : (
              <SummaryDisplay summary={result.summary} />
            )}
          </div>

          {/* Matches section */}
          <h3 style={{ color: COLORS.darkPurple, marginBottom: 4, fontSize: 18 }}>🎯 Suggested Practitioners</h3>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
            Ranked by match strength based on presentations, client preferences, and current availability.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {result.matches.map((match, i) => (
              <MatchCard key={i} match={match} rank={i + 1} />
            ))}
          </div>

          {/* Email Intro section */}
          {result.email_intro && (
            <EmailIntroBox intro={result.email_intro} clientName={result.summary?.client_name ?? null} />
          )}
        </div>
      )}
    </div>
  );
}

function SummaryField({ label, value, highlight }: { label: string; value: string | string[] | null | undefined; highlight?: boolean }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: COLORS.mauve, fontWeight: 600, minWidth: 140, flexShrink: 0 }}>{label}:</span>
      <span style={{ color: highlight ? '#c00' : '#333', fontWeight: highlight ? 600 : 400 }}>
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: 700, color: COLORS.darkPurple, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, borderBottom: `1px solid ${COLORS.lightMauve}`, paddingBottom: 3 }}>{title}</div>
      {children}
    </div>
  );
}

function AISummaryDisplay({ text }: { text: string }) {
  // Render the AI-generated clinical intake note with section headers, KV pairs, bullets
  const lines = text.split('\n');
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: 'white',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.5,
          padding: '2px 8px',
          borderRadius: 10,
        }}>✨ AI Summary</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: '#333' }}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} style={{ height: 5 }} />;

          // Title line: "INTAKE SUMMARY – PSYCHOLOGYCARE"
          if (/^INTAKE SUMMARY/i.test(trimmed)) {
            return (
              <div key={i} style={{
                fontWeight: 700,
                color: COLORS.darkPurple,
                fontSize: 15,
                marginBottom: 12,
                borderBottom: `2px solid ${COLORS.mauve}`,
                paddingBottom: 6,
              }}>{trimmed}</div>
            );
          }

          // Section headers: ALL CAPS lines only (e.g. "PRESENTING CONCERNS", "RISK ASSESSMENT")
          const isAllCaps = /^[A-Z][A-Z\s\/\-&,\.]+$/.test(trimmed) && trimmed.length > 4 && !/^\d/.test(trimmed);
          if (isAllCaps) {
            return (
              <div key={i} style={{
                fontWeight: 700,
                color: COLORS.darkPurple,
                fontSize: 11.5,
                letterSpacing: 0.8,
                marginTop: 16,
                marginBottom: 6,
                borderBottom: `1px solid ${COLORS.lightMauve}`,
                paddingBottom: 4,
              }}>{trimmed}</div>
            );
          }

          // Key: Value lines in the header block (e.g. "Client: Daniel", "Funding: Self-managed NDIS")
          // Only match if the key part has no more than 5 words
          const kvMatch = trimmed.match(/^([A-Za-z][A-Za-z\s]{1,40}?):\s+(.+)$/);
          if (kvMatch && !trimmed.startsWith('•') && !trimmed.startsWith('-') && kvMatch[1].split(' ').length <= 5) {
            return (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: COLORS.mauve, minWidth: 190, flexShrink: 0 }}>{kvMatch[1]}:</span>
                <span style={{ flex: 1 }}>{kvMatch[2]}</span>
              </div>
            );
          }

          // Bullet lines starting with • or -
          if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('-\t')) {
            const content = trimmed.startsWith('•') ? trimmed.slice(1).trim() : trimmed.slice(1).trim();
            return (
              <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                <span style={{ color: COLORS.mauve, flexShrink: 0, marginTop: 1 }}>•</span>
                <span>{content}</span>
              </div>
            );
          }

          // Default: prose line
          return <div key={i} style={{ marginBottom: 4 }}>{trimmed}</div>;
        })}
      </div>
    </div>
  );
}

function SummaryDisplay({ summary }: { summary: IntakeSummary }) {
  const riskFields = [
    summary.risk_suicidality ? `Suicidality: ${summary.risk_suicidality}` : null,
    summary.risk_selfharm ? `Self-harm: ${summary.risk_selfharm}` : null,
    summary.risk_eating ? `Eating/body image: ${summary.risk_eating}` : null,
    summary.risk_substances ? `Substances: ${summary.risk_substances}` : null,
    summary.risk_other ? `Other: ${summary.risk_other}` : null,
  ].filter(Boolean) as string[];

  const hasRisk = riskFields.length > 0;

  return (
    <div>
      {/* Client */}
      <SummarySection title="👤 Client">
        <SummaryField label="Name" value={summary.client_name} />
        <SummaryField label="Age" value={summary.age} />
        <SummaryField label="Sex" value={summary.sex} />
        <SummaryField label="Referral source" value={summary.referral_source} />
      </SummarySection>

      {/* Presenting */}
      {(summary.presenting_issues?.length > 0) && (
        <SummarySection title="🎯 Presenting Issues">
          <div style={{ fontSize: 13, color: '#333' }}>
            {summary.presenting_issues.map((issue, i) => (
              <div key={i} style={{ marginBottom: 2 }}>• {issue}</div>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Risk */}
      <SummarySection title="⚠️ Risk">
        {hasRisk ? (
          <div style={{ background: '#fff3cd', borderRadius: 6, padding: '8px 12px', border: '1px solid #ffc107' }}>
            {riskFields.map((r, i) => (
              <div key={i} style={{ fontSize: 13, color: '#856404', fontWeight: 600, marginBottom: 2 }}>{r}</div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#2e7d32' }}>✓ Nil identified</div>
        )}
      </SummarySection>

      {/* Modalities & approach */}
      <SummarySection title="🧠 Modalities & Approach">
        <SummaryField label="Preferred modalities" value={summary.modality_preference || 'Not specified'} />
        <SummaryField label="Therapy style" value={summary.therapy_style} />
        <SummaryField label="Clinician gender pref" value={summary.gender} />
        <SummaryField label="Specific practitioner" value={summary.specific_practitioner} />
      </SummarySection>

      {/* Background */}
      <SummarySection title="🏥 Background">
        <SummaryField label="Diagnoses" value={summary.diagnosis} />
        <SummaryField label="Medication" value={summary.medication} />
        <SummaryField label="Previous therapy" value={summary.previous_therapy} />
      </SummarySection>

      {/* Location & Availability */}
      <SummarySection title="📍 Location & Availability">
        <SummaryField label="Location" value={summary.location_preference} />
        <SummaryField label="Days/times" value={summary.timing} />
        <SummaryField label="Frequency" value={summary.frequency} />
      </SummarySection>

      {/* Funding */}
      <SummarySection title="💰 Funding">
        <SummaryField label="Funding" value={summary.funding || 'Not discussed'} highlight={!!(summary.funding?.includes('⚠️'))} />
      </SummarySection>

      {/* Notes */}
      {summary.additional_notes && (
        <SummarySection title="📝 Notes">
          <SummaryField label="Notes" value={summary.additional_notes} />
        </SummarySection>
      )}
    </div>
  );
}

function EmailIntroBox({ intro, clientName }: { intro: string; clientName: string | null }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(intro);
    } catch {
      const el = document.createElement('textarea');
      el.value = intro;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div style={{
      marginTop: 32,
      background: '#f0f7ff',
      borderRadius: 12,
      padding: 20,
      borderLeft: `4px solid ${COLORS.coolBlue}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: COLORS.darkPurple, fontSize: 16 }}>
          ✉️ Email Intro {clientName ? `for ${clientName.split(' ')[0]}` : ''}
        </h3>
        <button
          onClick={handleCopy}
          style={{
            padding: '6px 14px',
            background: copied ? '#2e7d32' : COLORS.coolBlue,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Intro'}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.6, fontStyle: 'italic' }}>{intro}</p>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#888' }}>Paste this as the opening paragraph of your client email, then add the practitioner details below.</p>
    </div>
  );
}

function MatchCard({ match, rank }: { match: PractitionerMatch; rank: number }) {
  const photoFilename = match.photo_url ? match.photo_url.split('/').pop() : null;
  const localPhoto = photoFilename ? `/photos/${photoFilename}` : null;

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

  const hasAvailability = match.locations?.some(l => l.availability?.trim());

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${COLORS.lightMauve}`,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(44,36,76,0.08)',
    }}>
      {/* Card header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.darkPurple}, ${COLORS.mauve})`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {localPhoto && (
          <img
            src={localPhoto}
            alt={match.name}
            style={{
              width: 56, height: 56,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{rankEmoji}</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>{match.name}</span>
            <span style={{
              background: scoreBg(match.match_score),
              color: scoreColor(match.match_score),
              fontWeight: 700,
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 12,
            }}>
              {match.match_score} Match
            </span>
          </div>
          {match.title && (
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>{match.title}</div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 20px', background: 'white' }}>
        {/* Why they match */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, color: COLORS.darkPurple, fontSize: 13, marginBottom: 6 }}>Why they're a good match:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {match.reasons.map((r, i) => (
              <li key={i} style={{ color: '#444', fontSize: 13, marginBottom: 3 }}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Availability */}
        <div style={{
          background: hasAvailability ? '#f0f7ff' : '#fdf5f8',
          borderRadius: 8,
          padding: '10px 14px',
          borderLeft: `3px solid ${hasAvailability ? COLORS.coolBlue : COLORS.lightMauve}`,
        }}>
          <div style={{ fontWeight: 600, color: hasAvailability ? COLORS.coolBlue : COLORS.mauve, fontSize: 12, marginBottom: hasAvailability ? 4 : 0 }}>
            🗓 {hasAvailability ? 'Current Availability' : 'Availability'}
          </div>
          {hasAvailability ? (
            match.locations?.filter(l => l.availability?.trim()).map((loc, i) => (
              <div key={i} style={{ marginBottom: i < (match.locations?.length || 0) - 1 ? 6 : 0 }}>
                <div style={{ fontWeight: 600, color: '#555', fontSize: 12 }}>{loc.location}</div>
                {loc.availability.split('\n').filter(Boolean).map((slot, j) => (
                  <div key={j} style={{ color: '#444', fontSize: 12, paddingLeft: 8 }}>• {slot}</div>
                ))}
              </div>
            ))
          ) : (
            <div style={{ color: COLORS.mauve, fontSize: 13, fontStyle: 'italic' }}>
              {match.availability_note || 'Currently fully booked — waitlist only'}
            </div>
          )}
        </div>

        {/* Billing */}
        {match.billing_types && match.billing_types.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
            <span style={{ fontWeight: 600 }}>Billing: </span>
            {Array.isArray(match.billing_types) ? match.billing_types.join(' · ') : match.billing_types}
          </div>
        )}
      </div>
    </div>
  );
}

function buildSummaryText(s: IntakeSummary | null | undefined): string {
  if (!s) return '';
  const lines: string[] = [];
  lines.push('👤 CLIENT');
  if (s.client_name) lines.push(`  Name: ${s.client_name}`);
  if (s.age) lines.push(`  Age: ${s.age}`);
  if (s.sex) lines.push(`  Sex: ${s.sex}`);
  if (s.referral_source) lines.push(`  Referred by: ${s.referral_source}`);

  if (s.presenting_issues?.length) {
    lines.push('');
    lines.push('🎯 PRESENTING ISSUES');
    s.presenting_issues.forEach(i => lines.push(`  • ${i}`));
  }

  lines.push('');
  lines.push('⚠️ RISK');
  const risks = [s.risk_suicidality, s.risk_selfharm, s.risk_eating, s.risk_substances, s.risk_other].filter(Boolean);
  if (risks.length) {
    if (s.risk_suicidality) lines.push(`  Suicidality: ${s.risk_suicidality}`);
    if (s.risk_selfharm) lines.push(`  Self-harm: ${s.risk_selfharm}`);
    if (s.risk_eating) lines.push(`  Eating/body image: ${s.risk_eating}`);
    if (s.risk_substances) lines.push(`  Substances: ${s.risk_substances}`);
    if (s.risk_other) lines.push(`  Other: ${s.risk_other}`);
  } else {
    lines.push('  Nil identified');
  }

  lines.push('');
  lines.push('🧠 MODALITIES & APPROACH');
  lines.push(`  Modalities: ${s.modality_preference || 'Not specified'}`);
  if (s.therapy_style) lines.push(`  Style: ${s.therapy_style}`);
  if (s.gender) lines.push(`  Clinician pref: ${s.gender}`);
  if (s.specific_practitioner) lines.push(`  Specific prac: ${s.specific_practitioner}`);

  lines.push('');
  lines.push('🏥 BACKGROUND');
  if (s.diagnosis) lines.push(`  Diagnoses: ${s.diagnosis}`);
  if (s.medication) lines.push(`  Medication: ${s.medication}`);
  if (s.previous_therapy) lines.push(`  Previous therapy: ${s.previous_therapy}`);

  lines.push('');
  lines.push('📍 LOCATION & AVAILABILITY');
  if (s.location_preference) lines.push(`  Location: ${s.location_preference}`);
  if (s.timing) lines.push(`  Days/times: ${s.timing}`);
  if (s.frequency) lines.push(`  Frequency: ${s.frequency}`);

  lines.push('');
  lines.push('💰 FUNDING');
  lines.push(`  ${s.funding || 'Not discussed'}`);

  if (s.additional_notes) {
    lines.push('');
    lines.push('📝 NOTES');
    lines.push(`  ${s.additional_notes}`);
  }

  return lines.join('\n');
}

function buildFullCopyText(result: MatchResult): string {
  const lines: string[] = [];
  lines.push('=== INTAKE SUMMARY ===');
  // Use AI summary if available (richer), otherwise keyword-extracted summary
  if (result.ai_display_summary) {
    lines.push(result.ai_display_summary);
  } else {
    lines.push(buildSummaryText(result.summary));
  }
  lines.push('');
  lines.push('=== SUGGESTED PRACTITIONERS ===');
  result.matches.forEach((m, i) => {
    lines.push('');
    lines.push(`${i + 1}. ${m.name}${m.title ? ` — ${m.title}` : ''} [${m.match_score} Match]`);
    if (m.reasons?.length) {
      m.reasons.forEach(r => lines.push(`   • ${r}`));
    }
    const availLocations = m.locations?.filter(l => l.availability?.trim()) || [];
    if (availLocations.length) {
      lines.push(`   Availability:`);
      availLocations.forEach(loc => {
        lines.push(`   ${loc.location}:`);
        loc.availability.split('\n').filter(Boolean).forEach(slot => lines.push(`     - ${slot}`));
      });
    } else {
      lines.push(`   Availability: ${m.availability_note || 'Waitlist only'}`);
    }
  });
  if (result.email_intro) {
    lines.push('');
    lines.push('=== EMAIL INTRO ===');
    lines.push(result.email_intro);
  }
  return lines.join('\n');
}
