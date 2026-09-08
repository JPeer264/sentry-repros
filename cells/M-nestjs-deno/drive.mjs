const SINK = `http://127.0.0.1:${process.env.SINK_PORT || 44822}`;
const REC = `http://127.0.0.1:${process.env.REC_PORT || 44823}`;
const APP = `http://127.0.0.1:${process.env.APP_PORT || 44821}`;

const get = (path, headers) => fetch(`${APP}${path}`, { headers }).then(r => r.text().then(t => [r.status, t]));

await fetch(`${SINK}/__items`, { method: 'DELETE' });

console.error('users:', await get('/users/42'));
console.error('error:', await get('/error'));
console.error('downstream:', await get('/downstream'));
console.error('db:', await get('/db'));
console.error('log:', await get('/log'));
const TID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
console.error('traced:', await get('/users/7', {
  'sentry-trace': `${TID}-bbbbbbbbbbbbbbbb-1`,
  baggage: `sentry-trace_id=${TID},sentry-environment=probe,sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1`,
}));
console.error('iso:', await Promise.all([get('/iso?tag=alpha'), get('/iso?tag=beta'), get('/iso?tag=gamma')]));
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
const seen = await fetch(`${REC}/__seen`).then(r => r.json());
console.log(JSON.stringify({ items, rec: seen }, null, 1));
