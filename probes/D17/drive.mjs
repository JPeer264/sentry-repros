// usage: node drive.mjs <appPort> <sinkPort>
const [appPort, sinkPort] = process.argv.slice(2);
const sink = `http://127.0.0.1:${sinkPort}`;

async function hit(path) {
  try {
    const res = await fetch(`http://127.0.0.1:${appPort}${path}`);
    console.log(`${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  } catch (e) {
    console.log(`${path} -> ERR ${e.message}`);
  }
}

await fetch(`${sink}/__items`, { method: 'DELETE' });
await hit('/ai');
await hit('/sentinel');

const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(i => i.type === 'event' && (i.message === 'sentinel' || i.exception === 'sentinel'))) break;
  await new Promise(r => setTimeout(r, 300));
}
for (const i of items) console.log(JSON.stringify(i));
