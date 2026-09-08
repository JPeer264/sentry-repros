const app = Number(process.argv[2]);
const sink = Number(process.argv[3]);

async function hit(path) {
  const res = await fetch(`http://127.0.0.1:${app}${path}`);
  const text = await res.text();
  console.log(path, res.status, text.trim().slice(0, 400));
}

await fetch(`http://127.0.0.1:${sink}/__items`, { method: 'DELETE' });

await hit('/hello');
await hit('/error');
await hit('/downstream');
await hit('/integrations');
await hit('/sentinel');

for (let i = 0; i < 40; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
console.log('--- sink ---');
for (const it of items) console.log(JSON.stringify(it));
