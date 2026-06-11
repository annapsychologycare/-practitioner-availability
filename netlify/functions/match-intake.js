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
  'Phobias': ['phobia', 'phobic', 'specific fear', 'fear of ', 'agoraphobia', 'agoraphobic'],
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
  'ISTDP': ['istdp', 'intensive short-term dynamic', 'short-term dynamic psychotherapy'],
  'Schema Therapy': ['schema therapy', 'schema focused', 'schema-focused'],
  'Psychodynamic': ['psychodynamic', 'psychoanalytic'],
  'Mindfulness': ['mindfulness', 'mindfulness-based', 'mbsr', 'mbct'],
  'Somatic': ['somatic', 'body-based', 'somatic experiencing', 'somatic therapist'],
  'Narrative Therapy': ['narrative therapy', 'narrative approach'],
  'IFS': ['ifs', 'internal family systems', 'parts work'],
  'Exposure Therapy': ['exposure therapy', 'exposure-based', 'exposure walks', 'graded exposure'],
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
    /\bdob[:\s]+\S+\s+\((\d{1,2})\s*years?\)/i,
  ];
  for (const pat of agePatterns) {
    const m = text.match(pat);
    if (m) { age = m[1]; break; }
  }

  // Try to calculate from DOB
  if (!age) {
    const dobMatch = text.match(/(?:dob|date of birth|born)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dobMatch) {
      const parts = dobMatch[1].split(/[\/\-]/);
      if (parts.length === 3) {
        const year = parseInt(parts[2].length === 2 ? '19' + parts[2] : parts[2]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[0]);
        const dob = new Date(year, month, day);
        const today = new Date();
        let calcAge = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) calcAge--;
        if (calcAge > 0 && calcAge < 120) age = String(calcAge);
      }
    }
  }

  // Client sex (from explicit mention or pronouns)
  let sex = null;
  if (textLower.match(/\b(sex|gender)\s*:?\s*(male|man|gentleman)\b/)) sex = 'Male';
  else if (textLower.match(/\b(sex|gender)\s*:?\s*(female|woman)\b/)) sex = 'Female';
  else {
    const sheCount = (textLower.match(/\bshe\b|\bher\b/g) || []).length;
    const heCount = (textLower.match(/\bhe\b|\bhim\b|\bhis\b/g) || []).length;
    if (sheCount > heCount + 1) sex = 'Female';
    else if (heCount > sheCount + 1) sex = 'Male';
  }

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
  else if (textLower.match(/\bflexible\b|\bno preference\b|\bany location\b/)) location_preference = 'Flexible';

  // Funding
  let funding = null;
  const fundingParts = [];
  if (textLower.match(/\bndis\b/)) {
    if (textLower.match(/plan.managed/)) fundingParts.push('NDIS (Plan Managed)');
    else if (textLower.match(/self.managed/)) fundingParts.push('NDIS (Self Managed)');
    else fundingParts.push('NDIS');
  }
  if (textLower.match(/\bmedicare\b/)) {
    if (textLower.match(/mhcp|mhtp|mental health (care|treatment) plan/)) fundingParts.push('Medicare (has MHCP)');
    else if (textLower.match(/gp|needs (a )?(referral|plan)/)) fundingParts.push('Medicare (needs MHCP)');
    else fundingParts.push('Medicare');
  }
  if (textLower.match(/\bworksafe\b|\bworkcover\b/)) fundingParts.push('WorkCover ⚠️ Not accepted');
  if (textLower.match(/\btac\b/)) fundingParts.push('TAC ⚠️ Not accepted');
  if (textLower.match(/\bdva\b/)) fundingParts.push('DVA');
  if (textLower.match(/\behe\b|enhanced\s+mental\s+health/)) fundingParts.push('EHE');
  if (textLower.match(/\bprivate\b|\bself.pay\b|\bout of pocket\b/)) fundingParts.push('Private / Self-pay');
  funding = fundingParts.length ? fundingParts.join('; ') : null;

  // Client name
  let client_name = null;
  const namePatterns = [
    /(?:client|patient|name)[:\s]+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/,
    /(?:referral\s+for)[:\s]+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/,
    /^([A-Z][a-zA-Z'-]+\s+[A-Z][a-zA-Z'-]+)\s*[\n\r]/m,
  ];
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m) { client_name = m[1]; break; }
  }

  // Presenting issues
  const presenting_issues = detectPresentations(textLower);

  // Risk — more detailed
  let risk_suicidality = null;
  let risk_selfharm = null;
  let risk_eating = null;
  let risk_substances = null;
  let risk_other = null;

  if (textLower.match(/\b(suicid|ending (their|his|her|my) life|thoughts of (death|dying)|ideation|self-destruct)\b/)) {
    risk_suicidality = '⚠️ Mentioned — review notes';
  }
  if (textLower.match(/\bself.harm\b|\bcutting\b|\bself.injur/)) {
    risk_selfharm = '⚠️ Mentioned — review notes';
  }
  if (textLower.match(/\beating disorder\b|\banorexia\b|\bbulimia\b|\bbinge eating\b|\bdisordered eating\b|\bbody image\b/)) {
    risk_eating = '⚠️ Mentioned — review notes';
  }
  if (textLower.match(/\b(alcohol|substance|drug use|addiction|addicted|gambling)\b/)) {
    risk_substances = '⚠️ Mentioned — review notes';
  }
  if (textLower.match(/\b(domestic violence|dv|aggression|psychosis|hospitalised|hospital|crisis team|acute)\b/)) {
    risk_other = '⚠️ Mentioned — review notes';
  }

  // Collapse into single risk_indicators field for scoring (preserve backward compat)
  let risk_indicators = null;
  const risks = [risk_suicidality, risk_selfharm, risk_eating, risk_substances, risk_other].filter(Boolean);
  if (risks.length) risk_indicators = 'Risk indicators mentioned — review notes carefully';

  // Modality preference — collect all
  const allModalities = [];
  for (const [modality, keywords] of Object.entries(MODALITY_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) allModalities.push(modality);
  }
  const modality_preference = allModalities.length ? allModalities.join(', ') : null;

  // Therapy style preference
  let therapy_style = null;
  if (textLower.match(/structured|practical|tools|strategies|skills.based|coping strategies/)) therapy_style = 'Structured / practical / skills-based';
  else if (textLower.match(/exploratory|open.ended|talk.based|conversational|depth|deeper/)) therapy_style = 'Exploratory / conversational';
  else if (textLower.match(/trauma.focused|past experiences|childhood/)) therapy_style = 'Trauma-focused / depth work';

  // Frequency
  let frequency = null;
  if (textLower.match(/\bweekly\b/)) frequency = 'Weekly';
  else if (textLower.match(/\bfortnightly\b|\bevery (two|2) weeks\b/)) frequency = 'Fortnightly';
  else if (textLower.match(/\bflexible\b|\bunsure\b/)) frequency = 'Flexible';

  // Timing
  let timing = null;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const times = ['morning', 'afternoon', 'evening', 'weekday', 'weekend', 'before school', 'after school', 'after hours'];
  const foundDays = days.filter(d => textLower.includes(d));
  const foundTimes = times.filter(t => textLower.includes(t));
  const timingParts = [...foundDays.map(d => d.charAt(0).toUpperCase() + d.slice(1) + 's'), ...foundTimes];
  if (timingParts.length) timing = timingParts.join(', ');

  // Previous therapy
  let previous_therapy = null;
  if (textLower.match(/\b(previously|previous|prior|has seen|has had|tried|used to see|been in)\b.*\b(therap|psycholog|counsel)\b/)) {
    previous_therapy = 'Yes (see notes for details)';
  } else if (textLower.match(/\bno previous\b|\bno prior\b|\bfirst time\b|\bnever seen\b/)) {
    previous_therapy = 'No';
  }

  // Diagnosis / background
  let diagnosis = null;
  const diagKeywords = ['adhd', 'autism', 'asd', 'anxiety disorder', 'depression', 'bipolar', 'bpd', 'borderline', 'ptsd', 'ocd', 'schizophrenia', 'eating disorder', 'anorexia', 'bulimia', 'personality disorder'];
  const foundDiag = diagKeywords.filter(d => textLower.includes(d));
  if (foundDiag.length) diagnosis = foundDiag.map(d => d.toUpperCase()).join(', ');

  // Medication
  let medication = null;
  if (textLower.match(/\b(medicated|medication|antidepressant|ssri|snri|antipsychotic|mood stabiliser|ritalin|concerta|vyvanse|lexapro|zoloft|prozac|effexor|abilify|seroquel|lithium)\b/)) {
    medication = 'Yes (mentioned in notes)';
  } else if (textLower.match(/\bno medication\b|\bnot medicated\b/)) {
    medication = 'No';
  }

  // Referral source
  let referral_source = null;
  const refMatch = text.match(/(?:referred?\s+(?:by|from)|referral\s+(?:from|source|via)|found\s+(?:us|pc)\s+(?:via|through|on))[:\s]+([^\n.]{3,60})/i);
  if (refMatch) referral_source = refMatch[1].trim();

  // Urgency note
  let additional_notes = null;
  const urgencyMatch = textLower.match(/\b(urgent|asap|as soon as possible|emergency)\b/);
  if (urgencyMatch) additional_notes = '⚡ Urgent referral requested';

  // Specific practitioner requested
  let specific_practitioner = null;
  const specMatch = text.match(/(?:specific(?:ally)?|requested|wants to see|referred to see|asked for)[:\s]+(?:(?:Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (specMatch) specific_practitioner = specMatch[1];

  return {
    client_name: client_name || null,
    age: age ? `${age} years old` : null,
    sex,
    gender,
    presenting_issues,
    risk_indicators,
    risk_suicidality,
    risk_selfharm,
    risk_eating,
    risk_substances,
    risk_other,
    location_preference,
    timing,
    frequency,
    modality_preference,
    therapy_style,
    funding,
    previous_therapy,
    diagnosis,
    medication,
    referral_source,
    specific_practitioner,
    additional_notes,
  };
}

function generateEmailIntro(summary) {
  const firstName = summary.client_name ? summary.client_name.split(' ')[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

  const issues = summary.presenting_issues || [];
  let issueRef = '';
  if (issues.length === 1) {
    issueRef = ` with ${issues[0].toLowerCase()}`;
  } else if (issues.length === 2) {
    issueRef = ` with ${issues[0].toLowerCase()} and ${issues[1].toLowerCase()}`;
  } else if (issues.length > 2) {
    issueRef = ` with ${issues.slice(0, 2).map(i => i.toLowerCase()).join(', ')} and related concerns`;
  }

  const modalityRef = summary.modality_preference
    ? ` We have also kept in mind your interest in ${summary.modality_preference}.`
    : '';

  const locationRef = summary.location_preference && !['Flexible', 'No preference'].includes(summary.location_preference)
    ? ` All options below are available at ${summary.location_preference} as per your preference.`
    : '';

  return `${greeting} Thank you so much for taking the time to speak with us — we really appreciate you sharing what you've been going through${issueRef}, and we're so glad you've reached out to PsychologyCare. We've carefully reviewed everything you shared and have put together some practitioners we think would be a wonderful fit for you and your needs.${modalityRef}${locationRef} Each option has been selected with your goals and preferences in mind. Please feel free to reach out if you have any questions — we're here to help and look forward to supporting you on this journey.`;
}

// ─── AI-powered rich summary (used when OPENAI_API_KEY is set) ───────────────

async function generateAISummary(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are an intake coordinator assistant for PsychologyCare, a psychology practice in Melbourne, Australia. You process intake call transcripts or notes and produce a rich structured summary + a warm client email intro.

Return a JSON object with exactly two fields: "display_summary" and "email_intro".

DISPLAY_SUMMARY FORMAT — use these exact emoji headers, plain text, bullet points:

👤 CLIENT
• Name: [Full name if given, or "Not provided"]
• Age: [Exact age from DOB, OR estimate from context clues — e.g. "likely mid-40s (mentions adult children)". Never just write "aged male/female".]
• Sex: [Male / Female / Not specified — infer from name/pronouns if not explicit]

🎯 PRESENTING ISSUES  (most important first)
• [Primary issue — specific and descriptive, not just a label. E.g. "Severe agoraphobia — present for ~30 years, unable to leave home without safe person and medication" not just "phobias"]
• [Secondary with context]
• [Further issues as needed]
• Impact: [How issues affect daily life, work, relationships, functioning]

📋 CALL SUMMARY
[5–10 concise bullet points covering ALL key call content: what brought them in, history, current situation, supports, therapy history, goals, anything notable about the call]

⚠️ RISK
• Suicidality/self-harm: [Nuanced detail — e.g. "Chronic passive SI — reports ideation is long-standing and part of his experience; denies current intent or plan; appears insightful" or "Nil identified"]
• Eating/body image: [Detail or "Nil identified"]
• Substances: [Detail or "Nil identified"]
• Other: [DV, crisis history, acute distress — or "Nil identified"]
• Protective factors: [e.g. "Reports good support network" — or "Not identified"]
• Private practice suitability: [Suitable ✓ / Discuss with Anna ⚠️ / Not suitable ✗ — brief reason]

🧠 MODALITIES & APPROACH
• Preferred modalities: [ALL mentioned — spell out in full, e.g. ISTDP, Somatic, Exposure Therapy — or "Not specified"]
• Therapy style: [What they want from therapy — e.g. "Experiential / depth work — explicitly does NOT want talk-only therapy"]
• Previous therapy: [Summary of what they've tried and what worked/didn't, or "None" / "Not mentioned"]

🏥 BACKGROUND
• Diagnoses: [Formal diagnoses mentioned, or "None disclosed"]
• Medication: [Specific medications if named — e.g. "Atomoxetine (ADHD), Valium PRN (anxiety)" — or "Yes (details in notes)" / "No" / "Not mentioned"]
• Current supports: [Other therapists, psychiatrist, GP, support workers currently seeing — or "None"]

📍 LOCATION & AVAILABILITY
• Location: [Their location + travel capacity + preference — e.g. "Fitzroy — Telehealth preferred; open to Camberwell if needed"]
• Days/times: [Preferred schedule or "Flexible / Not specified"]
• Frequency: [Weekly / Fortnightly / Flexible / Not mentioned]

💰 FUNDING
• [Specific: e.g. "NDIS (self-managed)" / "Medicare (MHTP) — has existing plan" / "Private / self-funded". If WorkCover or TAC: flag ⚠️ we do NOT accept these.]

👨‍⚕️ PRACTITIONER PREFERENCES
• Gender: [Male / Female / No preference / Not stated]
• Specific request: [Named practitioner if mentioned, e.g. "Initially enquired about Dr David Spektor (closed)" — or "None"]
• Other: [Cultural preferences, approach qualities, experience level mentioned]

📝 NOTES
[Anything else worth flagging — urgency, logistics, red flags, cultural needs, or anything that stood out on the call]

EMAIL_INTRO FORMAT:
Warm, professional, 3–5 sentences. Use their first name. Reference their presenting issues warmly (not clinically). Mention we've reviewed their info and found strong matches. Reference 1–2 relevant practitioner strengths (modality/location fit). End with an encouraging welcoming tone.
Example: "Hi Daniel, thank you so much for taking the time to speak with us — it sounds like you've been navigating some really significant challenges for a long time, and we're so glad you've reached out..."`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please process this intake:\n\n${text}` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return {
      display_summary: content.display_summary || null,
      email_intro: content.email_intro || null,
    };
  } catch (err) {
    console.error('AI summary generation failed:', err.message);
    return null;
  }
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

    // Try AI-powered rich summary (requires OPENAI_API_KEY env var in Netlify)
    const aiResult = await generateAISummary(text);
    const email_intro = aiResult?.email_intro || generateEmailIntro(summary);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        summary,
        matches,
        email_intro,
        ai_display_summary: aiResult?.display_summary || null,
        ai_powered: !!aiResult,
      }),
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
