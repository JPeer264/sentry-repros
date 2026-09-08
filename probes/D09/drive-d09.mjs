// usage: node drive-d09.mjs <appPort> <sinkPort> [bodyBytes]
// POSTs a JSON body to /ok and to the throwing /throw route, then a sentinel, waits for
// the sentinel to reach the sink and dumps the sink items as JSON on stdout.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const bodyBytes = Number(process.argv[4] || 0);

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

const body = bodyBytes
  ? JSON.stringify({ big: 'x'.repeat(bodyBytes) })
  : JSON.stringify({ user: 'alice', password: 'hunter2', n: 1 });

process.stderr.write(`body bytes: ${Buffer.byteLength(body)}\n`);

await fetch(`${sink}/__items`, { method: 'DELETE' });

const post = path =>
  fetch(`${app}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }).then(r => `${path} -> ${r.status}`);

process.stderr.write((await post('/ok')) + '\n');
process.stderr.write((await post('/throw')) + '\n');

await fetch(`${app}/sentinel`).then(r => r.text());

let items = [];
for (let i = 0; i < 120; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

// One more poll round so spans flushed alongside the sentinel are included.
await new Promise(r => setTimeout(r, 1500));
items = await fetch(`${sink}/__items`).then(r => r.json());

process.stdout.write(JSON.stringify(items, null, 1));
