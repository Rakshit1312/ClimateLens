import { buildInsightsPrompt } from '../lib/prompt-builder.js';

const sample = {
  city: 'Sampletown',
  current: { temp: 20, humidity: 45, wind: 2, condition: 'Clear' },
  forecast: [
    { day: 'Wed', temp: 21, condition: 'Clear' },
    { day: 'Thu', temp: 22, condition: 'Clouds' },
  ],
};

const p = buildInsightsPrompt(sample);
console.assert(p.includes('City: Sampletown'), 'prompt should include city');
console.assert(p.includes('Current weather'), 'prompt should include current weather');
console.assert(p.includes('- Wed: 21'), 'prompt should include forecast lines');
console.log('prompt-builder tests passed');
