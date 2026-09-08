const appPort = Number(process.argv[2] || 47313);
const recPort = Number(process.argv[3] || 47312);
const sinkPort = Number(process.argv[4] || process.env.SINK_PORT || 47311);

const app = p => `http://127.0.0.1:${appPort}${p}`;
const sinkItems = async () => (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();

await fetch(`http://127.0.0.1:${sinkPort}/__items`, { method: 'DELETE' });
await fetch(`http://127.0.0.1:${recPort}/__hits`, { method: 'DELETE' });

console.log('GET /users/42 ->', await (await fetch(app('/users/42'))).text());
console.log('GET /error ->', await (await fetch(app('/error'))).text());

const iso = await Promise.all([1, 2, 3].map(n => fetch(app(`/iso?n=${n}`)).then(r => r.text())));
console.log('GET /iso x3 ->', iso.join(' '));

console.log('GET /downstream ->', await (await fetch(app('/downstream'))).text());
try {
  console.log('GET /db ->', await (await fetch(app('/db'))).text());
} catch (e) {
  console.log('GET /db -> FAILED', e.message);
}
console.log('GET /log ->', await (await fetch(app('/log'))).text());

const traced = await fetch(app('/users/7'), {
  headers: {
    'sentry-trace': 'aabbccddeeff00112233445566778899-1122334455667788-1',
    baggage: 'sentry-environment=production,sentry-public_key=public,sentry-trace_id=aabbccddeeff00112233445566778899,sentry-sampled=true,sentry-sample_rate=1',
  },
});
console.log('GET /users/7 (incoming trace) ->', await traced.text());

await fetch(app('/sentinel'));
for (let i = 0; i < 100; i++) {
  const items = await sinkItems();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 200));
}
// logs and metrics flush on a timer
await new Promise(r => setTimeout(r, 7000));

console.log('--- SINK ---');
for (const it of await sinkItems()) console.log(JSON.stringify(it));
console.log('--- RECORDER ---');
console.log(await (await fetch(`http://127.0.0.1:${recPort}/__hits`)).text());
