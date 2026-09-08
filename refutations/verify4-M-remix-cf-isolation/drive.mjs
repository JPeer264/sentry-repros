const base = `http://127.0.0.1:${process.env.APP_PORT}`;
const sink = `http://127.0.0.1:${process.env.SINK_PORT || 47213}`;
await fetch(`${sink}/__items`, { method: 'DELETE' });
const r = await Promise.all(['alpha', 'bravo', 'charlie'].map(t => fetch(`${base}/tag/${t}`).then(x => x.text())));
console.log('tag responses:', r.join(' | '));
await new Promise(res => setTimeout(res, 300));
console.log('sentinel:', await (await fetch(`${base}/sentinel`)).text());
for (let i = 0; i < 60; i++) {
  const items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(it => it.message === 'sentinel')) break;
  await new Promise(res => setTimeout(res, 500));
}
const items = await (await fetch(`${sink}/__items`)).json();
for (const it of items) console.log(JSON.stringify(it));
