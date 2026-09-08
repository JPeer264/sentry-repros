const base = process.argv[2];
const paths = process.argv.slice(3);
const TRACE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SPAN = 'bbbbbbbbbbbbbbbb';
for (const p of paths) {
  const headers = {};
  if (p.startsWith('!')) {
    headers['sentry-trace'] = `${TRACE}-${SPAN}-1`;
    headers['baggage'] = `sentry-environment=upstream,sentry-public_key=upstreamkey,sentry-trace_id=${TRACE},sentry-sample_rate=1,sentry-sampled=true`;
  }
  const path = p.replace(/^!/, '');
  const res = await fetch(base + path, { headers });
  await res.text();
  console.log(path, res.status, Object.keys(headers).length ? '(with incoming trace)' : '');
}
