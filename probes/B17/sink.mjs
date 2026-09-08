import { createServer } from 'node:http';
import { appendFileSync } from 'node:fs';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';

const items = [];
const raw = [];
const RAW = process.env.RAW;

function attrs(span) {
  const out = {};
  for (const [k, v] of Object.entries(span.attributes ?? {})) {
    out[k] = v && typeof v === 'object' && 'value' in v ? v.value : v;
  }
  return out;
}

function compact(type, payload) {
  if (type === 'event') {
    const ex = payload.exception?.values?.[0];
    return {
      type: 'event',
      message: payload.message ?? payload.logentry?.message,
      exception: ex ? ex.value : undefined,
      sdk: payload.sdk?.name,
      sdkVersion: payload.sdk?.version,
    };
  }
  if (type === 'transaction') {
    const spans = payload.spans || [];
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      spans: spans.map(s => `${s.op ?? ''} ${s.description ?? ''}`.trim()),
      dbSpans: spans
        .filter(s => s.op === 'db')
        .map(s => ({ op: s.op, description: s.description, data: s.data })),
    };
  }
  if (type === 'span') {
    const list = payload.items || [];
    return {
      type: 'span',
      items: list.map(s => {
        const a = attrs(s);
        return `${a['sentry.op'] ?? ''} ${s.name ?? ''}`.trim();
      }),
      dbSpans: list
        .filter(s => attrs(s)['sentry.op'] === 'db')
        .map(s => ({ name: s.name, attributes: attrs(s) })),
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
    if (RAW) appendFileSync(RAW, JSON.stringify({ header, payload }) + '\n');
    items.push(compact(type, payload));
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
