// Test that the weather handler uses the in-memory cache and avoids repeated fetches

// Fake fetch implementation to simulate OpenWeather responses and count calls
let calls = 0;
globalThis.fetch = async (url) => {
  calls++;
  if (url.includes('/data/2.5/weather')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ main: { temp: 20, humidity: 50 }, wind: { speed: 3 }, weather: [{ main: 'Clear' }] }),
      text: async () => JSON.stringify({ main: { temp: 20, humidity: 50 }, wind: { speed: 3 }, weather: [{ main: 'Clear' }] }),
    };
  }
  if (url.includes('/data/2.5/forecast')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ list: [] }),
      text: async () => JSON.stringify({ list: [] }),
    };
  }
  return { ok: false, status: 500, text: async () => 'unknown' };
};

(async () => {
  // ensure cache map is fresh
  globalThis.__weather_cache = new Map();
  const { handler } = await import('../weather.js');

  // First call - should hit fetch twice (current + forecast)
  const res1 = await handler({ queryStringParameters: { city: 'London' } });
  if (res1.statusCode !== 200) throw new Error('first call should succeed');

  // Second call - should be served from cache (no additional fetch calls)
  const res2 = await handler({ queryStringParameters: { city: 'London' } });
  if (res2.statusCode !== 200) throw new Error('second call should succeed');

  if (calls !== 2) throw new Error(`expected 2 fetch calls total, actual ${calls}`);
  console.log('weather cache test passed');
})();
