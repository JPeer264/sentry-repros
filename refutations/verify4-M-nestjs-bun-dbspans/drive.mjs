const base = `http://127.0.0.1:${process.env.APP_PORT}`;
const sink = `http://127.0.0.1:${process.env.SINK_PORT}`;
const out = [];
for (const p of ['/users/7', '/db', '/db', '/sentinel']) {
  const r = await fetch(base + p);
  out.push([p, r.status, (await r.text()).slice(0, 120)]);
}
// wait for sentinel
for (let i = 0; i < 60; i++) {
  const items = await (await fetch(sink + '/__items')).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}
console.log(JSON.stringify(out, null, 2));
