// GET /user/42, /error, /sentinel against the Oak app, waits for the sentinel event
// to reach the sink plus the 500 ms span-stream flush, and dumps the sink items.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (const path of ['/user/42', '/error', '/sentinel']) {
  const res = await fetch(`${app}${path}`);
  const body = await res.text();
  process.stderr.write(`${path} -> ${res.status} ${JSON.stringify(body)}\n`);
}

let items = [];
for (let i = 0; i < 120; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

await new Promise(r => setTimeout(r, 2500));
items = await fetch(`${sink}/__items`).then(r => r.json());

process.stdout.write(JSON.stringify(items, null, 1));
