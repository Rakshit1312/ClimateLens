import { computeAdvisories } from '../lib/advisory-utils.js';

// Heat
console.assert(
  computeAdvisories({ current: { temp: 36, humidity: 30, wind: 1 } }).includes('Extreme heat — avoid prolonged sun exposure'),
  'should warn on extreme heat'
);

// Wind
console.assert(
  computeAdvisories({ current: { temp: 20, humidity: 40, wind: 18 } }).some((s) => s.includes('High winds')),
  'should warn on high winds'
);

// Rain in forecast
console.assert(
  computeAdvisories({ current: { temp: 20, humidity: 40, wind: 1 }, forecast: [{ day: 'Tue', condition: 'Rain' }] }).some((s) => s.includes('Rain expected')),
  'should warn if rain appears in forecast'
);

console.log('advisory utils tests passed');
