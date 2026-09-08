import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      sdk: payload.sdk?.name,
      runtime: payload.contexts?.runtime?.name,
      hasContextLine: !!ex?.stacktrace?.frames?.some(f => f.context_line),
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      user: payload.user,
      tags: payload.tags,
      request: payload.request ? { url: payload.request.url, method: payload.request.method } : null,
      release: payload.release,
      environment: payload.environment,
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
      sdk: payload.sdk?.name,
      request: payload.request ? { url: payload.request.url, method: payload.request.method } : null,
      tags: payload.tags,
      origin: payload.contexts?.trace?.origin,
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
    };
  }
  if (type === 'span') {
    const v = a => (a && typeof a === 'object' && 'value' in a ? a.value : a);
    return {
      type: 'span',
      items: (payload.items || []).map(s => {
        const a = s.attributes || {};
        return {
          name: s.name,
          op: v(a['sentry.op']),
          source: v(a['sentry.segment.name.source']) ?? v(a['sentry.source']),
          trace_id: s.trace_id ?? envHeader?.trace?.trace_id,
          segment: s.is_segment,
          status: s.status,
          method: v(a['http.request.method']),
          path: v(a['url.path']),
          code: v(a['http.response.status_code']),
          origin: v(a['sentry.origin']),
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
      // binary/length-based items may span lines, join by length
      let acc = payloadText; let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) { acc += '\n' + lines[j]; j++; }
      payloadText = acc; i = j;
    } else {
      i += 2;
    }
    try { payload = JSON.parse(payloadText); } catch { payload = {}; }
    raw.push({ envHeader, header, payload });
    items.push(JSON.parse(JSON.stringify(compact(type, payload, envHeader))));
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
}).listen(Number(process.env.PORT || 9999), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 9999));
