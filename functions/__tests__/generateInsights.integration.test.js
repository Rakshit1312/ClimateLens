import { handler } from '../generateInsights.js';
import { llmClient } from '../lib/llm-client.js';

// Mock the LLM client to return a predictable JSON string
const mockJson = JSON.stringify({
  summary: 'Good day for sightseeing',
  best_time_of_day: 'morning',
  recommendations: [
    { activity: 'outdoor sightseeing', reason: 'clear skies and mild temp' },
    { activity: 'walking tours', reason: 'low wind and comfortable humidity' }
  ],
  advisories: []
});

// Replace callLLM with a mock
llmClient.callLLM = async () => ({ text: mockJson });

(async () => {
  const payload = {
    city: 'TestCity',
    current: { temp: 18, humidity: 60, wind: 3, condition: 'Clear' },
    forecast: [
      { day: 'Wed', temp: 18, condition: 'Clear' },
      { day: 'Thu', temp: 20, condition: 'Clear' }
    ]
  };

  const event = { httpMethod: 'POST', body: JSON.stringify(payload) };
  const res = await handler(event);
  const body = JSON.parse(res.body);
  console.assert(res.statusCode === 200, 'expected 200');
  console.assert(body.insights && body.insights.summary === 'Good day for sightseeing', 'expected summary');
  console.log('integration test passed');
})();
