const appPort = process.argv[2];
const sinkPort = process.argv[3];
const path = process.argv[4] ?? '/d1';

const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

const res = await fetch(`${app}${path}`);
console.error('app response', res.status, (await res.text()).slice(0, 200));

await fetch(`${app}/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}

console.log(JSON.stringify(items, null, 1));
