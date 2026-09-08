const [appPort, sinkPort, downPort] = process.argv.slice(2);

const INCOMING_TRACE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab-bbbbbbbbbbbbbbbb-1';
const INCOMING_BAGGAGE =
  'sentry-trace_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab,sentry-environment=upstream-env,' +
  'sentry-release=upstream%402.0.0,sentry-public_key=public,sentry-sample_rate=1,' +
  'sentry-sampled=true,sentry-sample_rand=0.123456';

await fetch(`http://127.0.0.1:${sinkPort}/__items`, { method: 'DELETE' });
await fetch(`http://127.0.0.1:${downPort}/__seen`, { method: 'DELETE' });

const res = await fetch(`http://127.0.0.1:${appPort}/continue`, {
  headers: { 'sentry-trace': INCOMING_TRACE, baggage: INCOMING_BAGGAGE },
});
console.log('app /continue ->', res.status, await res.text());

const sres = await fetch(`http://127.0.0.1:${appPort}/sentinel`);
console.log('app /sentinel ->', sres.status, await sres.text());

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && (it.message === 'sentinel' || it.exception?.includes('sentinel')))) break;
  await new Promise(r => setTimeout(r, 500));
}

const seen = await (await fetch(`http://127.0.0.1:${downPort}/__seen`)).json();
console.log('downstream saw:', JSON.stringify(seen));
for (const it of items) console.log('sink:', JSON.stringify(it));
