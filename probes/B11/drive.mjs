// Drives the app from a plain node process so no outgoing sentry-trace header
// marks the server-side transactions as unsampled.
const [bunPort, expressPort, sinkPort] = process.argv.slice(2);

const get = async (url) => {
  try {
    const res = await fetch(url);
    console.log(url, res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.log(url, 'FETCH ERROR', e.message);
  }
};

await get(`http://127.0.0.1:${bunPort}/injected`);
await get(`http://127.0.0.1:${bunPort}/hello/world`);
await get(`http://127.0.0.1:${bunPort}/error`);
await get(`http://127.0.0.1:${expressPort}/users/1`);
await get(`http://127.0.0.1:${expressPort}/boom`);
await get(`http://127.0.0.1:${bunPort}/sentinel`);

const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await fetch(`http://127.0.0.1:${sinkPort}/__items`).then((r) => r.json());
  const gotEvent = items.some((i) => i.type === 'event' && i.message === 'sentinel');
  const gotSpan = items.some(
    (i) => (i.type === 'span' && i.items.some((s) => s.includes('/sentinel'))) ||
      (i.type === 'transaction' && String(i.name).includes('/sentinel')),
  );
  if (gotEvent && gotSpan) break;
  await new Promise((r) => setTimeout(r, 250));
}
console.log('--- sink items ---');
for (const item of items) console.log(JSON.stringify(item));
