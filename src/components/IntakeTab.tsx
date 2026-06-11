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
  client_name: string;
  age: string;
  gender: string;
  presenting_issues: string[];
  risk_indicators: string | null;
  location_preference: string | null;
  timing: string | null;
  modality_preference: string | null;
  funding: string | null;
  previous_therapy: string | null;
  referral_source: string | null;
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
    try {
      const res = await fetch('/.netlify/functions/match-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, intake_type: intakeType }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
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
            <SummaryDisplay summary={result.summary} />
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
        </div>
      )}
    </div>
  );
}

function SummaryDisplay({ summary }: { summary: IntakeSummary }) {
  const fields: [string, string | string[] | null | undefined][] = [
    ['Client', summary.client_name],
    ['Age', summary.age],
    ['Gender', summary.gender],
    ['Presenting Issues', summary.presenting_issues],
    ['Risk Indicators', summary.risk_indicators],
    ['Location Preference', summary.location_preference],
    ['Timing / Availability', summary.timing],
    ['Modality Preference', summary.modality_preference],
    ['Funding', summary.funding],
    ['Previous Therapy', summary.previous_therapy],
    ['Referral Source', summary.referral_source],
    ['Additional Notes', summary.additional_notes],
  ];

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {fields.map(([label, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null;
        return (
          <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <span style={{ color: COLORS.mauve, fontWeight: 600, minWidth: 160, flexShrink: 0 }}>{label}:</span>
            <span style={{ color: '#333' }}>
              {Array.isArray(value) ? value.join(', ') : value}
            </span>
          </div>
        );
      })}
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

function buildSummaryText(s: IntakeSummary): string {
  const lines: string[] = [];
  if (s.client_name) lines.push(`Client: ${s.client_name}`);
  if (s.age) lines.push(`Age: ${s.age}`);
  if (s.gender) lines.push(`Gender: ${s.gender}`);
  if (s.presenting_issues?.length) lines.push(`Presenting Issues: ${s.presenting_issues.join(', ')}`);
  if (s.risk_indicators) lines.push(`Risk Indicators: ${s.risk_indicators}`);
  if (s.location_preference) lines.push(`Location Preference: ${s.location_preference}`);
  if (s.timing) lines.push(`Timing: ${s.timing}`);
  if (s.modality_preference) lines.push(`Modality Preference: ${s.modality_preference}`);
  if (s.funding) lines.push(`Funding: ${s.funding}`);
  if (s.previous_therapy) lines.push(`Previous Therapy: ${s.previous_therapy}`);
  if (s.referral_source) lines.push(`Referral Source: ${s.referral_source}`);
  if (s.additional_notes) lines.push(`Notes: ${s.additional_notes}`);
  return lines.join('\n');
}

function buildFullCopyText(result: MatchResult): string {
  const lines: string[] = [];
  lines.push('=== INTAKE SUMMARY ===');
  lines.push(buildSummaryText(result.summary));
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
  return lines.join('\n');
}
