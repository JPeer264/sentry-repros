// Drives the app from a plain node process (no Sentry in it, so no sampling
// interference), then waits for the sentinel and prints the sink items.
const [appPort, sinkPort] = process.argv.slice(2).map(Number);
const nodePort = appPort + 1;
const body = JSON.stringify({ hello: 'world' });
const headers = { 'content-type': 'application/json' };

async function post(url, opts = {}) {
  try {
    const res = await fetch(url, { method: 'POST', headers, body, ...opts });
    return `${url} -> ${res.status}`;
  } catch (e) {
    return `${url} -> ${e.name}: ${e.message}`;
  }
}

async function items() {
  return (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
}

const log = [];
log.push(await post(`http://127.0.0.1:${appPort}/throw-read`));
log.push(await post(`http://127.0.0.1:${appPort}/throw`));
log.push(await post(`http://127.0.0.1:${appPort}/fetch-throw`));
log.push(await post(`http://127.0.0.1:${nodePort}/node-throw`));
log.push(await post(`http://127.0.0.1:${appPort}/sentinel`));

const deadline = Date.now() + 20000;
while (Date.now() < deadline) {
  if ((await items()).some(i => i.type === 'event' && i.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}

// the node:http transaction is emitted after the sentinel
await new Promise(r => setTimeout(r, 5000));

console.error(log.join('\n'));
console.log(JSON.stringify(await items(), null, 0).replaceAll('},{', '}\n{'));
