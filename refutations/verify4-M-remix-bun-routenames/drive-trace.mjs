const base = process.env.APP_URL;
const r = await fetch(`${base}/users/42`, {
  headers: {
    accept: 'text/html',
    'sentry-trace': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1',
    baggage: 'sentry-environment=upstream,sentry-public_key=public,sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
});
console.log('traced', r.status);
