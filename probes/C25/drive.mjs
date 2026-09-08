const app = Number(process.argv[2] ?? 51234);
const sink = Number(process.argv[3] ?? 43917);

async function hit(path) {
  const res = await fetch(`http://127.0.0.1:${app}${path}`);
  console.log(path, res.status, (await res.text()).trim());
}

await fetch(`http://127.0.0.1:${sink}/__items`, { method: 'DELETE' });

await hit('/rpc');
await hit('/rpc-error');
await hit('/svc-fetch');
await hit('/sentinel');

for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
console.log('--- sink ---');
for (const it of items) console.log(JSON.stringify(it));
