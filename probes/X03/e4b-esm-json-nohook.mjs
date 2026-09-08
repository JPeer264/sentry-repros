try {
  const m = await import('./x.json', { with: { type: 'json' } });
  console.log(`RESULT e4b-esm-json-nohook: ok ${JSON.stringify(m.default)}`);
} catch (e) {
  console.log(`RESULT e4b-esm-json-nohook: FAIL ${e.name}: ${e.message}`);
}
