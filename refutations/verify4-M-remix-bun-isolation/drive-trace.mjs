const base = process.env.BASE || 'http://127.0.0.1:27433';
const r = await Promise.all(
  ['a', 'b', 'c'].map(id =>
    fetch(`${base}/iso/${id}`, {
      headers: {
        'sentry-trace': `${'0'.repeat(31)}${id === 'a' ? '1' : id === 'b' ? '2' : '3'}-${'aabbccddeeff0011'}-1`,
        baggage: 'sentry-environment=upstream,sentry-public_key=pub,sentry-trace_id=' + '0'.repeat(31) + (id === 'a' ? '1' : id === 'b' ? '2' : '3'),
      },
    }).then(r => r.status),
  ),
);
console.log('iso statuses', r);
console.log('sentinel', (await fetch(`${base}/sentinel`)).status);
