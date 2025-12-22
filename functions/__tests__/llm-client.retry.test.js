import { llmClient, __setFetchForTests } from '../lib/llm-client.js';

process.env.LLM_PROVIDER = 'openai';
process.env.LLM_API_KEY = 'fake-openai-key';
process.env.LLM_RETRIES = '2';
process.env.LLM_TIMEOUT_MS = '1000';

let calls = 0;
__setFetchForTests(async (url, opts) => {
  calls++;
  if (calls === 1) {
    // Simulate transient network error
    return { ok: false, status: 502, text: async () => 'Bad Gateway' };
  }
  // Second attempt - success
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: 'Success from retry' } }] }),
    text: async () => JSON.stringify({ choices: [{ message: { content: 'Success from retry' } }] }),
  };
});

(async () => {
  const res = await llmClient.callLLM({ prompt: 'Test prompt' });
  console.assert(res.text === 'Success from retry', `unexpected response: ${JSON.stringify(res)}`);
  console.log('llm-client retry test passed');
})();
