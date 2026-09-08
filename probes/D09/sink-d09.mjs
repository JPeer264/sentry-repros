// Envelope sink for D09. Keeps the request-body fields the base $REPRO/_toolbox/sink.mjs drops:
// event/transaction `request.data` (+ its length), and the `http.request.body.*` attributes
// on stream-lifecycle spans and on the static-lifecycle transaction's trace data.
import { createServer } from 'node:http';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];

function reqInfo(request) {
  if (!request) return undefined;
  const out = { method: request.method, url: request.url };
  if (request.data != null) {
    out.data = typeof request.data === 'string' ? request.data : JSON.stringify(request.data);
    out.dataLen = out.data.length;
  }
  out.hasHeaders = !!request.headers && Object.keys(request.headers).length > 0;
  return out;
}

function bodyAttrs(attrs = {}) {
  const out = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (!k.startsWith('http.request.body')) continue;
    out[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
  }
  return out;
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
      request: reqInfo(payload.request),
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      request: reqInfo(payload.request),
      traceData: bodyAttrs(payload.contexts?.trace?.data),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      spans: (payload.items || []).map(s => {
        const a = s.attributes || {};
        const op = a['sentry.op']?.value ?? a['sentry.op'];
        return { name: `${op ?? ''} ${s.name ?? ''}`.trim(), bodyAttrs: bodyAttrs(a) };
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
}).listen(Number(process.env.PORT || 9999), '127.0.0.1', () => console.log('sink listening', process.env.PORT || 9999));
