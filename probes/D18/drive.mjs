// usage: node drive.mjs <app-port> <sink-port>
const [appPort, sinkPort] = process.argv.slice(2);

const db = await fetch(`http://127.0.0.1:${appPort}/db`);
console.log(`GET /db -> ${db.status} ${await db.text()}`);
const orch = await fetch(`http://127.0.0.1:${appPort}/orch`);
console.log(`GET /orch -> ${await orch.text()}`);
await fetch(`http://127.0.0.1:${appPort}/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}
console.log('SINK:');
for (const it of items) console.log(JSON.stringify(it));
