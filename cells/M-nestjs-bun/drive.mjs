const SINK = `http://127.0.0.1:${process.env.SINK_PORT}`;
const APP = `http://127.0.0.1:${process.env.PORT}`;

const get = (path, headers) => fetch(`${APP}${path}`, { headers }).then(r => r.text().then(t => [r.status, t]));

await fetch(`${SINK}/__items`, { method: 'DELETE' });
await fetch(`${SINK}/__rec`, { method: 'DELETE' });

console.error('users:', await get('/users/42'));
console.error('traced:', await get('/users/42', {
  'sentry-trace': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1',
  baggage: 'sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=production,sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1',
}));
console.error('error:', await get('/error'));
console.error('isolated:', await Promise.all([get('/isolated?tag=a'), get('/isolated?tag=b'), get('/isolated?tag=c')]));
console.error('db:', await get('/db'));
console.error('downstream:', await get('/downstream'));
console.error('log:', await get('/log'));
console.error('sentinel:', await get('/sentinel'));

const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await fetch(`${SINK}/__items`).then(r => r.json());
  if (items.some(i => i.type === 'event' && i.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}
await new Promise(r => setTimeout(r, 7500));
items = await fetch(`${SINK}/__items`).then(r => r.json());
const recorded = await fetch(`${SINK}/__rec`).then(r => r.json());
console.log(JSON.stringify({ items, rec: recorded }, null, 1));
