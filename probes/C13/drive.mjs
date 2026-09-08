const app = Number(process.argv[2]);
const sink = Number(process.argv[3]);
const label = process.argv[4] ?? '';

const body = JSON.stringify({ user: 'jan', secret: 'hunter2', n: 42 });

async function post(path) {
  const res = await fetch(`http://127.0.0.1:${app}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  console.log(label, path, res.status, (await res.text()).trim().slice(0, 80));
}

await fetch(`http://127.0.0.1:${sink}/__items`, { method: 'DELETE' });

await post('/throw');
await post('/ok');
await fetch(`http://127.0.0.1:${app}/sentinel`);

for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && (it.message === 'sentinel' || it.exception === 'sentinel'))) break;
  await new Promise(r => setTimeout(r, 250));
}

const items = await (await fetch(`http://127.0.0.1:${sink}/__items`)).json();
console.log(`--- sink ${label} ---`);
for (const it of items) console.log(JSON.stringify(it));
