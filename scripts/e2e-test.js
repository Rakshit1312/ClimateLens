#!/usr/bin/env node
"use strict";

const BASE = process.env.API_BASE || "http://localhost:8888";

async function run() {
  const ok = (r) => r && r.ok;
  try {
    console.log('1) Checking homepage at', BASE + '/');
    let res = await fetch(`${BASE}/`);
    if (!ok(res)) throw new Error(`Homepage request failed: ${res.status} ${res.statusText}`);
    const html = await res.text();
    if (!html.includes('ClimateLens')) throw new Error('Homepage HTML does not include expected app title');
    console.log('  ✓ Homepage served');

    console.log('2) Checking weather endpoint: /api/weather?city=London');
    res = await fetch(`${BASE}/api/weather?city=London`);
    if (!ok(res)) throw new Error(`Weather endpoint failed: ${res.status}`);
    const data = await res.json();
    if (!data.current) throw new Error('Weather response missing `current`');
    if (!Array.isArray(data.forecast) || data.forecast.length === 0) throw new Error('Weather response missing `forecast`');
    console.log('  ✓ Weather endpoint returned current + forecast');
    console.log('    Forecast length:', data.forecast.length);

    console.log('3) Checking insights endpoint: /api/generateInsights (POST)');
    const payload = { city: 'London', current: data.current, forecast: data.forecast };
    res = await fetch(`${BASE}/api/generateInsights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!ok(res)) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Insights endpoint failed: ${res.status} ${txt}`);
    }
    const j = await res.json();
    if (!j.insights || !j.insights.summary) throw new Error('Insights missing expected fields');
    if (!Array.isArray(j.insights.recommendations)) throw new Error('Insights.recommendations missing or not array');
    if (!Array.isArray(j.insights.advisories)) throw new Error('Insights.advisories missing or not array');
    console.log('  ✓ Insights endpoint returned valid structure');

    console.log('\nAll checks passed.');
    console.log('Insights sample:', JSON.stringify(j.insights, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed:', err && err.message);
    process.exit(2);
  }
}

run();
