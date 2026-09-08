// usage: node drive-serve-only.mjs <sinkPort> <servePort> <waitMs>
const [sinkPort, servePort, waitMs = '10000'] = process.argv.slice(2);
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
await hit('serve /sentinel', `http://127.0.0.1:${servePort}/sentinel`);

await new Promise(r => setTimeout(r, Number(waitMs)));
const items = await (await fetch(`${sink}/__items`)).json();
console.log(`waited ${waitMs}ms; session envelopes: ${items.filter(i => i.type === 'sessions').length}`);
console.log(JSON.stringify(items));
