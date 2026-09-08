const [appPort, sinkPort] = process.argv.slice(2);
const TAGS = ['t0', 't1', 't2', 't3', 't4'];

await fetch(`http://127.0.0.1:${sinkPort}/__items`, { method: 'DELETE' });

const responses = await Promise.all(
  TAGS.map(tag => fetch(`http://127.0.0.1:${appPort}/a?tag=${tag}`).then(r => r.text())),
);
console.log('app /a x5 ->', responses.join(' | '));

const sres = await fetch(`http://127.0.0.1:${appPort}/sentinel`);
console.log('app /sentinel ->', sres.status, await sres.text());

let items = [];
for (let i = 0; i < 60; i++) {
  items = await (await fetch(`http://127.0.0.1:${sinkPort}/__items`)).json();
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) break;
  await new Promise(r => setTimeout(r, 500));
}

const errors = items.filter(it => it.type === 'event' && it.exception?.startsWith('Error: boom '));
const sentinel = items.find(it => it.type === 'event' && it.message === 'sentinel');
const errorTraces = new Set(errors.map(e => e.trace_id));

const isolated =
  errors.length === TAGS.length &&
  errors.every(e => {
    const own = e.exception.slice('Error: boom '.length);
    const tags = e.tags || {};
    return tags.req === own && Object.keys(tags).length === 1 && e.user?.id === own;
  }) &&
  new Set(errors.map(e => e.tags?.req)).size === TAGS.length;

const httpServerForErrorTraces = [...errorTraces].filter(tid =>
  items.some(
    it => it.type === 'span' && it.trace_id === tid && (it.items || []).some(s => s.startsWith('http.server')),
  ),
).length;

const verdict = {
  isolated,
  sentinelClean: !!sentinel && !sentinel.tags?.req,
  errors: errors.length,
  distinctErrorTraces: errorTraces.size,
  httpServerForErrorTraces,
};

console.log('verdict', JSON.stringify(verdict));
for (const it of items) console.log('sink:', JSON.stringify(it));
