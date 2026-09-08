const [appPort, sinkPort] = process.argv.slice(2);
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

await fetch(`${sink}/__items`, { method: 'DELETE' });

for (const path of ['/', '/api/hello', '/api/error']) {
  const res = await fetch(`${app}${path}`);
  const body = (await res.text()).slice(0, 120).replace(/\s+/g, ' ');
  console.log(`GET ${path} -> ${res.status} ${body}`);
}

await fetch(`${app}/api/sentinel`);

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}
console.log(JSON.stringify(items, null, 1));
