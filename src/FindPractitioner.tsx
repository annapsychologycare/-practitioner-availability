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
  location: string;
  gender: string;
  clientType: string;
  therapistType: string;
  afterHours: boolean;
  hasAvailability: boolean;

  presentations: string[];
  modalities: string[];
  clientAge: string;
  practitionerNames: string[];
  availabilityTypes: string[];
  days: string[];
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const PRESENTATION_OPTIONS = [
  "ADD and ADHD", "Anxiety", "Agoraphobia", "Alcohol Dependence", "Anorexia Nervosa",
  "Antisocial Personality Disorder", "Asperger Syndrome", "Attachment Disorder",
  "Autism Spectrum Disorders (ASD)", "Avoidant Personality Disorder",
  "Bereavement", "Binge-Eating Disorder", "Bipolar Disorder", "Body Dysmorphic Disorder",
  "Body issues", "Borderline Personality Disorder", "Bulimia Nervosa", "Bullying / workplace conflict",
  "Burnout", "Cannabis Dependence", "Career transition", "Childhood Abuse and Neglect",
  "Chronic Pain and illness", "Claustrophobia", "Clinical Depression (Major Depressive Disorder)",
  "Codependency or people-pleasing", "Communication and boundary issues",
  "Compassion fatigue / vicarious trauma", "Complex Trauma", "Confidence",
  "Couples and Marriage Difficulties", "Depression", "Depersonalization Disorder",
  "Domestic Violence", "Eating Disorders", "Existential concerns / loss of meaning",
  "Family Conflict", "Fear of Failure", "Gambling", "Gender Dysphoria",
  "Generalized Anxiety Disorder (GAD)", "Grief & Loss", "Health Anxiety",
  "Imposter Syndrome", "Insomnia Disorder", "Intergenerational Trauma",
  "LGBTQIA+", "Life Transitions", "Low self esteem", "Narcissistic Personality Disorder",
  "OCD", "Occupational stress or burnout", "Panic Disorder & Panic Attacks",
  "Perfectionism", "Perinatal Anxiety and Depression", "Personality Disorder",
  "Phobias", "Post Traumatic Stress Disorder (PTSD)", "Pregnancy and Postnatal Depression",
  "Psychosis", "Relationship breakdown", "Schizophrenia", "Self-harm",
  "Separation anxiety disorder", "Sex and intimacy", "Sexual Abuse / Assault",
  "Sexuality and Gender", "Social anxiety disorder / Social Phobia",
  "Stress", "Substance Misuse", "Suicidal Ideation", "Trauma", "Workplace stress",
];

const MODALITY_OPTIONS = [
  "Acceptance and Commitment Therapy (ACT)", "Attachment Based Therapy",
  "Behavioural Activation (BA)", "Circle of Security (COS)",
  "Cognitive Behavioural Therapy (CBT)", "Collaborative Problem Solving (CPS)",
  "Compassion-Focused Therapy (CFT)", "Compassionate Inquiry",
  "Couples Counselling", "Dialectical Behaviour Therapy (DBT)",
  "Eclectic / Integrative Therapy", "Emotionally Focused Therapy (EFT)",
  "EMDR (Eye Movement Desensitisation and Reprocessing)", "Existential Therapy",
  "Exposure and Response Prevention (ERP)", "Family Systems Therapy",
  "Gestalt Therapy", "Gottman Method Couples Therapy", "Humanistic / Person-Centred",
  "Internal Family Systems (IFS)", "Intensive Short Term Dynamic Psychotherapy (ISTDP)",
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
    const searchText = [p.name, p.presentations, p.modalities, p.title, p.therapist_type, p.languages, p.religions_groups].join(" ").toLowerCase();
    const words = kw.split(/\s+/);
    const matches = words.filter(w => searchText.includes(w)).length;
    if (matches === 0) return -1;
    const presMatches = words.filter(w => p.presentations.toLowerCase().includes(w)).length;
    score += matches + presMatches * 2;
  }

  if (filters.location) {
    const hasLoc = p.locations.some(l => l.location && l.location.toLowerCase().includes(filters.location.toLowerCase()));
    if (!hasLoc) return -1;
  }

  if (filters.gender && (!p.gender || p.gender.toLowerCase() !== filters.gender.toLowerCase())) {
    return -1;
  }

  if (filters.clientType && p.client_types && !p.client_types.toLowerCase().includes(filters.clientType.toLowerCase())) {
    return -1;
  }

  if (filters.therapistType && p.therapist_type && !p.therapist_type.toLowerCase().includes(filters.therapistType.toLowerCase())) {
    return -1;
  }

  if (filters.afterHours && !hasAfterHoursAvailability(p.locations.map(l => ({ availability: l.availability })))) {
    return -1;
  }

  if (filters.hasAvailability) {
    const hasAvail = p.locations.some(l => l.availability && l.availability.trim().length > 0);
    if (!hasAvail) return -1;
  }

  if (filters.presentations.length > 0) {
    const presText = p.presentations.toLowerCase();
    const allMatch = filters.presentations.every(pres => presText.includes(pres.toLowerCase()));
    if (!allMatch) return -1;
  }

  if (filters.modalities.length > 0) {
    const modText = p.modalities.toLowerCase();
    const allMatch = filters.modalities.every(mod => {
      const key = mod.toLowerCase().replace(/^emdr.*/, "eye movement").replace(/^humanistic.*/, "humanistic").replace(/^trauma-informed.*/, "trauma");
      return modText.includes(key) || modText.includes(mod.toLowerCase().substring(0, 10));
    });
    if (!allMatch) return -1;
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

  if (filters.practitionerNames.length > 0) {
    if (!filters.practitionerNames.includes(p.name)) return -1;
  }

  if (filters.availabilityTypes.length > 0) {
    const allAvail = p.locations.map(l => l.availability || "").join(" ").toLowerCase();
    const hasType = filters.availabilityTypes.some(t => allAvail.includes(t.toLowerCase()));
    if (!hasType) return -1;
  }

  if (filters.days.length > 0) {
    const allAvail = p.locations.map(l => l.availability || "").join(" ").toLowerCase();
    const hasDay = filters.days.some(day => allAvail.includes(day.toLowerCase()));
    if (!hasDay) return -1;
  }

  return score;
}

interface CardProps {
  p: Practitioner;
  locationFilter: string;
  isSelected: boolean;
  onToggleSelect: (name: string) => void;
}

function filterOutMonthly(text: string): string {
  return text
    .split("\n")
    .filter(line => !/\(Monthly:/i.test(line))
    .join("\n")
    .trim();
}

function parseAvailabilityColumns(text: string): { weekly: string[]; fortnightly: string[] } {
  const weekly: string[] = [];
  const fortnightly: string[] = [];
  if (!text) return { weekly, fortnightly };
  const lines = text.split("\n").map(l => l.replace(/^\*\s*/, "").trim()).filter(Boolean);
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

  const displayLocs = (locationFilter
    ? p.locations.filter(l => l.location && l.location.toLowerCase().includes(locationFilter.toLowerCase()))
    : p.locations
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
    <div className={`card bg-base-100 shadow-sm border mb-4 transition-all ${isSelected ? "border-primary ring-1 ring-primary" : "border-base-300"}`}>
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
                <h3 className="text-lg font-bold text-primary">
                  {p.link_to_bio ? (
                    <a href={p.link_to_bio} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.name}</a>
                  ) : p.name}
                </h3>
                {p.pronouns && <span className="text-xs text-base-content/50">({p.pronouns})</span>}
                {p.pap_clinician === "Yes" && <span className="badge badge-secondary badge-sm">PAP</span>}
                {hasAfterHoursAvailability(p.locations.map(l => ({ availability: l.availability }))) && <span className="badge badge-accent badge-sm">After Hours</span>}
                {p.accepts_couples && <span className="badge badge-info badge-sm">Couples</span>}
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
          <div className="alert alert-warning py-2 px-3 text-sm mt-2">
            <span>{"⚠"} {p.alert}</span>
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
          {p.locations.map((loc, i) => (
            <span key={i} className="badge badge-outline badge-sm">{"📍"} {loc.location}</span>
          ))}
        </div>

        <div className="mt-3 bg-base-200 rounded-lg p-3">
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
                      <div className="bg-success/10 rounded-lg p-2">
                        <div className="text-xs font-bold text-success mb-1">🟢 Weekly</div>
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
                      <div className="bg-info/10 rounded-lg p-2">
                        <div className="text-xs font-bold text-info mb-1">🔵 Fortnightly</div>
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
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [clientType, setClientType] = useState("");
  const [therapistType, setTherapistType] = useState("");
  const [afterHours, setAfterHours] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);

  const [selectedPresentations, setSelectedPresentations] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [clientAge, setClientAge] = useState("");
  const [selectedPractitionerNames, setSelectedPractitionerNames] = useState<string[]>([]);
  const [selectedAvailabilityTypes, setSelectedAvailabilityTypes] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const allPractitionerNames = useMemo(() => practitioners.map(p => p.name).sort(), [practitioners]);

  const filters: Filters = { keyword, location, gender, clientType, therapistType, afterHours, hasAvailability, presentations: selectedPresentations, modalities: selectedModalities, clientAge, practitionerNames: selectedPractitionerNames, availabilityTypes: selectedAvailabilityTypes, days: selectedDays };

  const results = useMemo(() => {
    return practitioners
      .map(p => ({ p, score: scoreMatch(p, filters) }))
      .filter(item => item.score >= 0)
      .sort((a, b) => b.score - a.score);
  }, [practitioners, keyword, location, gender, clientType, therapistType, afterHours, hasAvailability, selectedPresentations, selectedModalities, clientAge, selectedPractitionerNames, selectedAvailabilityTypes, selectedDays]);

  const clearFilters = () => {
    setKeyword(""); setLocation(""); setGender(""); setClientType("");
    setTherapistType(""); setAfterHours(false); setHasAvailability(false);
    setSelectedPresentations([]); setSelectedModalities([]);
    setClientAge(""); setSelectedPractitionerNames([]); setSelectedAvailabilityTypes([]); setSelectedDays([]);
  };

  const hasFilters = !!(keyword || location || gender || clientType || therapistType || afterHours || hasAvailability || selectedPresentations.length || selectedModalities.length || clientAge || selectedPractitionerNames.length || selectedAvailabilityTypes.length || selectedDays.length);

  const toggleSelect = (name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectedPractitioners = practitioners.filter(p => selectedNames.has(p.name));

  const handleSent = () => {
    setShowSendModal(false);
    setSelectedNames(new Set());
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

      <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
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
              <label className="label label-text font-semibold pb-1">Location</label>
              <select className="select select-bordered w-full select-sm" value={location} onChange={e => setLocation(e.target.value)}>
                <option value="">Any location</option>
                <option value="Prahran">Greville St, Prahran</option>
                <option value="Malvern">Wattletree Rd, Malvern</option>
                <option value="St Kilda">St Kilda</option>
                <option value="Telehealth">Online / Telehealth</option>
              </select>
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
            <MultiSelectDropdown
              label="Presentations"
              options={PRESENTATION_OPTIONS}
              selected={selectedPresentations}
              onChange={setSelectedPresentations}
              placeholder="Any presentation"
            />
            <MultiSelectDropdown
              label="Modalities"
              options={MODALITY_OPTIONS}
              selected={selectedModalities}
              onChange={setSelectedModalities}
              placeholder="Any modality"
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
            <MultiSelectDropdown
              label="Day of Week"
              options={DAYS_OF_WEEK}
              selected={selectedDays}
              onChange={setSelectedDays}
              placeholder="Any day"
            />
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
          {selectedNames.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">{selectedNames.size} selected</span>
              <button onClick={() => setSelectedNames(new Set())} className="btn btn-ghost btn-xs">Clear</button>
            </div>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body text-center py-12">
            <p className="text-base-content/50 text-lg">No practitioners match your search</p>
            <p className="text-base-content/40 text-sm">Try removing some filters</p>
            <button onClick={clearFilters} className="btn btn-primary btn-sm mt-4 mx-auto">Clear Filters</button>
          </div>
        </div>
      ) : (
        <div>
          {results.map((item, idx) => (
            <div key={idx}>
              <PractitionerCard
                p={item.p}
                locationFilter={location}
                isSelected={selectedNames.has(item.p.name)}
                onToggleSelect={toggleSelect}
              />
            </div>
          ))}
        </div>
      )}

      {selectedNames.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-base-100 border-t border-base-300 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-primary" />
              <span className="font-semibold">{selectedNames.size} practitioner{selectedNames.size !== 1 ? "s" : ""} selected</span>
              <span className="text-base-content/50 text-sm hidden sm:inline">
                — {selectedPractitioners.map(p => p.name.split(" ")[0]).join(", ")}
              </span>
            </div>
            <button
              onClick={() => setShowSendModal(true)}
              className="btn btn-primary gap-2"
            >
              <Send size={16} />
              Send to Client
            </button>
          </div>
        </div>
      )}

      {showSendModal && (
        <SendClientModal
          selected={selectedPractitioners}
          locationFilter={location}
          onClose={() => setShowSendModal(false)}
          onSent={handleSent}
        />
      )}
    </div>
  );
}
