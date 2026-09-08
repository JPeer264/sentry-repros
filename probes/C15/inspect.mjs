// Prints the trace/span correlation carried by the raw envelopes written by sink.mjs.
import { readFileSync } from 'node:fs';

const lines = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean);

for (const line of lines) {
  const { header, payload } = JSON.parse(line);
  if (header.type === 'span') {
    for (const s of payload.items || []) {
      const a = Object.fromEntries(Object.entries(s.attributes || {}).map(([k, v]) => [k, v?.value ?? v]));
      console.log(
        'SPAN',
        JSON.stringify({
          name: s.name,
          trace: s.trace_id,
          span: s.span_id,
          parent: s.parent_span_id,
          op: a['sentry.op'],
          status: s.status,
          route: a['http.route'],
          source: a['sentry.segment.name.source'] ?? a['sentry.source'],
          code: a['http.response.status_code'],
          origin: a['sentry.origin'],
        }),
      );
    }
  }
  if (header.type === 'event') {
    const ex = payload.exception?.values?.[0];
    console.log(
      'EVENT',
      JSON.stringify({
        value: ex?.value ?? payload.message,
        trace: payload.contexts?.trace?.trace_id,
        span: payload.contexts?.trace?.span_id,
        mechanism: ex?.mechanism,
        transaction: payload.transaction,
        request: payload.request ? { method: payload.request.method, url: payload.request.url } : undefined,
        sdk: `${payload.sdk?.name}@${payload.sdk?.version}`,
        integrations: payload.sdk?.integrations,
      }),
    );
  }
}
