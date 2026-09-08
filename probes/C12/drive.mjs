// usage: node drive.mjs <appBase> <sinkBase> <sessions|telemetry|flush>
const [appBase, sinkBase, phase] = process.argv.slice(2);

async function hit(path) {
  const res = await fetch(`${appBase}${path}`).catch(e => ({ status: 'ERR', text: async () => String(e) }));
  const body = await res.text();
  console.log(`GET ${path} -> ${res.status} ${body.trim()}`);
}

async function items() {
  return (await fetch(`${sinkBase}/__items`)).json();
}

async function waitForSentinel(name, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await items();
    if (list.some(i => i.type === 'event' && i.message === name)) return list;
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`TIMEOUT waiting for ${name}`);
  return items();
}

if (phase === 'sessions') {
  await hit('/ok');
  await hit('/ok');
  await hit('/error');
  await hit('/sentinel?n=1');
  const list = await waitForSentinel('sentinel 1');
  console.log(JSON.stringify(list, null, 0));
  console.log('session-ish items:', JSON.stringify(list.filter(i => i.type === 'session' || i.type === 'sessions')));
} else if (phase === 'telemetry') {
  await hit('/telemetry');
  for (let i = 0; i < 4; i++) {
    await new Promise(r => setTimeout(r, 2000));
    await hit('/ok');
    console.log(`t+${(i + 1) * 2}s types: ${JSON.stringify((await items()).map(x => x.type))}`);
  }
  await hit('/sentinel?n=2');
  const list = await waitForSentinel('sentinel 2');
  console.log(JSON.stringify(list, null, 0));
} else if (phase === 'flush') {
  await hit('/telemetry');
  await hit('/flush');
  await hit('/sentinel?n=3');
  const list = await waitForSentinel('sentinel 3');
  console.log(JSON.stringify(list.map(i => i.type)));
  console.log(JSON.stringify(list, null, 0));
} else {
  console.log('unknown phase', phase);
}
