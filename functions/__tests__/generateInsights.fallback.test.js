import { handler } from '../generateInsights.js';
import { llmClient } from '../lib/llm-client.js';

// Simulate LLM throwing an error and verify handler returns fallback insights
llmClient.callLLM = async () => { throw new Error('simulated LLM failure'); };

(async () => {
  const payload = {
    city: 'TestCity',
    current: { temp: 36, humidity: 30, wind: 1, condition: 'Clear' },
    forecast: [
      { day: 'Wed', temp: 18, condition: 'Clear' },
      { day: 'Thu', temp: 20, condition: 'Rain' }
    ]
  };

  const event = { httpMethod: 'POST', body: JSON.stringify(payload) };
  const res = await handler(event);
  const body = JSON.parse(res.body);
  console.assert(res.statusCode === 200, 'expected 200 fallback');
  console.assert(body.insights && Array.isArray(body.insights.advisories), 'expected advisories in fallback');
  console.log('generateInsights fallback test passed');
})();
