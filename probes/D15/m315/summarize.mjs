// Prints one trimmed line per sink item: span envelopes keep only the db/http
// attributes the probe asserts on, events keep message, sdk and runtime.
import { readFileSync } from 'node:fs';

const KEEP = new Set([
  'sentry.origin', 'sentry.op', 'db.system.name', 'db.query.text', 'db.query.summary',
  'db.operation.name', 'db.namespace', 'server.address', 'server.port', 'url.path',
  'http.response.status_code',
]);

for (const item of JSON.parse(readFileSync(process.argv[2], 'utf8'))) {
  if (item.type === 'span') {
    const items = item.items.map(s => ({
      span: s.span,
      attrs: Object.fromEntries(Object.entries(s.attrs).filter(([k]) => KEEP.has(k))),
    }));
    console.log(JSON.stringify({ type: 'span', items }));
  } else if (item.type === 'event') {
    console.log(JSON.stringify({
      type: 'event', message: item.message, exception: item.exception,
      mechanism: item.mechanism, sdk: item.sdk, runtime: item.runtime,
    }));
  } else {
    console.log(JSON.stringify(item));
  }
}
