const path = require('path');
const fs = require('fs');

// Presentation keyword map — presentation name -> keywords to detect in intake notes
const PRESENTATION_KEYWORDS = {
  'Anxiety': ['anxiety', 'anxious', 'panic attacks', 'panic', 'worry', 'worrying', 'nervousness', 'gad', 'social anxiety', 'generalised anxiety'],
  'Depression': ['depression', 'depressed', 'low mood', 'feeling down', 'hopeless', 'sadness', 'persistent sadness', 'major depressive'],
  'Trauma & PTSD': ['trauma', 'traumatic', 'ptsd', 'post-traumatic', 'flashback', 'complex trauma', 'childhood trauma', 'abuse', 'assault'],
  'ADHD': ['adhd', 'attention deficit', 'hyperactivity', 'inattentive', 'attention difficulties', 'add '],
  'Autism Spectrum': ['autism', 'autistic', 'asd', 'asperger', 'neurodivergent', 'neurodiversity'],
  'OCD': ['ocd', 'obsessive', 'compulsive', 'obsessions', 'compulsions'],
  'Eating Disorders': ['eating disorder', 'anorexia', 'bulimia', 'binge eating', 'restrictive eating', 'disordered eating'],
  'Relationship Issues': ['relationship issues', 'relationship difficulties', 'couple', 'marriage difficulties', 'partner issues', 'divorce', 'separation', 'infidelity'],
  'Grief & Loss': ['grief', 'bereavement', 'loss', 'died', 'death', 'mourning', 'bereaved'],
  'Stress': ['stress', 'stressed', 'overwhelmed', 'overwhelm'],
  'Burnout': ['burnout', 'burn out', 'burnt out', 'burned out', 'overworked'],
  'Sleep Issues': ['insomnia', 'sleep difficulties', 'sleep issues', 'sleep problems', 'not sleeping', 'poor sleep'],
  'LGBTQI+': ['lgbtq', 'lgbtqi', 'gay', 'lesbian', 'bisexual', 'transgender', 'trans ', 'queer', 'gender dysphoria', 'gender identity'],
  'Addiction': ['addiction', 'addicted', 'alcohol use', 'drug use', 'substance use', 'gambling', 'substance abuse'],
  'Anger Management': ['anger', 'angry', 'rage', 'aggression', 'aggressive', 'anger issues'],
  'Work-Related Issues': ['work stress', 'workplace', 'work difficulties', 'occupational', 'job stress', 'work-related'],
  'Chronic Pain': ['chronic pain', 'ongoing pain', 'fibromyalgia', 'persistent pain'],
  'Chronic Illness': ['chronic illness', 'health anxiety', 'long-term illness', 'physical health'],
  'Personality Disorders': ['personality disorder', 'bpd', 'borderline', 'borderline personality'],
  'Phobias': ['phobia', 'phobic', 'specific fear', 'fear of '],
  'Self-Esteem': ['self-esteem', 'self esteem', 'self-worth', 'self worth', 'low confidence', 'self-confidence'],
  'Life Transitions': ['life transition', 'life change', 'adjustment', 'major change', 'transition'],
  'Family Issues': ['family issues', 'family conflict', 'family difficulties', 'parenting difficulties', 'parent-child'],
  'Perfectionism': ['perfectionism', 'perfectionist'],
  'Bipolar Disorder': ['bipolar', 'manic', 'mania', 'mood swings', 'mood episodes'],
  'Psychosis': ['psychosis', 'psychotic', 'schizophrenia', 'hallucinations', 'delusions'],
  'Perinatal': ['perinatal', 'postnatal', 'postpartum', 'pregnancy', 'new parent', 'maternal'],
  'Academic Issues': ['academic', 'school difficulties', 'study stress', 'university stress', 'exam stress'],
  'Social Difficulties': ['social difficulties', 'social skills', 'social isolation', 'making friends'],
  'Cultural Issues': ['cultural issues', 'multicultural', 'cultural background', 'cultural identity'],
};

const MODALITY_KEYWORDS = {
  'CBT': ['cbt', 'cognitive behavioural', 'cognitive behavioral', 'cognitive behaviour therapy'],
  'DBT': ['dbt', 'dialectical behaviour', 'dialectical behavior'],
  'EMDR': ['emdr', 'eye movement'],
  'ACT': [' act ', 'acceptance and commitment', 'acceptance & commitment'],
  'Schema Therapy': ['schema therapy', 'schema focused', 'schema-focused'],
  'Psychodynamic': ['psychodynamic', 'psychoanalytic'],
  'Mindfulness': ['mindfulness', 'mindfulness-based', 'mbsr', 'mbct'],
  'Somatic': ['somatic', 'body-based', 'somatic experiencing'],
  'Narrative Therapy': ['narrative therapy', 'narrative approach'],
  'IFS': ['ifs', 'internal family systems', 'parts work'],
};

function detectPresentations(textLower) {
  const found = [];
  for (const [presentation, keywords] of Object.entries(PRESENTATION_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      found.push(presentation);
    }
  }
  return found;
}

function detectModality(textLower) {
  for (const [modality, keywords] of Object.entries(MODALITY_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return modality;
    }
  }
  return null;
}

function checkAgeRange(clientAge, ageRange) {
  if (!ageRange || !clientAge) return true;
  const minMatch = ageRange.match(/(\d+)\+/);
  if (minMatch && clientAge < parseInt(minMatch[1])) return false;
  const rangeMatch = ageRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    if (clientAge < parseInt(rangeMatch[1]) || clientAge > parseInt(rangeMatch[2])) return false;
  }
  return true;
}

function extractSummary(text, textLower) {
  // Age
  let age = null;
  const agePatterns = [
    /\b(\d{1,2})\s*(?:year[s]?\s*old|yo|y\.o\.?|yrs?\s*old)\b/i,
    /\bage[d]?\s*:?\s*(\d{1,2})\b/i,
    /\b(\d{1,2})\s*year[s]?\s*of\s*age\b/i,
  ];
  for (const pat of agePatterns) {
    const m = textLower.match(pat);
    if (m) { age = m[1]; break; }
  }

  // Client gender (pronouns)
  let clientGender = null;
  const sheCount = (textLower.match(/\bshe\b|\bher\b/g) || []).length;
  const heCount = (textLower.match(/\bhe\b|\bhim\b|\bhis\b/g) || []).length;
  if (sheCount > heCount) clientGender = 'Female';
  else if (heCount > sheCount) clientGender = 'Male';

  // Clinician gender preference
  let gender = null;
  if (textLower.match(/prefer[s]?\s+(?:a\s+)?(?:female|woman)|female\s+(?:therapist|psychologist|clinician|practitioner)/)) {
    gender = 'Prefers female clinician';
  } else if (textLower.match(/prefer[s]?\s+(?:a\s+)?(?:male|man)|male\s+(?:therapist|psychologist|clinician|practitioner)/)) {
    gender = 'Prefers male clinician';
  }

  // Location
  let location_preference = null;
  if (textLower.match(/\bprahran\b|greville/)) location_preference = 'Greville St, Prahran';
  else if (textLower.match(/\bcamberwell\b|burke\s*rd/)) location_preference = 'Burke Rd, Camberwell';
  else if (textLower.match(/\bst[\s-]*kilda\b|victoria\s*st/)) location_preference = 'Victoria St, St Kilda';
  else if (textLower.match(/\b(telehealth|online|remote|zoom|video\s+call)\b/)) location_preference = 'Telehealth';

  // Funding
  let funding = null;
  if (textLower.match(/\bndis\b/)) funding = 'NDIS';
  else if (textLower.match(/\bmedicare\b/)) funding = 'Medicare';
  else if (textLower.match(/\bworksafe\b/)) funding = 'WorkSafe';
  else if (textLower.match(/\btac\b/)) funding = 'TAC';
  else if (textLower.match(/\bdva\b/)) funding = 'DVA';
  else if (textLower.match(/\behe\b|enhanced\s+mental\s+health/)) funding = 'EHE';
  else if (textLower.match(/\bprivate\b|\bself.pay\b/)) funding = 'Private / Self-pay';

  // Client name
  let client_name = null;
  const nameMatch = text.match(/(?:client|patient|name|referral\s+for)[:\s]+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/);
  if (nameMatch) client_name = nameMatch[1];

  // Presenting issues
  const presenting_issues = detectPresentations(textLower);

  // Risk
  let risk_indicators = null;
  if (textLower.match(/\b(suicid|self.harm|self harm|harm to (self|others)|crisis|at risk|actively|ideation)\b/)) {
    risk_indicators = 'Risk indicators mentioned — review notes carefully';
  }

  // Modality preference
  const modality_preference = detectModality(textLower);

  // Timing
  let timing = null;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const times = ['morning', 'afternoon', 'evening', 'weekday', 'weekend'];
  const foundDays = days.filter(d => textLower.includes(d));
  const foundTimes = times.filter(t => textLower.includes(t));
  const timingParts = [...foundDays.map(d => d.charAt(0).toUpperCase() + d.slice(1) + 's'), ...foundTimes];
  if (timingParts.length) timing = timingParts.join(', ');

  // Previous therapy
  let previous_therapy = null;
  if (textLower.match(/\b(previously|previous|prior|has seen|has had|tried|used to see|been in)\b.*\b(therap|psycholog|counsel)\b/)) {
    previous_therapy = 'Yes (mentioned in notes)';
  }

  // Referral source
  let referral_source = null;
  const refMatch = text.match(/(?:referred?\s+(?:by|from)|referral\s+(?:from|source|via))[:\s]+([^\n.]{3,50})/i);
  if (refMatch) referral_source = refMatch[1].trim();

  // Urgency note
  let additional_notes = null;
  if (textLower.match(/\b(urgent|asap|as soon as possible|emergency)\b/)) {
    additional_notes = 'Urgent referral';
  }

  return {
    client_name: client_name || null,
    age: age ? `${age} years old${clientGender ? ` (${clientGender})` : ''}` : (clientGender || null),
    gender,
    presenting_issues,
    risk_indicators,
    location_preference,
    timing,
    modality_preference,
    funding,
    previous_therapy,
    referral_source,
    additional_notes,
  };
}

function getAvailabilityNote(p) {
  const availLocs = (p.locations || []).filter(l => l.availability && typeof l.availability === 'string' && l.availability.trim());
  if (availLocs.length === 0) return 'Waitlist only';
  const slots = availLocs.map(l => {
    const firstSlot = l.availability.split('\n').find(s => s.trim()) || '';
    return `${l.location}: ${firstSlot}`;
  });
  return slots.join('; ');
}

function scorePractitioner(p, summary, textLower) {
  let score = 0;
  const reasons = [];

  // 1. Clinician gender preference — strong signal
  if (summary.gender) {
    const prefFemale = summary.gender.includes('female');
    const prefMale = summary.gender.includes('male');
    const pracGender = (p.gender || '').toLowerCase();
    if (prefFemale && pracGender.includes('female')) {
      score += 3;
      reasons.push('Female clinician as requested');
    } else if (prefMale && pracGender.includes('male')) {
      score += 3;
      reasons.push('Male clinician as requested');
    } else if (prefFemale && !pracGender.includes('female')) {
      score -= 8;
    } else if (prefMale && !pracGender.includes('male')) {
      score -= 8;
    }
  }

  // 2. Age range — disqualify if out of range
  if (summary.age) {
    const ageNum = parseInt(summary.age);
    if (!isNaN(ageNum) && !checkAgeRange(ageNum, p.age_range || '')) {
      score -= 15;
    }
  }

  // 3. Current availability
  const availLocs = (p.locations || []).filter(l => l.availability && typeof l.availability === 'string' && l.availability.trim());
  const hasAvail = availLocs.length > 0;
  if (hasAvail) {
    score += 3;
    reasons.push('Has current availability');
  }

  // 4. Location match
  if (summary.location_preference) {
    const locPref = summary.location_preference.toLowerCase();
    const pracLocs = p.locations || [];
    
    const matchedLoc = pracLocs.find(l => {
      const loc = (l.location || '').toLowerCase();
      if (locPref.includes('prahran') || locPref.includes('greville')) return loc.includes('prahran') || loc.includes('greville');
      if (locPref.includes('camberwell') || locPref.includes('burke')) return loc.includes('camberwell') || loc.includes('burke');
      if (locPref.includes('st kilda') || locPref.includes('victoria')) return loc.includes('st kilda') || loc.includes('victoria');
      if (locPref.includes('telehealth')) return loc.includes('telehealth') || loc.includes('online');
      return false;
    });

    if (matchedLoc) {
      const locHasAvail = matchedLoc.availability && matchedLoc.availability.trim();
      score += locHasAvail ? 4 : 2;
      reasons.push(`Sees clients at ${summary.location_preference}${locHasAvail ? ' (available)' : ''}`);
    }
  }

  // 5. Presentations match
  const pracPresentations = (Array.isArray(p.presentations) ? p.presentations : []).map(s => s.toLowerCase());
  const matchedPresentations = [];
  for (const issue of (summary.presenting_issues || [])) {
    const issueLower = issue.toLowerCase();
    const issueWords = issueLower.split(/\s+&?\s*/);
    const matched = pracPresentations.some(pp =>
      issueWords.some(word => word.length > 3 && (pp.includes(word) || issueLower.includes(pp.split(' ')[0])))
    );
    if (matched) {
      matchedPresentations.push(issue);
      score += 1.5;
    }
  }
  if (matchedPresentations.length > 0) {
    reasons.push(`Works with ${matchedPresentations.slice(0, 3).join(', ')}`);
  }

  // 6. Funding match
  if (summary.funding) {
    const pracBilling = (Array.isArray(p.billing_types) ? p.billing_types : []).join(' ').toLowerCase();
    const fundKey = summary.funding.toLowerCase().split(' ')[0];
    const fundMatch =
      pracBilling.includes(fundKey) ||
      (fundKey === 'private' && (pracBilling.includes('private') || pracBilling.includes('standard fee')));
    if (fundMatch) {
      score += 2;
      reasons.push(`Accepts ${summary.funding}`);
    } else if (!['private', 'self-pay'].includes(fundKey)) {
      score -= 2; // penalise if funded scheme not supported
    }
  }

  // 7. Modality preference
  if (summary.modality_preference) {
    const pracModalities = (Array.isArray(p.modalities) ? p.modalities : []).join(' ').toLowerCase();
    if (pracModalities.includes(summary.modality_preference.toLowerCase())) {
      score += 2;
      reasons.push(`Uses ${summary.modality_preference}`);
    }
  }

  // 8. Psychologist preference
  if (textLower.match(/\b(psychologist|clinical psychologist|clinical psych)\b/)) {
    const type = (p.therapist_type || '').toLowerCase();
    if (type.includes('clinical')) score += 1;
    else if (type.includes('psychologist')) score += 0.5;
  }

  // Ensure meaningful reasons
  if (reasons.filter(r => !r.includes('Note:')).length === 0) {
    if (hasAvail) reasons.push('Currently accepting new clients');
    if (pracPresentations.length > 5) reasons.push(`Broad experience across ${pracPresentations.length} presentation areas`);
    reasons.push(`${p.therapist_type || 'Experienced practitioner'}`);
  }

  return { practitioner: p, score, reasons: reasons.slice(0, 4) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };

    const dataPath = path.join(__dirname, 'practitioners-data.json');
    const practitioners = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Active practitioners only — no referral-only, no closed books
    const active = practitioners.filter(p => {
      if (p.referral_only) return false;
      const alert = (p.alert || '').toLowerCase();
      return !alert.includes('not taking') && !alert.includes('closed') && !alert.includes('books closed');
    });

    const textLower = text.toLowerCase();
    const summary = extractSummary(text, textLower);
    const scored = active.map(p => scorePractitioner(p, summary, textLower));
    scored.sort((a, b) => b.score - a.score);

    // Top 4, excluding extreme negatives (age/gender disqualified)
    const top = scored.filter(s => s.score > -5).slice(0, 4);

    const matches = top.map(m => ({
      name: m.practitioner.name,
      title: m.practitioner.title || '',
      gender: m.practitioner.gender || '',
      photo_url: m.practitioner.photo_url || '',
      locations: m.practitioner.locations || [],
      billing_types: m.practitioner.billing_types || [],
      match_score: m.score >= 9 ? 'Strong' : m.score >= 5 ? 'Good' : 'Possible',
      reasons: m.reasons,
      availability_note: getAvailabilityNote(m.practitioner),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ summary, matches }),
    };

  } catch (err) {
    console.error('match-intake error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
