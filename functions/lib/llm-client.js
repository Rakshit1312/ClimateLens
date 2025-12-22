import nodeFetch from 'node-fetch';


import fs from 'fs';
import path from 'path';

// Prefer a global fetch (e.g., in tests or runtimes that provide it) but fall back to node-fetch
// Allow tests to inject a fake fetch implementation by exposing a setter.
let fetcher = globalThis.fetch || nodeFetch;
export function __setFetchForTests(fn) { fetcher = fn; }



// Synchronously load a local `functions/.env` file at module load time for local dev, always from project root
function loadLocalEnvSync() {
  try {
    const envPath = path.resolve(process.cwd(), 'functions/.env');
    const txt = fs.readFileSync(envPath, 'utf8');
    txt.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
  } catch (e) {
    // ignore if no local .env
  }
}

if (!process.env.LLM_API_KEY) {
  loadLocalEnvSync();
}

// Simple LLM client wrapper. Reads LLM_API_KEY from env.
// Designed to be swapped for other providers easily.


const API_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions';
let API_KEY = process.env.LLM_API_KEY;

if (!API_KEY) {
  console.warn('LLM_API_KEY not set; mock responses will be used unless provided.');
}

// Trim down very noisy startup logs; keep only warnings and errors for visibility in CI
if (process.env.NODE_ENV === 'production') {
  // In production, be slightly quieter
  console.debug = () => {};
}

// Simple retry + timeout settings (configurable via env).
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 5000);
const LLM_RETRIES = Number(process.env.LLM_RETRIES || 1); // number of retries on transient errors

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetcher(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}


export const llmClient = {
  async callLLM({ prompt, model, max_tokens = 300 }) {
    // Always refresh API_KEY from process.env in case it was set after module load
    API_KEY = process.env.LLM_API_KEY || API_KEY;

    // Choose provider: explicit override or try to infer from API key
    const provider = (process.env.LLM_PROVIDER && process.env.LLM_PROVIDER.toLowerCase()) || (API_KEY && API_KEY.startsWith('AIza') ? 'google' : 'openai');

    // OpenAI-style model default
    const effectiveModel = model || process.env.LLM_MODEL || 'gemini-2.0-flash';

    if (!API_KEY) {
      // Return a safe mock response for local dev & tests that reflects basic input
      const cityMatch = prompt.match(/City: ([^\n]+)/);
      const city = cityMatch ? cityMatch[1] : 'the city';
      const tempMatch = prompt.match(/Temperature: ([0-9\.\-]+)/);
      const temp = tempMatch ? Number(tempMatch[1]) : null;
      let summary = `Mock: Good day for sightseeing in ${city}`;
      if (temp >= 30) summary = `Mock: Hot day in ${city} — prefer early morning activities`;
      else if (temp <= 5) summary = `Mock: Cold day in ${city} — consider indoor activities`;

      return {
        text: JSON.stringify({
          summary,
          best_time_of_day: temp && temp >= 30 ? 'morning' : 'no strong preference',
          recommendations: temp && temp >= 30 ? ['morning sightseeing', 'indoor museums'] : ['outdoor sightseeing', 'photography'],
          advisories: [],
        }),
      };
    }


    // Groq API support (OpenAI-compatible)
    if (provider === 'groq') {
      const url = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
      const body = {
        model: process.env.LLM_MODEL || 'llama3-70b-8192',
        messages: [{ role: 'user', content: prompt }],
        max_tokens,
        temperature: 0.3,
      };
      let lastErr;
      for (let attempt = 0; attempt <= LLM_RETRIES; attempt++) {
        try {
          const res = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(body),
          }, LLM_TIMEOUT_MS);

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Groq API error (${res.status}): ${text}`);
          }

          const json = await res.json();
          const message = json?.choices?.[0]?.message?.content ?? '';
          return { text: message.trim(), raw: json };
        } catch (e) {
          lastErr = e;
          if (e.name === 'AbortError' || (e && e.message && /4\d\d/.test(String(e.message)))) throw e;
          const backoff = 100 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
      throw lastErr;
    }

    // If the provider is Google (Gemini / Generative API) use its request shape and key handling
    if (provider === 'google') {
      // Always build the URL and body as per Gemini REST API docs
      const baseUrl = process.env.LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
      const googleModel = process.env.LLM_MODEL || model || 'gemini-2.0-flash';
      const apiKey = process.env.LLM_API_KEY || API_KEY;
      const url = `${baseUrl}/${googleModel}:generateContent?key=${apiKey}`;
      const gBody = {
        contents: [
          { parts: [{ text: prompt }] }
        ]
      };

      // Retry loop for transient failures
      let lastErr;
      for (let attempt = 0; attempt <= LLM_RETRIES; attempt++) {
        try {
          const res = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(gBody),
          }, LLM_TIMEOUT_MS);

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Google LLM API error (${res.status}): ${text}`);
          }

          const json = await res.json();
          // Gemini 2.0: response shape is candidates[0].content.parts[0].text
          let message = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return { text: (message || '').trim(), raw: json };
        } catch (e) {
          lastErr = e;
          // If aborted or 4xx, don't retry.
          if (e.name === 'AbortError' || (e && e.message && /4\d\d/.test(String(e.message)))) throw e;
          // Otherwise wait exponentially and retry
          const backoff = 100 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
      throw lastErr;
    }

    // Default/OpenAI-compatible path
    const body = {
      model: effectiveModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature: 0.3,
    };

    // Retry loop for OpenAI-style provider
    let lastErr;
    for (let attempt = 0; attempt <= LLM_RETRIES; attempt++) {
      try {
        const res = await fetchWithTimeout(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(body),
        }, LLM_TIMEOUT_MS);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`LLM API error (${res.status}): ${text}`);
        }

        const json = await res.json();
        // adapt response shape for a couple of providers
        const message = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? '';
        return { text: message.trim(), raw: json };
      } catch (e) {
        lastErr = e;
        if (e.name === 'AbortError' || (e && e.message && /4\d\d/.test(String(e.message)))) throw e;
        const backoff = 100 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
    throw lastErr;
  }
};

// Backwards-compatible helper
export async function callLLM(opts) {
  return llmClient.callLLM(opts);
}
