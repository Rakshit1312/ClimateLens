(async () => {
  const { handler } = await import('./weather.js');

  // Test: missing API key
  delete process.env.OWM_KEY;
  const res1 = await handler({ queryStringParameters: { city: 'London' } });
  console.log('Missing key test:', res1);

  // Test: empty city
  process.env.OWM_KEY = 'fake-key';
  const res2 = await handler({ queryStringParameters: { } });
  console.log('Empty city test:', res2);

  // Test: invalid key (will call real API and should return 401 JSON)
  // Note: this may hit network and the fake key will produce an API error
  const res3 = await handler({ queryStringParameters: { city: 'London' } });
  console.log('Invalid key test:', res3);
})();