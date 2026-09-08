const [appPort, sinkPort] = process.argv.slice(2);
const base = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const get = (path, headers) => fetch(base + path, { headers }).then(r => r.text().then(t => ({ status: r.status, body: t })));

console.log('users', JSON.stringify(await get('/users/42')));
console.log('boom', JSON.stringify(await get('/boom')));
console.log('db', JSON.stringify(await get('/db')));
console.log('fetchout', JSON.stringify(await get('/fetchout')));
console.log('trace', JSON.stringify(await get('/users/7', {
  'sentry-trace': 'aabbccddeeff00112233445566778899-1122334455667788-1',
  baggage: 'sentry-trace_id=aabbccddeeff00112233445566778899,sentry-environment=production,sentry-public_key=public,sentry-sampled=true,sentry-sample_rate=1',
})));
console.log('iso', JSON.stringify(await Promise.all(['alpha', 'beta', 'gamma'].map(t => get(`/iso/${t}`)))));
console.log('log', JSON.stringify(await get('/log')));
console.log('sentinel', JSON.stringify(await get('/sentinel')));

for (let i = 0; i < 120; i++) {
  const items = await fetch(sink + '/__items').then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}
await new Promise(r => setTimeout(r, 8000));

const items = await fetch(sink + '/__items').then(r => r.json());
const rawItems = await fetch(sink + '/__items?raw=1').then(r => r.json());
console.log('== EVENTS ==');
for (const it of items.filter(i => i.type === 'event')) console.log(JSON.stringify(it));
console.log('== TRANSACTIONS ==');
for (const it of items.filter(i => i.type === 'transaction')) console.log(JSON.stringify(it));
console.log('== SPANS ==');
for (const it of items.filter(i => i.type === 'span')) console.log(JSON.stringify({ type: 'span', items: it.raw }));
console.log('== LOGS ==');
for (const it of items.filter(i => i.type === 'log')) console.log(JSON.stringify(it.items));
console.log('== OTHER ==');
console.log(JSON.stringify(items.filter(i => !['event', 'transaction', 'span', 'log'].includes(i.type)).map(i => i.type)));
console.log('== RECORDED OUTGOING FETCH ==');
console.log(JSON.stringify(await fetch(sink + '/__recorded').then(r => r.json())));
