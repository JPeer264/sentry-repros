import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];

function attr(a, key) {
  const v = a?.[key];
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
}

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechs: (payload.exception?.values || []).map(v => `${v.type}:${v.mechanism?.type}/handled=${v.mechanism?.handled}`),
      sdk: payload.sdk?.name,
      trace_id: payload.contexts?.trace?.trace_id,
      parent_span_id: payload.contexts?.trace?.parent_span_id,
      transaction: payload.transaction,
      tags: payload.tags,
      runtime: payload.contexts?.runtime,
      hasContextLine: !!ex?.stacktrace?.frames?.some(f => f.context_line),
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      trace_id: payload.contexts?.trace?.trace_id,
      parent_span_id: payload.contexts?.trace?.parent_span_id,
      route: payload.contexts?.trace?.data?.['http.route'],
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      trace_id: envHeader?.trace?.trace_id,
      items: (payload.items || []).map(s => {
        const a = s.attributes || {};
        return `${attr(a, 'sentry.op') ?? ''} ${s.name ?? ''}`.trim();
      }),
      raw: (payload.items || []).map(s => {
        const a = s.attributes || {};
        return {
          name: s.name,
          trace_id: s.trace_id,
          parent_span_id: s.parent_span_id,
          is_segment: s.is_segment,
          op: attr(a, 'sentry.op'),
          origin: attr(a, 'sentry.origin'),
          source: attr(a, 'sentry.source'),
          segment_source: attr(a, 'sentry.segment.name.source'),
          http_route: attr(a, 'http.route'),
          param_id: attr(a, 'url.path.parameter.id') ?? attr(a, 'params.id'),
          db_query: attr(a, 'db.query.text') ?? attr(a, 'db.statement'),
        };
      }),
    };
  }
  if (type === 'log') {
    return { type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  return { type };
}

function parse(body) {
  const lines = body.split('\n');
  let envHeader = {};
  try { envHeader = JSON.parse(lines[0] || '{}'); } catch {}
  let i = 1;
  while (i < lines.length) {
    if (!lines[i].trim()) { i++; continue; }
    let header;
    try { header = JSON.parse(lines[i]); } catch { i++; continue; }
    const type = header.type;
    let payloadText = lines[i + 1] ?? '';
    let payload = {};
    if (header.length != null) {
      let acc = payloadText; let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) { acc += '\n' + lines[j]; j++; }
      payloadText = acc; i = j;
    } else {
      i += 2;
    }
    try { payload = JSON.parse(payloadText); } catch { payload = {}; }
    raw.push({ envHeader, header, payload });
    items.push(compact(type, payload, envHeader));
  }
}

createServer((req, res) => {
  if (req.url?.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; raw.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(req.url.includes('raw') ? raw : items));
    return;
  }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let buf = Buffer.concat(chunks);
    const enc = req.headers['content-encoding'];
    try {
      if (enc === 'gzip') buf = gunzipSync(buf);
      else if (enc === 'deflate') buf = inflateSync(buf);
      else if (enc === 'br') buf = brotliDecompressSync(buf);
    } catch {}
    try { parse(buf.toString('utf8')); } catch (e) { console.error('parse error', e); }
    res.statusCode = 200;
    res.setHeader('access-control-allow-origin', '*');
    res.end('{}');
  });
}).listen(Number(process.env.PORT || 41711), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 41711));
