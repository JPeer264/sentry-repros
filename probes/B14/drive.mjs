// Plain node driver: hits the app from outside the Sentry-initialized process,
// then waits for the sentinel event to land in the sink.
const port = process.env.PORT || '41874';
const sinkPort = process.env.SINK_PORT || '9999';
const base = `http://127.0.0.1:${port}`;
const sink = `http://127.0.0.1:${sinkPort}`;

async function waitForApp() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${base}/cats/1`);
      await r.text();
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

if (!(await waitForApp())) {
  console.log('app never came up');
  process.exit(1);
}

for (const path of ['/cats/42', '/boom', '/sentinel']) {
  try {
    const res = await fetch(`${base}${path}`);
    const body = await res.text();
    console.log(`${path} -> ${res.status} ${body.slice(0, 80)}`);
  } catch (e) {
    console.log(`${path} -> request failed: ${e.message}`);
  }
}

// The sentinel is only "arrived" once both its event and its own request span/transaction
// are in the sink; everything sent before it has then arrived too.
let items = [];
for (let i = 0; i < 60; i++) {
  const res = await fetch(`${sink}/__items`);
  items = await res.json();
  const gotEvent = items.some(it => it.type === 'event' && it.message === 'sentinel');
  const gotSpan = items.some(
    it =>
      (it.type === 'span' && it.items.some(s => s.includes('/sentinel'))) ||
      (it.type === 'transaction' && (it.name || '').includes('/sentinel')),
  );
  if (gotEvent && gotSpan) break;
  await new Promise(r => setTimeout(r, 500));
}

console.log('--- sink items ---');
for (const it of items) console.log(JSON.stringify(it));
