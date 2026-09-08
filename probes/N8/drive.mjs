// usage: node drive.mjs <appPort> <sinkPort> <sentinelCount>
const [appPort, sinkPort, nSentinel] = process.argv.slice(2);
const app = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const get = async p => {
  const r = await fetch(app + p);
  return `${p} -> ${r.status} ${(await r.text()).slice(0, 200)}`;
};

await fetch(sink + '/__items', { method: 'DELETE' });

console.log(await get('/ok'));
console.log(await get('/db'));

const tagged = await Promise.all(
  Array.from({ length: 10 }, (_, i) => get(`/tag?id=r${i}`)),
);
tagged.forEach(l => console.log(l));

for (let i = 0; i < 3; i++) console.log(await get('/boom'));

for (let i = 0; i < Number(nSentinel); i++) console.log(await get('/sentinel'));

// wait until at least one sentinel event has landed, then settle
const deadline = Date.now() + 20000;
let items = [];
while (Date.now() < deadline) {
  items = await (await fetch(sink + '/__items')).json();
  if (items.some(i => i.type === 'event' && String(i.message).startsWith('sentinel:'))) break;
  await new Promise(r => setTimeout(r, 250));
}
await new Promise(r => setTimeout(r, 2000));
items = await (await fetch(sink + '/__items')).json();

const counts = {};
for (const i of items) counts[i.type] = (counts[i.type] ?? 0) + 1;
const spanLines = items.filter(i => i.type === 'span').flatMap(i => i.items);
const events = items.filter(i => i.type === 'event');
const taggedEvents = events.filter(e => String(e.message).startsWith('tagged:'));
const matching = taggedEvents.filter(e => e.tags?.req && e.message === `tagged:${e.tags.req}`);

console.log('\ncounts ->', Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', '));
console.log('span envelope items ->', spanLines.length);
console.log(`tagged events=${taggedEvents.length} matching=${matching.length}`);
console.log('\n--- span lines (deduped with count) ---');
const tally = new Map();
for (const l of spanLines) tally.set(l.replace(/\[trace=[0-9a-f]+\]/, '[trace=*]'), (tally.get(l.replace(/\[trace=[0-9a-f]+\]/, '[trace=*]')) ?? 0) + 1);
for (const [l, c] of tally) console.log(`  ${String(c).padStart(3)} ${l}`);
console.log('\n--- events ---');
const etally = new Map();
for (const e of events) {
  const k = `${e.message} | ${JSON.stringify(e.tags ?? {})}`;
  etally.set(k, (etally.get(k) ?? 0) + 1);
}
for (const [k, c] of [...etally].sort()) console.log(`  ${String(c).padStart(3)} ${k}`);
console.log('\n--- sample raw items ---');
console.log(JSON.stringify(items.find(i => i.type === 'span' && i.items.some(s => s.startsWith('db ')))));
console.log(JSON.stringify(events.find(e => String(e.message).startsWith('tagged:'))));
