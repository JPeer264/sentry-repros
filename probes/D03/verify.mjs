// Renders the sink dump written by drive.mjs into the evidence lines for D03.
import { readFileSync } from 'node:fs';

const items = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const boomEvents = items.filter(i => i.type === 'event' && /^Error: boom /.test(i.exception ?? ''));
const serverSpans = items
  .flatMap(i => (i.type === 'span' ? i.items : []))
  .filter(s => s.op === 'http.server' && (s.url ?? '').includes('/a?tag='));

let allTagsOwn = boomEvents.length > 0;
for (const e of boomEvents.sort((a, b) => (a.exception < b.exception ? -1 : 1))) {
  const own = e.exception.replace('Error: boom ', '');
  const tagKeys = Object.keys(e.tags ?? {});
  const ok = tagKeys.length === 1 && e.tags.reqtag === own && (e.request?.url ?? '').endsWith(`tag=${own}`);
  if (!ok) allTagsOwn = false;
  console.log(
    `event "boom ${own}" tags=${JSON.stringify(e.tags)} trace=${e.trace_id} url=${e.request?.url} transaction=${e.transaction ?? '<none>'} ${ok ? 'OK' : 'LEAK'}`,
  );
}

for (const s of serverSpans.sort((a, b) => (a.url < b.url ? -1 : 1))) {
  console.log(`server "${s.name}" trace=${s.trace_id} url=${s.url} reqtag=${s.tagAttrs?.reqtag}`);
}

const distinct = new Set(serverSpans.map(s => s.trace_id));
const serverTraceIds = new Set(serverSpans.map(s => s.trace_id));
const subset = boomEvents.every(e => serverTraceIds.has(e.trace_id));

console.log(
  `summary: boomEvents=${boomEvents.length} allTagsOwn=${allTagsOwn} serverSpansForA=${serverSpans.length} distinctTraceIds=${distinct.size} eventTraceIdsSubsetOfServer=${subset}`,
);
