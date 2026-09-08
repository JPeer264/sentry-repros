// _toolbox/qs/sink.mjs plus: trace/parent/source on span items, trace ids on events and logs,
// db attributes on transaction spans, and a /rec/* endpoint that records the propagation
// headers of incoming downstream requests.
import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];
const recorded = [];

function attr(a, k) {
  const v = a?.[k];
  return v && typeof v === 'object' && 'value' in v ? v.value : v;
}

function compact(type, payload, envHeader) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? ex.value : undefined,
      mechanism: ex?.mechanism?.type,
      handled: ex?.mechanism?.handled,
      tags: payload.tags,
      trace_id: payload.contexts?.trace?.trace_id,
      sdk: payload.sdk?.name,
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
      spans: (payload.spans || []).map(s => {
        const head = `${s.op ?? ''} ${s.description ?? ''}`.trim();
        const stmt = s.data?.['db.query.text'] ?? s.data?.['db.statement'];
        const sys = s.data?.['db.system.name'] ?? s.data?.['db.system'];
        return stmt ? `${head} :: ${JSON.stringify({ stmt, sys })}` : head;
      }),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      items: (payload.items || []).map(s => {
        const a = s.attributes || {};
        const op = attr(a, 'sentry.op');
        const src = attr(a, 'sentry.segment.name.source') ?? attr(a, 'sentry.source');
        return `${`${op ?? ''} ${s.name ?? ''}`.trim()} :: trace=${s.trace_id} parent=${s.parent_span_id ?? '-'} src=${src ?? '-'}`;
      }),
      spanIds: (payload.items || []).map(s => s.span_id),
    };
  }
  if (type === 'log') {
    return {
      type: 'log',
      items: (payload.items || []).map(l => `${l.level}: ${l.body} :: trace=${l.trace_id}`),
    };
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
      let acc = payloadText;
      let j = i + 2;
      while (Buffer.byteLength(acc) < header.length && j < lines.length) { acc += '\n' + lines[j]; j++; }
      payloadText = acc;
      i = j;
    } else {
      i += 2;
    }
    let payload = {};
    try { payload = JSON.parse(payloadText); } catch {}
    raw.push({ envHeader, header, payload });
    items.push(compact(header.type, payload, envHeader));
  }
}

createServer((req, res) => {
  if (req.url?.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; raw.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(req.url.includes('raw') ? raw : items));
    return;
  }
  if (req.url?.startsWith('/__recorded')) {
    if (req.method === 'DELETE') { recorded.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recorded));
    return;
  }
  if (req.url?.startsWith('/rec/')) {
    recorded.push({
      url: req.url,
      'sentry-trace': req.headers['sentry-trace'],
      baggage: req.headers['baggage'],
    });
    res.end('recorded');
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
