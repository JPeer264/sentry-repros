const base = process.env.BASE || 'http://127.0.0.1:41319';
const tid = { a: '0'.repeat(31) + '1', b: '0'.repeat(31) + '2', c: '0'.repeat(31) + '3' };
const r = await Promise.all(
  ['a', 'b', 'c'].map(id =>
    fetch(`${base}/iso/${id}`, {
      headers: {
        'sentry-trace': `${tid[id]}-aabbccddeeff0011-1`,
        baggage: `sentry-environment=upstream,sentry-public_key=pub,sentry-trace_id=${tid[id]}`,
      },
    }).then(r => r.status),
  ),
);
console.log('iso statuses', r);
console.log('sentinel', (await fetch(`${base}/sentinel`)).status);
