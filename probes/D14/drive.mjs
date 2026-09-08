// usage: node drive.mjs <app port> <sink port> <comma separated paths, or CONC>
// Drives the app from a plain node process (no Sentry), so no sentry-trace header
// from the driver marks the server transaction as unsampled.
const appPort = Number(process.argv[2]);
const sinkPort = Number(process.argv[3]);
const paths = (process.argv[4] || '/hello/world,/captured,/downstream,/downstream-fetch,/status-500,/nope,CONC').split(',');

const sink = `http://127.0.0.1:${sinkPort}`;
const app = `http://127.0.0.1:${appPort}`;

async function hit(path) {
  try {
    const res = await fetch(`${app}${path}`);
    const body = await res.text();
    return `${res.status} ${body.trim()}`;
  } catch (e) {
    return `FETCH FAILED ${e.cause?.code ?? e.message}`;
  }
}

await fetch(`${sink}/__items`, { method: 'DELETE' });

const responses = {};
for (const path of paths) {
  if (path === 'CONC') {
    const conc = await Promise.all(
      ['A', 'B', 'C'].map(id => hit(`/slow?id=${id}&ms=300`)),
    );
    responses.CONC = conc;
    continue;
  }
  responses[path] = await hit(path);
}

const sentinel = await hit('/sentinel');
responses['/sentinel'] = sentinel;

let items = [];
let sawSentinel = false;
for (let i = 0; i < 80; i++) {
  items = await fetch(`${sink}/__items`).then(r => r.json());
  if (items.some(it => it.type === 'event' && it.message === 'sentinel')) { sawSentinel = true; break; }
  await new Promise(r => setTimeout(r, 250));
}

// Logs and metrics flush on a timer; spans flushed alongside the sentinel land here too.
await new Promise(r => setTimeout(r, 7000));
items = await fetch(`${sink}/__items`).then(r => r.json());

const out = [];
out.push('RESPONSES');
out.push(JSON.stringify(responses, null, 1));
out.push(`sentinelEventArrived=${sawSentinel}`);
out.push('');
out.push('LINES');
for (const it of items) {
  if (it.type === 'span') {
    for (const s of it.raw) {
      out.push(
        `span: ${s.op} "${s.name}" seg=${s.is_segment} ${s.path ?? s.full ?? ''} code=${s.code} status=${s.status} ` +
          `trace=${s.trace_id} id=${s.span_id} parent=${s.parent_span_id} origin=${s.origin} nameSource=${s.segment_name_source}`,
      );
    }
  } else if (it.type === 'transaction') {
    out.push(
      `transaction: ${it.name} | source ${it.source} status ${it.status} code ${it.code} | trace ${it.trace_id} id ${it.span_id} parent ${it.parent_span_id} | spans ${JSON.stringify(it.spans)}`,
    );
  } else if (it.type === 'event') {
    out.push(
      `event: ${it.message ?? it.exception} | mech ${it.mechanism} handled ${it.handled} | txn ${it.transaction} | trace ${it.trace_id} span ${it.span_id} | tags ${JSON.stringify(it.tags)} user ${it.user?.id} | req ${it.request?.url}`,
    );
  } else if (it.type === 'log') {
    out.push(`log: ${JSON.stringify(it.items)}`);
  } else {
    out.push(`${it.type}`);
  }
}
out.push('');
out.push('SINK');
out.push(JSON.stringify(items, null, 1));

process.stdout.write(out.join('\n') + '\n');
