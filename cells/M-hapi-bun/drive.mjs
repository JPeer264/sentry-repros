const APP = `http://127.0.0.1:${process.env.APP_PORT}`;
const SINK = `http://127.0.0.1:${process.env.SINK_PORT}`;

const get = async (path, headers = {}) => {
  const r = await fetch(`${APP}${path}`, { headers });
  return `${path} -> ${r.status} ${(await r.text()).slice(0, 80)}`;
};

console.log(await get('/users/42'));
console.log(await get('/error'));
console.log(...(await Promise.all([get('/iso/alpha'), get('/iso/bravo'), get('/iso/charlie')])));
console.log(
  await get('/users/42', {
    'sentry-trace': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-1',
    baggage: 'sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,sentry-environment=production,sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1',
  }),
);
console.log(await get('/downstream'));
console.log(await get('/db'));
console.log(await get('/log'));
console.log(await get('/sentinel'));

for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`${SINK}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}
// logs are flushed on a timer
await new Promise(r => setTimeout(r, 7000));

const items = await (await fetch(`${SINK}/__items`)).json();
for (const it of items) console.log(JSON.stringify(it));
console.log('--- recorder hits ---');
for (const h of await (await fetch(`${SINK}/__hits`)).json()) console.log(JSON.stringify(h));
