const appPort = process.argv[2] || '41721';
const sinkPort = process.argv[3] || '41711';
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

await fetch(`${sink}/__items`, { method: 'DELETE' });

// 3s between requests so each send lands in its own consumer batch
console.error(await (await fetch(`${app}/send`)).text());
await sleep(3000);
console.error(await (await fetch(`${app}/send-bad`)).text());
await sleep(3000);
console.error(await (await fetch(`${app}/send-sentinel`)).text());

// wait until the sentinel message captured inside the queue handler has arrived
for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel-queue')) break;
  await sleep(1000);
}
await sleep(2000);

const items = await (await fetch(`${sink}/__items`)).json();
console.log(JSON.stringify(items, null, 1));
