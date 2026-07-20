import React, { useState, useMemo } from "react";
import { Send, CheckSquare } from "lucide-react";
import { Practitioner } from "./types";
import SendClientModal from "./components/SendClientModal";
import MultiSelectDropdown from "./components/MultiSelectDropdown";
import { hasAfterHoursAvailability } from "./utils/afterHours";

interface Props {
  practitioners: Practitioner[];
}

interface Filters {
  keyword: string;
  locations: string[];
  locationMatchAll: boolean;
  gender: string;
  clientType: string;
  therapistType: string;
  afterHours: boolean;
  hasAvailability: boolean;

  presentations: string[];
  presentationsMatchAll: boolean;
  modalities: string[];
  modalitiesMatchAll: boolean;
  styles: string[];
  stylesMatchAll: boolean;
  billingTypes: string[];
  clientAge: string;
  practitionerNames: string[];
  availabilityTypes: string[];
  days: string[];
  daysMatchAll: boolean;

  // Gate filters
  gateClientType: string;
  gateAgeRep: number | null;
  gateExcludeFemaleOnly: boolean;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PRESENTATION_OPTIONS = [
  "Academic Pressure & Performance Stress",
  "Acquired Brain Injury (ABI) — Adjustment & Psychological Support",
  "Acute Stress Reaction",
  "Addiction/Dependence (Alcohol) — Current / Active",
  "Addiction/Dependence (Alcohol) — Not Current / In Recovery",
  "Addiction/Dependence (Cannabis) — Current / Active",
  "Addiction/Dependence (Cannabis) — Not Current / In Recovery",
  "Addiction/Dependence (Compulsive Shopping) — Current / Active",
  "Addiction/Dependence (Compulsive Shopping) — Not Current / In Recovery",
  "Addiction/Dependence (Gambling) — Current / Active",
  "Addiction/Dependence (Gambling) — Not Current / In Recovery",
  "Addiction/Dependence (Hypersexuality / Sex Addiction) — Current / Active",
  "Addiction/Dependence (Hypersexuality / Sex Addiction) — Not Current / In Recovery",
  "Addiction/Dependence (Internet & Technology) — Current / Active",
  "Addiction/Dependence (Internet & Technology) — Not Current / In Recovery",
  "Addiction/Dependence (Other Substances) — Current / Active",
  "Addiction/Dependence (Other Substances) — Not Current / In Recovery",
  "Addiction/Dependence (Pornography / Compulsive Sexual Behaviour) — Current / Active",
  "Addiction/Dependence (Pornography / Compulsive Sexual Behaviour) — Not Current / In Recovery",
  "Adjustment Disorder",
  "Adoption, Foster Care & Out-of-Home Care",
  "Anger & Aggression",
  "Anxiety - Anticipatory",
  "Anxiety - Death",
  "Anxiety - Exam & Academic",
  "Anxiety - Financial Stress",
  "Anxiety - Generalised (GAD)",
  "Anxiety - Health (Illness Anxiety / Hypochondria)",
  "Anxiety - Perinatal / Postnatal",
  "Anxiety - Separation",
  "Anxiety - Social Anxiety Disorder",
  "Anxiety - Sports Performance",
  "Attachment Difficulties",
  "Attention-Deficit/Hyperactivity Disorder (ADHD) — Diagnosed & Managed",
  "Attention-Deficit/Hyperactivity Disorder (ADHD) — Suspected or Actively Impacting",
  "Autism Spectrum Disorder (ASD) — Diagnosed & Managed",
  "Autism Spectrum Disorder (ASD) — Suspected or Actively Impacting",
  "Behavioural Difficulties (Children & Adolescents)",
  "Bipolar Disorder — Active / Recent Episode",
  "Bipolar Disorder — Diagnosed & Stable",
  "Body Dysmorphic Disorder (BDD)",
  "Body Image Concerns",
  "Bullying & Peer Difficulties",
  "Burnout — Carer / Family",
  "Burnout — Work-Related",
  "Chronic Fatigue & Fatigue Syndromes",
  "Chronic Illness — Adjustment & Psychological Support",
  "Chronic Pain",
  "Clinician & Therapist Wellbeing Support",
  "Complex Post-Traumatic Stress Disorder (C-PTSD)",
  "Conduct Disorder",
  "Coping Skills",
  "Cultural Identity & Acculturation",
  "Cultural Adjustment",
  "Culturally & Linguistically Diverse (CALD) — Psychological Support",
  "Depersonalisation / Derealisation",
  "Depression — Major Depressive Disorder",
  "Depression — Persistent Depressive Disorder (Dysthymia)",
  "Diabetes & Chronic Condition Self-Management",
  "Disordered Eating - Anorexia Nervosa — Current / Recent Diagnosis",
  "Disordered Eating - Anorexia Nervosa — Not Current / In Recovery",
  "Disordered Eating - Avoidant/Restrictive Food Intake Disorder (ARFID)",
  "Disordered Eating - Binge Eating Disorder — Current / Recent",
  "Disordered Eating - Binge Eating Disorder — Not Current / In Recovery",
  "Disordered Eating - Bulimia Nervosa — Current / Recent Diagnosis",
  "Disordered Eating - Bulimia Nervosa — Not Current / In Recovery",
  "Disordered Eating - Emotional Eating",
  "Disordered Eating - Not Otherwise Specified (NOS)",
  "Disordered Eating - Sub-clinical",
  "Dissociation / Dissociative Disorders",
  "Divorce / Post Divorce Adjustment/ Support",
  "Domestic/ Family Violence",
  "Emotional Dysregulation",
  "Emotional Regulation & Behavioural Difficulties",
  "Erectile Dysfunction (ED)",
  "Executive Functioning Difficulties",
  "Existential Concerns",
  "Family Conflict",
  "Fear of Failure",
  "First Responder & Emergency Services Support",
  "Gaming Disorder",
  "Gender Dysphoria (formerly Gender Identity Disorder)",
  "Grief & Loss - Complicated / Prolonged",
  "Grief & Loss - Fertility & Pregnancy Loss",
  "Grief & Loss - General Bereavement",
  "Grief & Loss - Termination of Pregnancy",
  "Hoarding Disorder",
  "Identity Exploration — Gender / Sexual Orientation / Cultural / Spiritual",
  "Identity Issues",
  "Imposter Syndrome",
  "Immigration difficulties",
  "Insomnia & Sleep Difficulties",
  "Intellectual Disability",
  "Interpersonal Difficulties",
  "Intimacy & Trust Difficulties",
  "Kleptomania (Compulsive Stealing)",
  "LGBTQIA+ Affirmative Support",
  "LGBTQIA+ Identity & Queer Experiences",
  "Learning Difficulties",
  "Life Transitions",
  "Loneliness & Isolation",
  "Low Confidence & Self-Worth",
  "Low Mood",
  "Low Self-Esteem",
  "Migrant / Cultural Adjustment",
  "Narcissistic Abuse — Trauma & Recovery",
  "Neurodivergence — General",
  "Non-Monogamy & Polyamory",
  "Non-Suicidal Self-Injury (NSSI) — Current",
  "Non-Suicidal Self-Injury (NSSI) — Not Current / In Recovery",
  "Obsessive-Compulsive Disorder (OCD) — Contamination",
  "Obsessive-Compulsive Disorder (OCD) — General",
  "Obsessive-Compulsive Disorder (OCD) — Harm",
  "Obsessive-Compulsive Disorder (OCD) — Intrusive Thoughts",
  "Obsessive-Compulsive Disorder (OCD) — Pure O",
  "Obsessive-Compulsive Disorder (OCD) — Relationship OCD (ROCD)",
  "Obsessive-Compulsive Disorder (OCD) — Religious / Scrupulosity",
  "Panic Disorder",
  "Parental Separation — Child & Family Adjustment",
  "Parenting Difficulties",
  "Pathological Demand Avoidance (PDA)",
  "Perfectionism",
  "Perinatal / Postnatal Depression",
  "Personality Disorder — Borderline Personality Disorder (BPD) — Diagnosed & In Treatment",
  "Personality Disorder — Borderline Personality Disorder (BPD) — Suspected or Actively Impacting",
  "Personality Disorder — Emotionally Unstable Personality Disorder (EUPD)",
  "Personality Disorder — Narcissistic Personality Disorder (NPD)",
  "Personality Disorder — Other",
  "Personality Patterns — Obsessive / Perfectionistic",
  "Phobias — Agoraphobia",
  "Phobias — Claustrophobia",
  "Phobias — Emetophobia (Fear of Vomiting)",
  "Phobias — Needle / Medical",
  "Phobias — Social",
  "Phobias — Specific (e.g. Heights, Animals, Flying)",
  "Post-Traumatic Stress Disorder (PTSD)",
  "Postural Orthostatic Tachycardia Syndrome (POTS) — Psychological Support",
  "Pyromania (Compulsive Fire-Setting)",
  "Refugee, Migrant & Asylum Seeker Support",
  "Rejection Sensitive Dysphoria (RSD)",
  "Relationship Breakdown & Separation",
  "Relationship Difficulties",
  "Rumination",
  "Schizophrenia & Psychosis",
  "School Refusal",
  "Seasonal Affective Disorder (SAD)",
  "Selective Mutism",
  "Self-Harm & Risky Behaviours",
  "Sexual Abuse/ Assault",
  "Sexual Difficulties & Dysfunction - Male",
  "Sexual Difficulties & Dysfunction - Female",
  "Sex and Intimacy",
  "Shame & Guilt",
  "Somatic Symptom Disorder",
  "Spiritual / Religious Crisis",
  "Spirituality — Non-Religious Exploration (incl. Buddhism & Mystical Experiences)",
  "Stress Management",
  "Suicidal Ideation — Current or Actively Impacting",
  "Suicidal Ideation — Not Current",
  "Tics & Tourette Syndrome",
  "Trauma - Childhood",
  "Trauma - Compassion Fatigue / Vicarious Trauma",
  "Trauma - Developmental",
  "Trauma - Intergenerational",
  "Trauma - Sexual Trauma",
  "Trauma — Complex",
  "Trauma — Single Incident",
  "Women's Health — Birth Trauma",
  "Women's Health — Endometriosis & Chronic Pelvic Pain",
  "Women's Health — Infertility & Assisted Reproduction (IVF)",
  "Women's Health — Menopause & Perimenopause",
  "Women's Health — Perinatal Mental Health (General)",
  "Women's Health — Polycystic Ovary Syndrome (PCOS)",
  "Women's Health — Postpartum Anxiety",
  "Women's Health — Postpartum Obsessive-Compulsive Disorder (OCD)",
  "Women's Health — Premenstrual Dysphoric Disorder (PMDD)",
  "Women's Health — Premenstrual Syndrome / Hormonal Mood Changes (PMS)",
  "Work-Related Stress",
];

const STYLE_OPTIONS = [
  "A parent", "Active Listener", "Animal Lover", "Artistic",
  "Assigns Homework/ Worksheets", "Calm", "Compassionate", "Conscientiousness",
  "Creative", "Direct", "Empathetic", "Existential", "Extravert",
  "Female", "Gentle", "Good at tough Love", "Guides to set Goals",
  "Humorous", "Introvert", "Like a coach", "Male", "Non Judgemental",
  "Openness", "Outgoing", "Sensitive and Gentle", "Solution Oriented",
  "Spiritual", "Talkative", "Teach new Skills", "Warm",
];

const BILLING_OPTIONS = [
  "Medicare Rebate",
  "NDIS",
  "WorkSafe",
  "EAP",
  "Self Funded",
  "Third Party",
];

const MODALITY_OPTIONS = [
  "Acceptance and Commitment Therapy (ACT)", "Attachment Based Therapy",
  "Behavioural Activation (BA)", "Circle of Security (COS)",
  "Cognitive Behavioural Therapy (CBT)", "Collaborative Problem Solving (CPS)",
  "Compassion-Focused Therapy (CFT)", "Compassionate Inquiry",
  "Couples Counselling", "Dialectical Behaviour Therapy (DBT)",
  "Eclectic / Integrative Therapy", "Emotionally Focused Therapy (EFT)",
  "Eye Movement Desensitisation and Reprocessing (EMDR)", "Existential Therapy",
  "Exposure and Response Prevention (ERP)", "Family Systems Therapy",
  "Gestalt Therapy", "Gottman Method Couples Therapy", "Humanistic / Person-Centred",
  "Internal Family Systems (IFS) / Parts Work - Informed",
  "Internal Family Systems (IFS) / Parts Work - Certified Level 1",
  "Intensive Short Term Dynamic Psychotherapy (ISTDP)",
  "Interpersonal Therapy (IPT)", "LGBTQIA+ Informed Therapies",
  "Mindfulness", "Mindfulness-Based Cognitive Therapy (MBCT)",
  "Motivational Interviewing (MI)", "Narrative Therapy",
  "Parts Work", "Play Therapy", "Polyvagal-Informed Therapy",
  "Positive Psychology Coaching", "Psychoanalytic Psychotherapy",
  "Psychodynamic Therapy", "Psychoeducation and Skills Training",
  "Schema Therapy", "Sensorimotor Psychotherapy",
  "Sex Therapy", "Solution-Focused Brief Therapy (SFBT)",
  "Somatic Experiencing", "Somatic Psychotherapy",
  "Trauma-Informed Care",
];

function scoreMatch(p: Practitioner, filters: Filters): number {
  const kw = filters.keyword.trim().toLowerCase();
  let score = 0;

  if (kw) {
    const safeStr = (v: any): string => (v == null ? "" : typeof v === "string" ? v : Array.isArray(v) ? v.join(" ") : String(v));
    const searchText = [p.name, p.presentations, p.modalities, p.title, p.therapist_type, p.languages, p.religions_groups, (p as any).style].map(safeStr).join(" ").toLowerCase();
    const words = kw.split(/\s+/);
    const matches = words.filter(w => searchText.includes(w)).length;
    if (matches === 0) return -1;
    const presMatches = words.filter(w => safeStr(p.presentations).toLowerCase().includes(w)).length;
    score += matches + presMatches * 2;
  }

  const pLocs = p.locations || [];

  if (filters.locations.length > 0) {
    const locMatchFn = (loc: string) => pLocs.some(l => (l.location || "").toLowerCase().includes(loc.toLowerCase()));
    const hasLoc = filters.locationMatchAll
      ? filters.locations.every(locMatchFn)
      : filters.locations.some(locMatchFn);
    if (!hasLoc) return -1;
  }

  if (filters.gender && (!p.gender || p.gender.toLowerCase() !== filters.gender.toLowerCase())) {
    return -1;
  }

  if (filters.clientType && p.client_types && !p.client_types.toLowerCase().includes(filters.clientType.toLowerCase())) {
    return -1;
  }

  if (false) { // couples filter removed
    return -1;
  }

  if (filters.therapistType) {
    const typeToCheck = (p.therapist_type || p.title || "").toLowerCase();
    if (!typeToCheck.includes(filters.therapistType.toLowerCase())) return -1;
  }

  if (filters.afterHours && !hasAfterHoursAvailability(pLocs.map(l => ({ availability: l.availability })))) {
    return -1;
  }

  if (filters.hasAvailability) {
    // When a location filter is active, only count availability at matching locations
    const relevantLocs = filters.locations.length > 0
      ? pLocs.filter(l => filters.locations.some(loc => (l.location || "").toLowerCase().includes(loc.toLowerCase())))
      : pLocs;
    const hasAvail = relevantLocs.some(l => {
      const avail = l.availability;
      if (!avail) return false;
      if (Array.isArray(avail)) return avail.length > 0;
      return (avail as string).trim().length > 0;
    });
    if (!hasAvail) return -1;
  }

  if (filters.presentations.length > 0) {
    const presVal: any = p.presentations;
    const presText = (presVal == null ? "" : typeof presVal === "string" ? presVal : Array.isArray(presVal) ? presVal.join(" ") : String(presVal)).toLowerCase();
    // OR or AND logic based on toggle
    const presMatch = filters.presentationsMatchAll
      ? filters.presentations.every(pres => presText.includes(pres.toLowerCase()))
      : filters.presentations.some(pres => presText.includes(pres.toLowerCase()));
    if (!presMatch) return -1;
  }

  if (filters.styles.length > 0) {
    const styleVal: any = (p as any).style;
    const styleText = (styleVal == null ? "" : typeof styleVal === "string" ? styleVal : Array.isArray(styleVal) ? styleVal.join(" ") : String(styleVal)).toLowerCase();
    const styleMatch = filters.stylesMatchAll
      ? filters.styles.every(s => styleText.includes(s.toLowerCase()))
      : filters.styles.some(s => styleText.includes(s.toLowerCase()));
    if (!styleMatch) return -1;
  }

  if (filters.billingTypes.length > 0) {
    const billingText = ((p.billing_types || "") as string).toLowerCase();
    // Map simplified labels to keywords in the billing string
    const billingKeyMap: Record<string, string> = {
      "medicare rebate": "medicare",
      "ndis": "ndis",
      "worksafe": "worksafe",
      "eap": "employer funded",
      "self funded": "self funded",
      "third party": "third party",
    };
    const allMatch = filters.billingTypes.every(bt => {
      const key = billingKeyMap[bt.toLowerCase()] || bt.toLowerCase();
      return billingText.includes(key);
    });
    if (!allMatch) return -1;
  }

  if (filters.modalities.length > 0) {
    const modVal: any = p.modalities;
    const modArray: string[] = Array.isArray(modVal) ? modVal : typeof modVal === "string" ? modVal.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean) : [];
    const modText = modArray.join(" ").toLowerCase();
    // OR or AND logic based on toggle
    const modMatchFn = (mod: string) => {
      // Exact match first (case-insensitive)
      if (modArray.some((m: string) => m.toLowerCase() === mod.toLowerCase())) return true;
      // Fuzzy fallback for legacy/short labels
      const key = mod.toLowerCase().replace(/^emdr.*/, "eye movement").replace(/^humanistic.*/, "humanistic").replace(/^trauma-informed.*/, "trauma");
      // Only use substring if key is meaningfully long (>15 chars) to avoid false positives
      return key.length > 15 && modText.includes(key);
    };
    const modMatch = filters.modalitiesMatchAll
      ? filters.modalities.every(modMatchFn)
      : filters.modalities.some(modMatchFn);
    if (!modMatch) return -1;
  }

  if (filters.clientAge.trim()) {
    const age = parseInt(filters.clientAge.trim(), 10);
    if (!isNaN(age) && p.age_range) {
      const nums = p.age_range.match(/\d+/g);
      if (nums && nums.length > 0) {
        const minAge = Math.min(...nums.map(Number));
        if (age < minAge) return -1;
      }
    }
  }

  // Gate: client type (Individual / Couples)
  if (filters.gateClientType && p.client_types) {
    if (!p.client_types.toLowerCase().includes(filters.gateClientType.toLowerCase())) return -1;
  }

  // Gate: age bracket
  if (filters.gateAgeRep !== null && p.age_range) {
    const nums = p.age_range.match(/\d+/g);
    if (nums && nums.length > 0) {
      const minAge = Math.min(...nums.map(Number));
      if (filters.gateAgeRep < minAge) return -1;
    }
  }

  // Gate: client gender — exclude female-only practitioners if client is not female
  if (filters.gateExcludeFemaleOnly && (p as any).client_gender_accepted === "Female Only") {
    return -1;
  }

  if (filters.practitionerNames.length > 0) {
    if (!filters.practitionerNames.includes(p.name)) return -1;
  }

  if (filters.availabilityTypes.length > 0) {
    const allAvail = pLocs.map(l => {
      const a = l.availability;
      if (!a) return "";
      return Array.isArray(a) ? a.join(" ") : a;
    }).join(" ").toLowerCase();
    const hasType = filters.availabilityTypes.some(t => allAvail.includes(t.toLowerCase()));
    if (!hasType) return -1;
  }

  if (filters.days.length > 0) {
    const allAvail = pLocs.map(l => {
      const a = l.availability;
      if (!a) return "";
      return Array.isArray(a) ? a.join(" ") : a;
    }).join(" ").toLowerCase();
    const dayMatch = filters.daysMatchAll
      ? filters.days.every(day => allAvail.includes(day.toLowerCase()))
      : filters.days.some(day => allAvail.includes(day.toLowerCase()));
    if (!dayMatch) return -1;
  }

  return score;
}

interface CardProps {
  p: Practitioner;
  locationFilter: string[];
  isSelected: boolean;
  onToggleSelect: (name: string) => void;
}

function filterOutMonthly(text: string | string[]): string {
  const lines = Array.isArray(text) ? text : text.split("\n");
  return lines
    .filter(line => !/\(Monthly:/i.test(line))
    .join("\n")
    .trim();
}

function parseAvailabilityColumns(text: string | string[]): { weekly: string[]; fortnightly: string[] } {
  const weekly: string[] = [];
  const fortnightly: string[] = [];
  if (!text || (Array.isArray(text) && text.length === 0)) return { weekly, fortnightly };
  const lines = (Array.isArray(text) ? text : text.split("\n")).map(l => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
  for (const line of lines) {
    if (/\(Monthly:/i.test(line)) continue;
    if (/\(Weekly:/i.test(line)) weekly.push(line);
    else if (/\(Fortnightly:/i.test(line)) fortnightly.push(line);
  }
  return { weekly, fortnightly };
}

const PractitionerCard: React.FC<CardProps> = ({ p, locationFilter, isSelected, onToggleSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const safeLocs = p.locations || [];
  const displayLocs = (locationFilter.length > 0
    ? safeLocs.filter(l => locationFilter.some(f => (l.location || "").toLowerCase().includes(f.toLowerCase())))
    : safeLocs
  ).map(l => ({ ...l, availability: l.availability ? filterOutMonthly(l.availability) : "" }));

  const hasAvail = displayLocs.some(l => l.availability && l.availability.trim());

  const copyAvailability = () => {
    const lines: string[] = [p.name + " -- " + p.title];
    for (const loc of displayLocs) {
      if (loc.availability && loc.availability.trim()) {
        lines.push("\n" + loc.location + ":");
        lines.push(loc.availability.trim());
      }
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card bg-white shadow-sm border mb-4 transition-all" style={{ borderColor: isSelected ? "#8D5273" : "#CDA8BA", boxShadow: isSelected ? "0 0 0 1px #8D5273" : undefined }}>
      <div className="card-body p-4">
        <div className="flex flex-wrap gap-2 items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              className="checkbox checkbox-primary mt-1 flex-shrink-0"
              checked={isSelected}
              onChange={() => onToggleSelect(p.name)}
              title="Select for sending to client"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold" style={{ color: "#2C244C" }}>
                  {p.link_to_bio ? (
                    <a href={p.link_to_bio} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.name}</a>
                  ) : p.name}
                </h3>
                {p.pronouns && <span className="text-xs text-base-content/50">({p.pronouns})</span>}
                {p.pap_clinician === "Yes" && <span className="badge badge-sm text-white" style={{ backgroundColor: "#8D5273" }}>PAP</span>}
                {hasAfterHoursAvailability((p.locations || []).map(l => ({ availability: l.availability }))) && <span className="badge badge-sm text-white" style={{ backgroundColor: "#52A3BA" }}>After Hours</span>}
                {p.accepts_couples && <span className="badge badge-sm text-white" style={{ backgroundColor: "#366188" }}>Couples</span>}
              </div>
              <p className="text-sm text-base-content/70 font-medium">{p.title}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {p.link_to_bio && (
              <a href={p.link_to_bio} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">Bio</a>
            )}
            <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-xs">
              {expanded ? "Less" : "More"}
            </button>
          </div>
        </div>

        {p.alert && (
          <div style={{ backgroundColor: "#00B8C8", color: "white", borderRadius: "10px", padding: "8px 14px", fontSize: "13px", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,184,200,0.35)", display: "inline-block" }}>
            🚨 {p.alert}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm mt-2">
          <div>
            <span className="font-semibold text-base-content/60">Fees:</span>{" "}
            <span className="whitespace-pre-line">{p.fees}</span>
          </div>
          <div>
            <span className="font-semibold text-base-content/60">Medicare:</span>{" "}
            <span className="whitespace-pre-line">{p.medicare_rebate}</span>
          </div>
          <div><span className="font-semibold text-base-content/60">Gender:</span> {p.gender || "--"}</div>
          <div><span className="font-semibold text-base-content/60">Ages:</span> {p.age_range || "--"}</div>
          <div><span className="font-semibold text-base-content/60">Clients:</span> {p.client_types || "--"}</div>
        </div>

        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {(p.locations || []).map((loc, i) => (
            <span key={i} className="badge badge-outline badge-sm">{"📍"} {loc.location}</span>
          ))}
        </div>

        <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: "#F0EEF7" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Availability</span>
            {hasAvail && (
              <button onClick={copyAvailability} className={"btn btn-xs " + (copied ? "btn-success" : "btn-primary")}>
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {displayLocs.length === 0 ? (
            <div className="text-sm text-base-content/40 italic">No availability listed</div>
          ) : (
            displayLocs.map((loc, i) => {
              const { weekly, fortnightly } = parseAvailabilityColumns(loc.availability || "");
              const hasLocAvail = weekly.length > 0 || fortnightly.length > 0;
              return (
                <div key={i} className={displayLocs.length > 1 ? "mb-3" : ""}>
                  {displayLocs.length > 1 && (
                    <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">📍 {loc.location}</div>
                  )}
                  {!hasLocAvail ? (
                    <div className="text-sm text-base-content/40 italic">No availability listed</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Weekly column */}
                      <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(54,97,136,0.08)" }}>
                        <div className="text-xs font-bold mb-1" style={{ color: "#366188" }}>● Weekly</div>
                        {weekly.length > 0 ? (
                          <ul className="space-y-1">
                            {weekly.map((line, j) => {
                              const label = line.replace(/\s*\(Weekly:.*\)/i, "").trim();
                              const startMatch = line.match(/Starting ([^)]+)/i);
                              return (
                                <li key={j} className="text-xs text-base-content leading-snug">
                                  <span className="font-medium">{label}</span>
                                  {startMatch && <span className="text-base-content/50 block">from {startMatch[1]}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="text-xs text-base-content/30 italic">—</div>
                        )}
                      </div>
                      {/* Fortnightly column */}
                      <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(82,163,186,0.08)" }}>
                        <div className="text-xs font-bold mb-1" style={{ color: "#52A3BA" }}>● Fortnightly</div>
                        {fortnightly.length > 0 ? (
                          <ul className="space-y-1">
                            {fortnightly.map((line, j) => {
                              const label = line.replace(/\s*\(Fortnightly:.*\)/i, "").trim();
                              const startMatch = line.match(/Starting ([^)]+)/i);
                              return (
                                <li key={j} className="text-xs text-base-content leading-snug">
                                  <span className="font-medium">{label}</span>
                                  {startMatch && <span className="text-base-content/50 block">from {startMatch[1]}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="text-xs text-base-content/30 italic">—</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-base-300 pt-3">
            {(p as any).style && (
              <div>
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Therapist Style</div>
                <div className="flex flex-wrap gap-1">
                  {((p as any).style as string).split(",").map((s: string, i: number) => (
                    <span key={i} className="badge badge-sm badge-outline" style={{ borderColor: "#8D5273", color: "#8D5273" }}>{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {p.presentations && (
              <div>
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Presentations</div>
                <div className="text-sm text-base-content/80">{p.presentations}</div>
              </div>
            )}
            {p.modalities && (
              <div>
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Modalities</div>
                <div className="text-sm text-base-content/80">{p.modalities}</div>
              </div>
            )}
            {p.billing_types && (
              <div>
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Billing</div>
                <div className="text-sm">{p.billing_types}</div>
              </div>
            )}
            {p.religions_groups && (
              <div>
                <div className="text-xs font-bold text-base-content/50 uppercase tracking-wide mb-1">Cultural / Religious</div>
                <div className="text-sm">{p.religions_groups}</div>
              </div>
            )}
            {p.last_updated && (
              <div className="text-xs text-base-content/40">Last updated: {p.last_updated}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function FindPractitioner({ practitioners }: Props) {
  // Gate state — mandatory qualifying questions
  const [gateClientType, setGateClientType] = useState("");
  const [gateAgeBracket, setGateAgeBracket] = useState("");
  const [gateClientGender, setGateClientGender] = useState("");


  const gateComplete = !!gateClientType && !!gateAgeBracket && !!gateClientGender;

  const AGE_BRACKET_MAP: Record<string, number> = {
    "Under 12": 10,
    "12–15": 12,
    "16–17": 16,
    "18–24": 18,
    "25+": 25,
  };
  const gateAgeRep = gateAgeBracket ? (AGE_BRACKET_MAP[gateAgeBracket] ?? null) : null;
  const gateExcludeFemaleOnly = gateClientGender === "Male" || gateClientGender === "Non-binary / Other";

  const [keyword, setKeyword] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationMatchAll, setLocationMatchAll] = useState(false);
  const [gender, setGender] = useState("");
  const [clientType, setClientType] = useState("");
  const [therapistType, setTherapistType] = useState("");
  const [afterHours, setAfterHours] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(true);

  const [selectedPresentations, setSelectedPresentations] = useState<string[]>([]);
  const [presentationsMatchAll, setPresentationsMatchAll] = useState(false);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [modalitiesMatchAll, setModalitiesMatchAll] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [stylesMatchAll, setStylesMatchAll] = useState(false);
  const [clientAge, setClientAge] = useState("");
  const [selectedPractitionerNames, setSelectedPractitionerNames] = useState<string[]>([]);
  const [selectedAvailabilityTypes, setSelectedAvailabilityTypes] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daysMatchAll, setDaysMatchAll] = useState(false);
  const [selectedBillingTypes, setSelectedBillingTypes] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const allPractitionerNames = useMemo(() => practitioners.map(p => p.name).sort(), [practitioners]);

  const results = useMemo(() => {
    const filters: Filters = { keyword, locations: selectedLocations, locationMatchAll, gender, clientType, therapistType, afterHours, hasAvailability, presentations: selectedPresentations, presentationsMatchAll, modalities: selectedModalities, modalitiesMatchAll, styles: selectedStyles, stylesMatchAll, billingTypes: selectedBillingTypes, clientAge, practitionerNames: selectedPractitionerNames, availabilityTypes: selectedAvailabilityTypes, days: selectedDays, daysMatchAll, gateClientType, gateAgeRep, gateExcludeFemaleOnly };
    return practitioners
      .filter(p => !(p as any).referral_only)
      .map(p => ({ p, score: scoreMatch(p, filters) }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  }, [practitioners, keyword, selectedLocations, locationMatchAll, gender, clientType, therapistType, afterHours, hasAvailability, selectedPresentations, presentationsMatchAll, selectedModalities, modalitiesMatchAll, selectedStyles, stylesMatchAll, selectedBillingTypes, clientAge, selectedPractitionerNames, selectedAvailabilityTypes, selectedDays, daysMatchAll, gateClientType, gateAgeRep, gateExcludeFemaleOnly]);

  const clearFilters = () => {
    setKeyword(""); setSelectedLocations([]); setLocationMatchAll(false); setGender(""); setClientType("");
    setTherapistType(""); setAfterHours(false); setHasAvailability(false);
    setSelectedPresentations([]); setPresentationsMatchAll(false);
    setSelectedModalities([]); setModalitiesMatchAll(false);
    setSelectedStyles([]); setStylesMatchAll(false); setSelectedBillingTypes([]);
    setClientAge(""); setSelectedPractitionerNames([]); setSelectedAvailabilityTypes([]); setSelectedDays([]); setDaysMatchAll(false);
  };

  const hasFilters = !!(keyword || selectedLocations.length || gender || clientType || therapistType || afterHours || hasAvailability || selectedPresentations.length || selectedModalities.length || selectedStyles.length || selectedBillingTypes.length || clientAge || selectedPractitionerNames.length || selectedAvailabilityTypes.length || selectedDays.length);

  const toggleSelect = (name: string) => {
    setSelectedNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Preserve selection order — map names in the order they were selected
  const selectedPractitioners = selectedNames
    .map(name => practitioners.find(p => p.name === name))
    .filter((p): p is typeof practitioners[0] => !!p);

  const handleSent = () => {
    setShowSendModal(false);
    setSelectedNames([]);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="pb-24">
      {sentSuccess && (
        <div className="alert alert-success mb-4">
          <span>✓ Email sent successfully to the client!</span>
        </div>
      )}

      {/* ── Mandatory Gate ── */}
      <div className="rounded-xl mb-5 px-6 py-5" style={{ backgroundColor: "#f0edf5" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded text-white" style={{ backgroundColor: "#2C244C" }}>Required</span>
          <span className="font-semibold text-base" style={{ color: "#2C244C" }}>Tell us about the client first</span>
        </div>

        {/* Row 1: Session type + Client's age side by side */}
        <div className="flex flex-wrap gap-10 mb-5">
          {/* Q1: Session type */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "#2C244C" }}>
              Session type {gateClientType && <span className="text-green-600 ml-1">✓</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Individual", "Couples"].map(opt => (
                <button key={opt} onClick={() => setGateClientType(opt)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={gateClientType === opt
                    ? { backgroundColor: "#2C244C", color: "white", borderColor: "#2C244C" }
                    : { backgroundColor: "white", color: "#2C244C", borderColor: "#CDA8BA" }}>
                  {opt === "Individual" ? "👤 Individual" : "👥 Couples"}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Client age */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "#2C244C" }}>
              Client's age {gateAgeBracket && <span className="text-green-600 ml-1">✓</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["Under 12", "12–15", "16–17", "18–24", "25+"].map(opt => (
                <button key={opt} onClick={() => setGateAgeBracket(opt)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={gateAgeBracket === opt
                    ? { backgroundColor: "#2C244C", color: "white", borderColor: "#2C244C" }
                    : { backgroundColor: "white", color: "#2C244C", borderColor: "#CDA8BA" }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Client gender */}
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: "#2C244C" }}>
            Client's gender {gateClientGender && <span className="text-green-600 ml-1">✓</span>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Male", "Female", "Non-binary / Other"].map(opt => (
              <button key={opt} onClick={() => setGateClientGender(opt)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                style={gateClientGender === opt
                  ? { backgroundColor: "#2C244C", color: "white", borderColor: "#2C244C" }
                  : { backgroundColor: "white", color: "#2C244C", borderColor: "#CDA8BA" }}>
                {opt}
              </button>
            ))}
          </div>
          {(gateClientGender === "Male" || gateClientGender === "Non-binary / Other") && (
            <div className="text-xs mt-2" style={{ color: "#8D5273" }}>
              ⚠️ Alex Barry, Chiara Killey and Clare Tuttleby accept female clients only.
            </div>
          )}
        </div>
      </div>

      {/* ── Search card — always visible ── */}
      {true && <>

      <div className="card bg-white shadow-sm border mb-6" style={{ borderColor: "#CDA8BA" }}>
        <div className="card-body p-4">
          <h2 className="font-bold text-lg mb-3">Search and Filter</h2>
          <div className="mb-3">
            <label className="label label-text font-semibold pb-1">Keywords</label>
            <input
              type="text"
              placeholder="e.g. trauma, EMDR, anxiety, LGBTQ, eating disorder..."
              className="input input-bordered w-full"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <div className="text-xs text-base-content/50 mt-1">Searches presentations, modalities, name and specialty</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">Location</span>
                {selectedLocations.length > 1 && (
                  <div className="flex rounded overflow-hidden border border-purple-200 text-xs">
                    <button onClick={() => setLocationMatchAll(false)} className={`px-2 py-0.5 ${!locationMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match any</button>
                    <button onClick={() => setLocationMatchAll(true)} className={`px-2 py-0.5 ${locationMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match all</button>
                  </div>
                )}
              </div>
              <MultiSelectDropdown
                label=""
                options={["Greville St, Prahran", "Burke Rd, Camberwell", "Victoria St, St Kilda", "Telehealth"]}
                selected={selectedLocations}
                onChange={setSelectedLocations}
                placeholder="Any location"
              />
            </div>
            <div>
              <label className="label label-text font-semibold pb-1">Gender</label>
              <select className="select select-bordered w-full select-sm" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Any gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div>
              <label className="label label-text font-semibold pb-1">Client Type</label>
              <select className="select select-bordered w-full select-sm" value={clientType} onChange={e => setClientType(e.target.value)}>
                <option value="">Any</option>
                <option value="Individual">Individual</option>
                <option value="Couples">Couples</option>
              </select>
            </div>
            <div>
              <label className="label label-text font-semibold pb-1">Therapist Type</label>
              <select className="select select-bordered w-full select-sm" value={therapistType} onChange={e => setTherapistType(e.target.value)}>
                <option value="">Any type</option>
                <option value="Clinical Psychologist">Clinical Psychologist</option>
                <option value="Psychologist">Psychologist</option>
                <option value="Social Worker">Social Worker</option>
                <option value="Psychotherapist">Psychotherapist</option>
                <option value="Counsellor">Counsellor</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">Presentations</span>
                {selectedPresentations.length > 1 && (
                  <div className="flex rounded overflow-hidden border border-purple-200 text-xs">
                    <button
                      onClick={() => setPresentationsMatchAll(false)}
                      className={`px-2 py-0.5 ${!presentationsMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}
                    >Match any</button>
                    <button
                      onClick={() => setPresentationsMatchAll(true)}
                      className={`px-2 py-0.5 ${presentationsMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}
                    >Match all</button>
                  </div>
                )}
              </div>
              <MultiSelectDropdown
                label=""
                options={PRESENTATION_OPTIONS}
                selected={selectedPresentations}
                onChange={setSelectedPresentations}
                placeholder="Any presentation"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">Modalities</span>
                {selectedModalities.length > 1 && (
                  <div className="flex rounded overflow-hidden border border-purple-200 text-xs">
                    <button
                      onClick={() => setModalitiesMatchAll(false)}
                      className={`px-2 py-0.5 ${!modalitiesMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}
                    >Match any</button>
                    <button
                      onClick={() => setModalitiesMatchAll(true)}
                      className={`px-2 py-0.5 ${modalitiesMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}
                    >Match all</button>
                  </div>
                )}
              </div>
              <MultiSelectDropdown
                label=""
                options={MODALITY_OPTIONS}
                selected={selectedModalities}
                onChange={setSelectedModalities}
                placeholder="Any modality"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">Therapist Style</span>
                {selectedStyles.length > 1 && (
                  <div className="flex rounded overflow-hidden border border-purple-200 text-xs">
                    <button onClick={() => setStylesMatchAll(false)} className={`px-2 py-0.5 ${!stylesMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match any</button>
                    <button onClick={() => setStylesMatchAll(true)} className={`px-2 py-0.5 ${stylesMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match all</button>
                  </div>
                )}
              </div>
              <MultiSelectDropdown
                label=""
                options={STYLE_OPTIONS}
                selected={selectedStyles}
                onChange={setSelectedStyles}
                placeholder="Any style"
              />
            </div>
            <MultiSelectDropdown
              label="Billing / Funding"
              options={BILLING_OPTIONS}
              selected={selectedBillingTypes}
              onChange={setSelectedBillingTypes}
              placeholder="Any billing type"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="label label-text font-semibold pb-1">Client Age</label>
              <input
                type="number"
                min="0"
                max="120"
                placeholder="e.g. 14"
                className="input input-bordered w-full input-sm"
                value={clientAge}
                onChange={e => setClientAge(e.target.value)}
              />
              <div className="text-xs text-base-content/50 mt-1">Filters to practitioners who accept this age</div>
            </div>
            <MultiSelectDropdown
              label="Practitioner Name"
              options={allPractitionerNames}
              selected={selectedPractitionerNames}
              onChange={setSelectedPractitionerNames}
              placeholder="Any practitioner"
            />
            <MultiSelectDropdown
              label="Availability Type"
              options={["Weekly", "Fortnightly"]}
              selected={selectedAvailabilityTypes}
              onChange={setSelectedAvailabilityTypes}
              placeholder="Any type"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wide">Day of Week</span>
                {selectedDays.length > 1 && (
                  <div className="flex rounded overflow-hidden border border-purple-200 text-xs">
                    <button onClick={() => setDaysMatchAll(false)} className={`px-2 py-0.5 ${!daysMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match any</button>
                    <button onClick={() => setDaysMatchAll(true)} className={`px-2 py-0.5 ${daysMatchAll ? "bg-purple-600 text-white" : "bg-white text-purple-600"}`}>Match all</button>
                  </div>
                )}
              </div>
              <MultiSelectDropdown
                label=""
                options={DAYS_OF_WEEK}
                selected={selectedDays}
                onChange={setSelectedDays}
                placeholder="Any day"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="cursor-pointer flex items-center gap-2">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={hasAvailability} onChange={e => setHasAvailability(e.target.checked)} />
              <span className="text-sm font-medium">Has current availability</span>
            </label>
            <label className="cursor-pointer flex items-center gap-2">
              <input type="checkbox" className="checkbox checkbox-sm checkbox-accent" checked={afterHours} onChange={e => setAfterHours(e.target.checked)} />
              <span className="text-sm font-medium">After hours</span>
            </label>

            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-ghost btn-xs ml-auto">Clear filters</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">
          {results.length} Practitioner{results.length !== 1 ? "s" : ""}
          {hasFilters ? " matched" : ""}
        </h2>
        <div className="flex items-center gap-2">
          {keyword && (
            <div className="text-sm text-base-content/60">Sorted by relevance</div>
          )}
          {selectedNames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">{selectedNames.length} selected</span>
              <button onClick={() => setSelectedNames([])} className="btn btn-ghost btn-xs">Clear</button>
            </div>
          )}
        </div>
      </div>

      {!gateComplete ? (
        <div className="card bg-white shadow-sm border" style={{ borderColor: "#CDA8BA" }}>
          <div className="card-body text-center py-12">
            <p className="text-base font-medium" style={{ color: "#2C244C" }}>Complete the required questions above to see matching practitioners</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="card bg-white shadow-sm border" style={{ borderColor: "#CDA8BA" }}>
          <div className="card-body text-center py-12">
            <p className="text-lg" style={{ color: "#36454F" }}>No practitioners match your search</p>
            <p className="text-sm" style={{ color: "#CDA8BA" }}>Try removing some filters</p>
            <button onClick={clearFilters} className="btn btn-sm mt-4 mx-auto text-white" style={{ backgroundColor: "#2C244C" }}>Clear Filters</button>
          </div>
        </div>
      ) : (
        <div>
          {results.map((item, idx) => (
            <div key={idx}>
              <PractitionerCard
                p={item.p}
                locationFilter={selectedLocations}
                isSelected={selectedNames.includes(item.p.name)}
                onToggleSelect={toggleSelect}
              />
            </div>
          ))}
        </div>
      )}

      {/* Floating Send Bar */}
      {selectedNames.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white shadow-lg" style={{ borderTop: "2px solid #CDA8BA" }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} style={{ color: "#8D5273" }} />
              <span className="font-semibold">{selectedNames.length} practitioner{selectedNames.length !== 1 ? "s" : ""} selected</span>
              <span className="text-base-content/50 text-sm hidden sm:inline">
                — {selectedPractitioners.map(p => p.name.split(" ")[0]).join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedNames([])}
                className="btn btn-ghost btn-sm gap-1"
                style={{ color: "#8D5273" }}
              >
                ✕ Clear All
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="btn gap-2 text-white" style={{ backgroundColor: "#2C244C" }}
              >
                <Send size={16} />
                Send to Client
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <SendClientModal
          selected={selectedPractitioners}
          locationFilter={selectedLocations.length === 1 ? selectedLocations[0] : ""}
          onClose={() => setShowSendModal(false)}
          onSent={handleSent}
        />
      )}

      </> /* end gate-complete wrapper */}

    </div>
  );
}
