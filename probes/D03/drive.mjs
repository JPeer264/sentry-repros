// Drives 5 concurrent GET /a?tag=t1..t5, then a sentinel, waits for the sentinel
// to reach the sink and dumps the sink items as JSON on stdout.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

const tags = ['t1', 't2', 't3', 't4', 't5'];
const bodies = await Promise.all(
  tags.map(t => fetch(`${app}/a?tag=${t}`).then(r => r.text())),
);
process.stderr.write(`responses: ${JSON.stringify(bodies)}\n`);

await fetch(`${app}/sentinel?n=1`).then(r => r.text());

let items = [];
for (let i = 0; i < 120; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel 1')) break;
  await new Promise(r => setTimeout(r, 250));
}

// One more poll round so spans flushed alongside the sentinel are included.
await new Promise(r => setTimeout(r, 1000));
items = await fetch(`${sink}/__items`).then(r => r.json());

process.stdout.write(JSON.stringify(items, null, 1));
