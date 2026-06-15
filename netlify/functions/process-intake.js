const crypto = require("crypto");

const INTAKE_EXTRACTION_PROMPT = `You are an intake coordinator for a psychology practice. Extract key client information from the provided text and return a structured JSON summary.

The text may be:
- A completed intake form (structured fields)
- A call transcript (conversational)
- Call notes (semi-structured)

Extract ONLY the following fields from the text. For missing fields, use null:
- client_name: Full name if mentioned
- client_age: Age or age range
- gender: Gender if mentioned
- presenting_issues: Array of main presenting issues (e.g., ["social anxiety", "work stress"])
- risk_indicators: Array of risk factors (suicidal ideation, self-harm, substance use concerns). Empty array if none identified
- location_preference: Preferred location - map suburbs to: "Greville St, Prahran", "Wattletree Rd, Malvern", "Victoria St, St Kilda", "Telehealth", or null if not mentioned
- timing_preference: Preferred days/times (e.g., "Weekday mornings")
- frequency: "Weekly", "Fortnightly", "Flexible", or null
- modality_preference: Therapy approach preferences (e.g., "CBT", "EMDR", "psychodynamic") or null
- funding: "Medicare", "Private health", "NDIS", "Self-funded", or null
- previous_therapy: Brief description or null
- referral_source: GP name or how they found the practice, or null
- additional_notes: Any other relevant matching info (cultural background, language needs, gender preference, urgency, specific practitioner requested, etc.) or null

Return ONLY valid JSON, no other text. Be specific about presenting issues - don't generalize.

Text to analyze:
`;

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod === "GET") {
    // Health check endpoint
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ status: "ready" }),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { text, intake_type } = body;

    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "No text provided" }),
      };
    }

    // Call Claude API directly for immediate processing
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const webhookUrl = process.env.TASKLET_WEBHOOK_URL;

    if (!anthropicApiKey) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "Anthropic API key not configured",
        }),
      };
    }

    // Call Claude to extract intake summary
    const extractionResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content:
              INTAKE_EXTRACTION_PROMPT +
              "\n\n" +
              text,
          },
        ],
      }),
    });

    if (!extractionResponse.ok) {
      const errorData = await extractionResponse.json();
      throw new Error(
        `Claude API error: ${extractionResponse.status} ${JSON.stringify(errorData)}`
      );
    }

    const extractionData = await extractionResponse.json();
    const extractedText =
      extractionData.content?.[0]?.text || "{}";

    let summary;
    try {
      summary = JSON.parse(extractedText);
    } catch {
      // If JSON parsing fails, return error
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "Failed to parse AI response",
        }),
      };
    }

    // Also forward to Tasklet for Anna's reference (fire and forget)
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "intake",
          intake_type: intake_type || "form",
          text: text,
          source: "netlify",
          summary: summary,
        }),
      }).catch(() => {
        // Silently fail - we've already returned results to Netlify
      });
    }

    // Return summary immediately to Netlify frontend
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(summary),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
    };
  }
};
