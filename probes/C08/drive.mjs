const appPort = process.argv[2] ?? '41517';
const sinkPort = process.argv[3] ?? '41417';
const base = `http://127.0.0.1:${appPort}`;

for (const path of ['/do-fetch', '/do-throw', '/do-rpc', '/do-rpc-throw']) {
  const res = await fetch(`${base}${path}`).catch(e => ({ status: 'fetch-error', text: async () => String(e) }));
  console.log(path, res.status, (await res.text()).slice(0, 200));
}

// the DO alarm was scheduled for now + 1s; give it time to fire and flush
await new Promise(r => setTimeout(r, 4000));

await fetch(`${base}/sentinel`);

let items = [];
for (let i = 0; i < 40; i++) {
  await new Promise(r => setTimeout(r, 500));
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
}

console.log(JSON.stringify(items, null, 1));
