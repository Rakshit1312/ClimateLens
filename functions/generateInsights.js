import { callLLM } from './lib/llm-client.js';
import { buildInsightsPrompt } from './lib/prompt-builder.js';
import { computeAdvisories } from './lib/advisory-utils.js';
import { validateInsights } from './lib/insights-validator.js';

export async function handler(event) {
  // Expects POST JSON body: { city, current, forecast }
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }) };
    }

    const payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { city = 'Unknown city', current, forecast } = payload || {};

    if (!current || !forecast) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: current and forecast' }) };
    }

    const prompt = buildInsightsPrompt({ city, current, forecast });

    // Compute deterministic advisories and pass them into the LLM prompt indirectly
    const computed = computeAdvisories({ current, forecast });

    console.log('generateInsights: using LLM_API_KEY?', !!process.env.LLM_API_KEY);

    // Call LLM with error handling (LLM may fail); if it fails we will fall back to deterministic advisories
    let llm;
    try {
      llm = await callLLM({ prompt, max_tokens: 700 });
    } catch (e) {
      console.warn('LLM call failed, falling back to computed advisories', e && (e.message || e));
      const fallback = {
        summary: 'AI insights unavailable; see advisories for guidance.',
        best_time_of_day: 'no strong preference',
        recommendations: [],
        advisories: computed || [],
      };
      return { statusCode: 200, body: JSON.stringify({ insights: fallback }) };
    }

    // Log the raw LLM output for debugging
    console.log('LLM raw output:', llm.text);

    // Parse LLM text as JSON. Be defensive.
    let parsed;
    try {
      parsed = JSON.parse(llm.text);
    } catch (e) {
      // If LLM didn't return strict JSON, attempt to extract a JSON block from the text
      const m = llm.text.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    // Validate the parsed object
    const validated = validateInsights(parsed);
    if (!validated.ok) {
      console.warn('LLM returned invalid insights; errors:', validated.errors);
      // Graceful fallback: provide computed advisories and a short summary
      const fallback = {
        summary: 'AI returned unexpected output; see advisories for evidence-based guidance.',
        best_time_of_day: parsed && parsed.best_time_of_day ? String(parsed.best_time_of_day) : 'no strong preference',
        recommendations: Array.isArray(parsed && parsed.recommendations) ? parsed.recommendations.filter((r) => typeof r === 'string') : [],
        advisories: Array.from(new Set([...(computed || []), ...(Array.isArray(parsed && parsed.advisories) ? parsed.advisories.filter((a) => typeof a === 'string') : [])])),
      };

      return { statusCode: 200, body: JSON.stringify({ insights: fallback }) };
    }

    // Merge computed advisories with LLM advisories and dedupe; keep evidence-based messages first
    const finalAdvisories = Array.from(new Set([...(computed || []), ...(parsed.advisories || [])]));
    parsed.advisories = finalAdvisories;

    return { statusCode: 200, body: JSON.stringify({ insights: parsed }) };
  } catch (err) {
    console.error('generateInsights ERROR:', err && (err.stack || err.message || err));
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
}
