// Envelope sink, extended from $S/qs/sink.mjs to keep trace_id / span_id / parent_span_id.
import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];

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
      trace_id: payload.contexts?.trace?.trace_id,
    };
  }
  if (type === 'transaction') {
    const t = payload.contexts?.trace ?? {};
    return {
      type: 'transaction',
      name: payload.transaction,
      op: t.op,
      trace_id: t.trace_id,
      span_id: t.span_id,
      parent_span_id: t.parent_span_id,
      origin: t.origin ?? t.data?.['sentry.origin'],
      spans: (payload.spans || []).map(s => ({
        d: `${s.op ?? ''} ${s.description ?? ''}`.trim(),
        trace_id: s.trace_id,
        span_id: s.span_id,
        parent_span_id: s.parent_span_id,
      })),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      items: (payload.items || []).map(s => ({
        d: `${attr(s.attributes, 'sentry.op') ?? ''} ${s.name ?? ''}`.trim(),
        trace_id: s.trace_id ?? envHeader?.trace?.trace_id,
        span_id: s.span_id,
        parent_span_id: s.parent_span_id,
        segment: !!s.is_segment,
        origin: attr(s.attributes, 'sentry.origin'),
      })),
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
    let payloadText = lines[i + 1] ?? '';
    if (header.length != null) {
      let acc = payloadText; let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) { acc += '\n' + lines[j]; j++; }
      payloadText = acc; i = j;
    } else {
      i += 2;
    }
    let payload = {};
    try { payload = JSON.parse(payloadText); } catch {}
    items.push(compact(header.type, payload, envHeader));
  }
}

createServer((req, res) => {
  if (req.url?.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(items));
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
}).listen(Number(process.env.PORT || 9999), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 9999));
