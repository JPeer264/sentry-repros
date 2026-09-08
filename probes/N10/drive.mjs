const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });
const err = await fetch(`http://127.0.0.1:${appPort}/error`).catch(e => ({ status: 'fetch failed: ' + e.message }));
console.log('GET /error ->', err.status);
await fetch(`http://127.0.0.1:${appPort}/sentinel`).then(r => r.text());

let items = [];
for (let i = 0; i < 60; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && (it.message === 'sentinel' || it.exception?.includes('sentinel')))) break;
  await new Promise(r => setTimeout(r, 500));
}
for (const it of items) console.log(JSON.stringify(it));
