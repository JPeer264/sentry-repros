const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const base = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

const first = await fetch(`${base}/db`);
console.log('/db (cold) ->', first.status, JSON.stringify(await first.json()));

await fetch(`${base}/sentinel`);
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 500));
  const items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
}

const second = await fetch(`${base}/db`);
console.log('/db (warm) ->', second.status, JSON.stringify(await second.json()));

await fetch(`${base}/sentinel`);
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 500));
  const items = await (await fetch(`${sink}/__items`)).json();
  if (items.filter(it => it.type === 'event' && it.message === 'sentinel').length >= 2) break;
}
await new Promise(r => setTimeout(r, 7000));

const items = await (await fetch(`${sink}/__items`)).json();
console.log('--- sink items ---');
for (const it of items) console.log(JSON.stringify(it));
