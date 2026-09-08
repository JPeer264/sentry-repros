// usage: node drive.mjs <appPort> <sinkPort>
const [appPort, sinkPort] = process.argv.slice(2);
const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

async function hit(path) {
  const res = await fetch(`${app}${path}`);
  const body = (await res.text()).trim();
  console.log(`${path} ${res.status} ${body}`);
}

await fetch(`${sink}/__items`, { method: 'DELETE' });

await hit('/users/1');
await hit('/error');
await hit('/sentinel');

const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(i => i.type === 'event' && i.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}
for (const i of items) console.log(JSON.stringify(i));
