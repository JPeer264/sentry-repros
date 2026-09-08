import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];

const t3 = t => (typeof t === 'number' ? t.toFixed(3) : undefined);
const ms = (a, b) => (typeof a === 'number' && typeof b === 'number' ? Math.round((b - a) * 1000) : undefined);
const attr = (a, k) => (a && a[k] ? (a[k].value ?? a[k]) : undefined);

function compact(type, payload, envHeader, arrived) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      arrived,
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? `${ex.type}: ${ex.value}` : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      sdk: payload.sdk?.name,
      runtime: payload.contexts?.runtime?.name,
      hasContextLine: !!ex?.stacktrace?.frames?.some(f => f.context_line),
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      arrived,
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      trace_id: payload.contexts?.trace?.trace_id,
      span_id: payload.contexts?.trace?.span_id,
      parent_span_id: payload.contexts?.trace?.parent_span_id,
      start: t3(payload.start_timestamp),
      end: t3(payload.timestamp),
      duration_ms: ms(payload.start_timestamp, payload.timestamp),
      spans: (payload.spans || []).map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
      sdk: payload.sdk?.name,
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      arrived,
      trace_id: envHeader?.trace?.trace_id,
      items: (payload.items || []).map(s => ({
        name: s.name,
        op: attr(s.attributes, 'sentry.op'),
        segment: s.is_segment,
        trace_id: s.trace_id ?? envHeader?.trace?.trace_id,
        span_id: s.span_id,
        parent: s.parent_span_id,
        start: t3(s.start_timestamp),
        end: t3(s.end_timestamp),
        duration_ms: ms(s.start_timestamp, s.end_timestamp),
        status: s.status,
        http_status: attr(s.attributes, 'http.response.status_code'),
      })),
    };
  }
  if (type === 'log') {
    return { type: 'log', arrived, items: (payload.items || []).map(l => `${l.level}: ${l.body}`) };
  }
  return { type, arrived };
}

function parse(body) {
  const arrived = (Date.now() / 1000).toFixed(3);
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
    raw.push({ arrived, envHeader, header, payload });
    items.push(compact(type, payload, envHeader, arrived));
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
