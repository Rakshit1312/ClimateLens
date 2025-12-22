import fs from 'fs';

async function loadEnv() {
  if (!process.env.OWM_KEY) {
    const p = new URL('./.env', import.meta.url);
    try {
      const txt = await fs.promises.readFile(p, 'utf8');
      txt.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m) process.env[m[1]] = m[2];
      });
    } catch (e) {
      // ignore
    }
  }
}

(async () => {
  await loadEnv();

  if (!process.env.OWM_KEY) {
    console.error('No OWM_KEY found in env or functions/.env — aborting test.');
    process.exit(1);
  }

  const { handler } = await import('./weather.js');
  console.log('Testing with OWM_KEY present (will call OpenWeatherMap API)');

  try {
    const res = await handler({ queryStringParameters: { city: 'London' } });
    console.log('Status:', res.statusCode);
    try {
      const body = JSON.parse(res.body);
      console.log('Forecast length:', body.forecast.length);
      console.log('Body:', body);
    } catch (e) {
      console.log('Body (raw):', res.body);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
})();
