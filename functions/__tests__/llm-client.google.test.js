(async () => {
  // Set provider and fake key before importing so the module picks up the mock fetch
  process.env.LLM_PROVIDER = 'google';
  process.env.LLM_API_KEY = 'fake-google-key';
  process.env.LLM_API_URL = 'https://example.com/generate';

  // Mock global fetch to simulate a Google Generative API response
  globalThis.fetch = async (url, opts) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ output: 'Google mock output' }] }),
      text: async () => JSON.stringify({ candidates: [{ output: 'Google mock output' }] }),
    };
  };

  const { llmClient } = await import('../lib/llm-client.js');
  const res = await llmClient.callLLM({ prompt: 'Test prompt', max_tokens: 100 });
  console.assert(res.text === 'Google mock output', `unexpected response: ${JSON.stringify(res)}`);
  console.log('llm-client google test passed');
})();
