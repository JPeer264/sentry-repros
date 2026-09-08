const [appPort, sinkPort] = process.argv.slice(2);
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (const n of [1, 2]) {
  const res = await fetch(`${app}/ai`);
  console.log(`GET /ai (${n}) -> ${res.status} ${await res.text()}`);
}

const injected = await fetch(`${app}/injected`);
console.log(`GET /injected -> ${await injected.text()}`);

await fetch(`${app}/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}
console.log(JSON.stringify(items, null, 1));
