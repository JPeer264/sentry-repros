const app = Number(process.argv[2]);
const sink = Number(process.argv[3]);
const label = process.argv[4] || 'run';

const A = `http://127.0.0.1:${app}`;
const K = `http://127.0.0.1:${sink}`;

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(`${A}/api/ok`); if (r.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

const ready = await waitReady();
if (!ready) { console.log('APP NOT READY'); process.exit(1); }

await fetch(`${K}/__items`, { method: 'DELETE' });

// warm-up request before the concurrent burst, to prove the burst is not just "first request wins"
await fetch(`${A}/api/iso?tag=warm`).then(r => r.json());

const tags = ['alpha', 'beta', 'gamma'];
const res = await Promise.all(tags.map(t => fetch(`${A}/api/iso?tag=${t}`).then(r => r.json())));
console.log(`[${label}] response trace ids:`, JSON.stringify(res));

// unrelated request after the burst, to catch a leaked tag
const after = await fetch(`${A}/api/iso?tag=after`).then(r => r.json());
console.log(`[${label}] after:`, JSON.stringify(after));

await fetch(`${A}/api/sentinel`);
for (let i = 0; i < 60; i++) {
  const items = await fetch(`${K}/__items`).then(r => r.json());
  if (items.some(x => x.type === 'event' && x.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 250));
}
const items = await fetch(`${K}/__items`).then(r => r.json());
for (const it of items) {
  if (it.type === 'event') console.log(JSON.stringify({ type: 'event', message: it.message, exception: it.exception, trace_id: it.trace_id, tags: it.tags }));
  else if (it.type === 'transaction') console.log(JSON.stringify({ type: 'transaction', name: it.name, op: it.op, source: it.source, trace_id: it.trace_id, spans: it.spans }));
  else if (it.type === 'span') console.log(JSON.stringify({ type: 'span', trace_id: it.trace_id, items: it.items }));
}
