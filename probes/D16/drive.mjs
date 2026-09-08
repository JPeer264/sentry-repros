// Drives GET /db, /error, /log, then a sentinel; waits for the sentinel to reach the
// sink, waits out the log flush timer and dumps the sink items as JSON on stdout.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (const path of ['/db', '/error', '/log']) {
  const res = await fetch(`${app}${path}`);
  process.stderr.write(`${path} -> ${res.status} ${JSON.stringify(await res.text())}\n`);
}

await fetch(`${app}/sentinel?n=1`).then(r => r.text());

let items = [];
for (let i = 0; i < 120; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel 1')) break;
  await new Promise(r => setTimeout(r, 250));
}

// Logs are flushed on a timer, not with the sentinel.
for (let i = 0; i < 40; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'log')) break;
  await new Promise(r => setTimeout(r, 250));
}

const interesting = items.filter(
  it =>
    (it.type === 'transaction' && it.name === 'GET /db') ||
    (it.type === 'event' && it.exception) ||
    it.type === 'log',
);
for (const it of interesting) process.stderr.write(`${JSON.stringify(it)}\n`);

process.stdout.write(JSON.stringify(items, null, 1));
