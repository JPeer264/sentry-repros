// Plain node driver: fires 5 concurrent requests at the app, then a sentinel,
// waits for the sentinel event and prints the isolation verdict.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const label = process.argv[4] ?? 'run';

const base = `http://127.0.0.1:${appPort}`;
const sink = `http://127.0.0.1:${sinkPort}`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const readItems = async () => (await fetch(`${sink}/__items`)).json();

const tags = ['t1', 't2', 't3', 't4', 't5'];

const responses = await Promise.all(
  tags.map(async tag => (await fetch(`${base}/a?tag=${tag}`)).json()),
);
console.log(`[${label}] responses:`, JSON.stringify(responses));

await fetch(`${base}/sentinel`);

let items = [];
for (let i = 0; i < 100; i++) {
  items = await readItems();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await sleep(200);
}

// server spans for the sentinel request close after its response; give them a bounded window
for (let i = 0; i < 40; i++) {
  items = await readItems();
  const serverSpans = items.filter(it => it.type === 'span' && it.items?.some(s => s.op === 'http.server'));
  if (serverSpans.length >= 6) break;
  await sleep(200);
}

for (const it of items) console.log(JSON.stringify(it));

const errors = items.filter(it => it.type === 'event' && it.exception === 'a');
const errTags = errors.map(e => e.tags?.req).sort();
const eachExactlyOwnTag = errors.every(e => {
  const keys = Object.keys(e.tags ?? {});
  return keys.length === 1 && keys[0] === 'req' && e.request_url?.includes(`tag=${e.tags.req}`);
});
const errTraceIds = new Set(errors.map(e => e.trace_id));

const serverSpanItems = items
  .filter(it => it.type === 'span')
  .flatMap(it => it.items)
  .filter(s => s.op === 'http.server');
const aSpans = serverSpanItems.filter(s => (s.url ?? '').includes('/a?tag='));
const spanTraceIds = new Set(aSpans.map(s => s.trace_id));

console.log(`VERDICT errors: ${errors.length} tags: ${JSON.stringify(errTags)} eachExactlyOwnTag: ${eachExactlyOwnTag}`);
console.log(
  `VERDICT http.server spans total: ${serverSpanItems.length} distinct error trace ids: ${errTraceIds.size} server spans matching /a: ${aSpans.length}`,
);
console.log(
  `VERDICT server span trace ids cover error trace ids: ${[...errTraceIds].every(id => spanTraceIds.has(id))}`,
);
