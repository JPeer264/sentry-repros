// Drives the Worker from a plain node process (no Sentry), then waits for the sentinel event.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);

async function hit(path) {
  const res = await fetch(`http://127.0.0.1:${appPort}${path}`);
  const body = await res.text();
  console.log(path, res.status, body.slice(0, 120));
}

await hit('/user/42');
await hit('/error');
await hit('/downstream');
await hit('/sentinel');

for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && JSON.stringify(it).includes('sentinel'))) {
    console.log(JSON.stringify(items, null, 0));
    process.exit(0);
  }
  await new Promise(r => setTimeout(r, 500));
}
console.log('SENTINEL NEVER ARRIVED');
process.exit(1);
