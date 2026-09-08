// Renders a sink dump as the evidence lines of the D12 record.
import { readFileSync } from 'node:fs';

const items = JSON.parse(readFileSync(process.argv[2], 'utf8'));

let spanItemCount = 0;

for (const it of items) {
  if (it.type === 'event') {
    // A message event still carries a synthetic exception value when attachStacktrace is on,
    // and its type is undefined; render only the value in that case.
    const exc = it.exception?.startsWith('undefined: ') ? it.exception.slice(11) : it.exception;
    console.log(
      `event: ${it.message ?? ''} ${exc ?? ''} mechanism ${JSON.stringify(it.mechanism)} handled ${it.handled} trace ${it.trace_id} transaction ${it.transaction} request_url ${it.request?.url}`,
    );
  } else if (it.type === 'span') {
    const lines = it.raw.map(
      s =>
        `${s.op} ${s.name} | status=${s.status} trace=${s.trace_id} http.status=${s.http_status} url=${s.url} route=${s.route} source=${s.source} origin=${s.origin}`,
    );
    spanItemCount += it.raw.length;
    console.log(`span: ${JSON.stringify(lines)}`);
  } else {
    console.log(`${it.type}: ${JSON.stringify(it)}`);
  }
}

const events = items.filter(i => i.type === 'event');
console.log(
  `summary: events=${events.length} errorEvents=${events.filter(e => e.exception && !e.exception.startsWith('undefined: ')).length} spanItems=${spanItemCount}`,
);
