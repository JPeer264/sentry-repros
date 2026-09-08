// usage: node drive.mjs <sinkPort> <servePort> <httpPort> <catch|throw>
const [sinkPort, servePort, httpPort, mode = 'catch'] = process.argv.slice(2);
const sink = `http://127.0.0.1:${sinkPort}`;

async function hit(label, url) {
  try {
    const res = await fetch(url);
    await res.text();
    console.log(`${label} -> ${res.status}`);
  } catch (e) {
    console.log(`${label} -> ERR ${e.message}`);
  }
}

await fetch(`${sink}/__items`, { method: 'DELETE' });

await hit('serve /ok', `http://127.0.0.1:${servePort}/ok`);
await hit('serve /ok', `http://127.0.0.1:${servePort}/ok`);
await hit('serve /error', `http://127.0.0.1:${servePort}/error`);

await hit('http /ok', `http://127.0.0.1:${httpPort}/ok`);
await hit('http /ok', `http://127.0.0.1:${httpPort}/ok`);
const errPath = mode === 'throw' ? '/error-throw' : '/error-catch';
await hit(`http ${errPath}`, `http://127.0.0.1:${httpPort}${errPath}`);

await hit('serve /sentinel', `http://127.0.0.1:${servePort}/sentinel`);

const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await (await fetch(`${sink}/__items`)).json();
  if (items.some(i => i.type === 'sessions')) break;
  await new Promise(r => setTimeout(r, 500));
}
console.log(`session envelopes: ${items.filter(i => i.type === 'sessions').length}`);
for (const i of items) console.log(JSON.stringify(i));
