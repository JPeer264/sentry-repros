const base = process.argv[2];
const T = { a: '11111111111111111111111111111111', b: '22222222222222222222222222222222', c: '33333333333333333333333333333333' };
await Promise.all(['a','b','c'].map(async id => {
  const res = await fetch(`${base}/iso/${id}`, { headers: {
    'sentry-trace': `${T[id]}-cccccccccccccccc-1`,
    baggage: `sentry-environment=up-${id},sentry-public_key=upstreamkey,sentry-trace_id=${T[id]},sentry-sample_rate=1,sentry-sampled=true`,
  }});
  await res.text();
}));
await (await fetch(`${base}/sentinel`)).text();
console.log('done');
