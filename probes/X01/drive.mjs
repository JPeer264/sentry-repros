const appPort = process.argv[2];
const sinkPort = process.argv[3];
const paths = ['/hello/world', '/error', '/sub/item/42', '/sub/boom', '/sentinel'];

for (const path of paths) {
  const res = await fetch(`http://127.0.0.1:${appPort}${path}`);
  await res.text();
  console.log(`${path} ${res.status} ${res.statusText}`);
}

let items = [];
for (let i = 0; i < 40; i++) {
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}

// Stream-lifecycle span envelopes are flushed on their own timer, after the sentinel event.
await new Promise(r => setTimeout(r, 8000));

items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
for (const item of items) console.log(JSON.stringify(item));
