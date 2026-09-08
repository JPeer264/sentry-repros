const appPort = process.argv[2];
const sinkPort = process.argv[3];
const base = `http://127.0.0.1:${appPort}`;

for (const path of ['/', '/app.js', '/api/hello', '/api/error', '/api/sentinel']) {
  const res = await fetch(base + path).catch(e => ({ status: 'ERR ' + e.message, text: () => '' }));
  console.log(path, res.status);
}

for (let i = 0; i < 40; i++) {
  const items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) {
    console.log(JSON.stringify(items, null, 0).replace(/},{/g, '}\n{'));
    process.exit(0);
  }
  await new Promise(r => setTimeout(r, 500));
}
console.log('sentinel never arrived');
console.log(await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).text());
