// Two GET /active requests, printing what the route saw, then a sentinel and a sink dump.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (let i = 0; i < 2; i++) {
  const body = await fetch(`${app}/active`).then(r => r.text());
  process.stderr.write(`GET /active -> ${body}\n`);
}

await fetch(`${app}/sentinel`).then(r => r.text());

let items = [];
for (let i = 0; i < 120; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

await new Promise(r => setTimeout(r, 2500));
items = await fetch(`${sink}/__items`).then(r => r.json());

process.stdout.write(JSON.stringify(items, null, 1));
