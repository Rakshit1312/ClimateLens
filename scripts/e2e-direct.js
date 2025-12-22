#!/usr/bin/env node
"use strict";

(async () => {
  try {
    // Ensure local env from functions/.env is loaded by importing a test harness
    const { handler: weatherHandler } = await import('../functions/weather.js');
    const { handler: insightsHandler } = await import('../functions/generateInsights.js');

    console.log('Calling weather handler for London...');
    const wRes = await weatherHandler({ queryStringParameters: { city: 'London' } });
    if (wRes.statusCode !== 200) throw new Error(`weather handler failed: ${wRes.statusCode}`);
    const wBody = JSON.parse(wRes.body);
    console.log('  ✓ weather handler returned current + forecast (forecast length:', wBody.forecast.length, ')');

    console.log('Calling generateInsights handler with weather payload...');
    const ev = { httpMethod: 'POST', body: JSON.stringify({ city: 'London', current: wBody.current, forecast: wBody.forecast }) };
    const gRes = await insightsHandler(ev);
    if (gRes.statusCode !== 200) throw new Error(`generateInsights failed: ${gRes.statusCode}`);
    const gBody = JSON.parse(gRes.body);
    console.log('  ✓ generateInsights returned insights:', gBody.insights);

    console.log('\nDIRECT E2E test passed');
    process.exit(0);
  } catch (err) {
    console.error('DIRECT E2E test failed:', err && err.message);
    process.exit(2);
  }
})();
