const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, intake_type } = JSON.parse(event.body);
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };

    // Load practitioner data
    const dataPath = path.join(__dirname, 'practitioners-data.json');
    const practitioners = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Filter out practitioners with closed books / alerts about not taking clients
    const activePractitioners = practitioners.filter(p => {
      const alert = (p.alert || '').toLowerCase();
      return !alert.includes('not taking') && !alert.includes('closed') && !alert.includes('books closed');
    });

    const rosterText = activePractitioners.map(p => {
      const availLines = p.locations
        .filter(l => l.availability)
        .map(l => `    ${l.location}: ${l.availability.split('\n').join(', ')}`)
        .join('\n');
      const hasAvail = availLines.length > 0;
      return [
        `Name: ${p.name}`,
        `Title: ${p.title}`,
        `Gender: ${p.gender || 'Not specified'}`,
        `Ages seen: ${p.age_range || 'Not specified'}`,
        `Therapist type: ${p.therapist_type || ''}`,
        `Client types: ${Array.isArray(p.client_types) ? p.client_types.join(', ') : p.client_types || ''}`,
        `Presentations: ${Array.isArray(p.presentations) ? p.presentations.join(', ') : p.presentations || ''}`,
        `Modalities: ${Array.isArray(p.modalities) ? p.modalities.join(', ') : p.modalities || ''}`,
        `Style: ${Array.isArray(p.style) ? p.style.join(', ') : p.style || ''}`,
        `Billing: ${Array.isArray(p.billing_types) ? p.billing_types.join(', ') : p.billing_types || ''}`,
        `Bio: ${p.short_bio || ''}`,
        `Availability: ${hasAvail ? '\n' + availLines : 'Currently fully booked / waitlist only'}`,
        p.alert ? `Note: ${p.alert}` : ''
      ].filter(Boolean).join('\n');
    }).join('\n\n---\n\n');

    const systemPrompt = `You are an intake coordinator at PsychologyCare, a psychology practice in Melbourne, Australia. 
Your job is to:
1. Extract a concise intake summary from the provided notes
2. Suggest the 3–4 best matching practitioners from the roster, with specific reasons

You must respond with valid JSON in this exact format:
{
  "summary": {
    "client_name": "string",
    "age": "string",
    "gender": "string",
    "presenting_issues": ["string"],
    "risk_indicators": "string or null",
    "location_preference": "string or null",
    "timing": "string or null",
    "modality_preference": "string or null",
    "funding": "string or null",
    "previous_therapy": "string or null",
    "referral_source": "string or null",
    "additional_notes": "string or null"
  },
  "matches": [
    {
      "name": "exact practitioner name from roster",
      "match_score": "Strong / Good / Possible",
      "reasons": ["specific reason 1", "specific reason 2", "specific reason 3"],
      "availability_note": "brief note on their availability or 'Waitlist only'"
    }
  ]
}

Important:
- Only suggest practitioners from the provided roster
- Use exact names as they appear in the roster
- Give specific, concrete reasons (e.g. "Has Burnout and Depression in presentations", "Male clinician as requested", "Available Thursdays which suits client")
- Be honest about waitlist situations
- If a client has specific gender preference, respect that
- Consider funding type compatibility (Medicare, NDIS, etc.)
- Consider age range compatibility
- Prioritise practitioners with current availability where possible, but flag good waitlist matches too`;

    const userPrompt = `Intake type: ${intake_type || 'notes'}

INTAKE NOTES:
${text}

---

PRACTITIONER ROSTER:
${rosterText}

Please analyse the intake and suggest the best matching practitioners.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const rawContent = response.content[0].text;
    
    // Parse JSON from response
    let result;
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawContent];
      result = JSON.parse(jsonMatch[1]);
    } catch (e) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to parse AI response', raw: rawContent })
      };
    }

    // Enrich matches with photo_url and availability from roster
    if (result.matches) {
      result.matches = result.matches.map(match => {
        const prac = activePractitioners.find(p => p.name === match.name);
        if (prac) {
          match.photo_url = prac.photo_url || '';
          match.title = prac.title || '';
          match.gender = prac.gender || '';
          match.locations = prac.locations || [];
          match.billing_types = prac.billing_types || [];
        }
        return match;
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.error('match-intake error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
