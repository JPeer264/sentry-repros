const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const base = `http://127.0.0.1:${appPort}`;

await fetch(`http://127.0.0.1:${sinkPort}/__items`, { method: 'DELETE' });

const ai = await fetch(`${base}/ai`);
console.log(JSON.stringify({ route: '/ai', status: ai.status, body: await ai.json() }));

await fetch(`${base}/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 500));
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
}

console.log('--- sink items ---');
for (const it of items) console.log(JSON.stringify(it));
