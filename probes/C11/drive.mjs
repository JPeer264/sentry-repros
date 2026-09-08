const appPort = process.argv[2];
const sinkPort = process.argv[3];
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (const path of ['/env', '/opts', '/hello', '/error', '/sentinel']) {
  const res = await fetch(app + path).catch(e => ({ status: 'ERR ' + e.message, text: async () => '' }));
  console.log(`GET ${path} -> ${res.status}`);
}

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}

console.log('--- sink items ---');
for (const it of items) console.log(JSON.stringify(it));
