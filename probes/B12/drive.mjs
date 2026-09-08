const SINK = 'http://127.0.0.1:51811';
const APP = 'http://127.0.0.1:51812';

const tag = process.argv[2];
if (!tag) {
  console.error('usage: node drive.mjs <sentinel-tag>');
  process.exit(1);
}

await fetch(`${SINK}/__items`, { method: 'DELETE' });

await fetch(`${APP}/hello/world`).catch(() => {});
await fetch(`${APP}/error`).catch(() => {});
await fetch(`${APP}/sentinel/${tag}`).catch(() => {});

// The sentinel is both an event and the http.server span of the request that
// captured it; wait for both so nothing sent earlier is still in flight.
let items = [];
for (let i = 0; i < 150; i++) {
  await new Promise(r => setTimeout(r, 200));
  items = await (await fetch(`${SINK}/__items`)).json();
  const gotEvent = items.some(it => it.type === 'event' && (it.exception ?? '').includes(tag));
  const gotSpan = items.some(it => it.type === 'span' && it.items.some(s => s.includes('/sentinel/')));
  if (gotEvent && gotSpan) break;
}

for (const it of items) {
  if (it.type === 'event') {
    const value = (it.exception ?? it.message ?? '').replace(/^[A-Za-z]+: /, '');
    console.log(`event exception="${value}" mechanism=${it.mechanism} handled=${it.handled}`);
  } else if (it.type === 'span') {
    console.log(`span ${JSON.stringify(it.items)} trace=${it.trace_id}`);
  } else {
    console.log(it.type);
  }
}
