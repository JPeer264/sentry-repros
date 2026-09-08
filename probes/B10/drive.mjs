// Plain node driver: no Sentry in this process, so no sentry-trace header leaks
// into the app and marks its transactions unsampled.
const appPort = process.argv[2];
const sinkPort = process.argv[3];
const base = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const t0 = Date.now();
const full = await fetch(`${base}/stream`);
const body = await full.text();
console.log(`client: /stream full read took ${Date.now() - t0}ms, body=${JSON.stringify(body)}`);

const ac = new AbortController();
const t1 = Date.now();
const res = await fetch(`${base}/stream-cancel`, { signal: ac.signal });
const reader = res.body.getReader();
const first = await reader.read();
console.log(
  `client: /stream-cancel first chunk after ${Date.now() - t1}ms: ${JSON.stringify(
    new TextDecoder().decode(first.value),
  )}`,
);
ac.abort();
try {
  await reader.read();
  console.log('client: read after abort -> resolved');
} catch (e) {
  console.log(`client: read after abort -> ${e.name}`);
}

// Sentinel: everything the app sent before this has arrived once it shows up.
await fetch(`${base}/sentinel`);
let items = [];
for (let i = 0; i < 100; i++) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(x => x.type === 'event' && x.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 100));
}
for (const it of items) {
  if (it.type === 'transaction' && it.name === 'GET /sentinel') continue;
  console.log(JSON.stringify(it));
}
