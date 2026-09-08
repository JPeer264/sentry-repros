import http from 'node:http';
import zlib from 'node:zlib';

const PORT = Number(process.env.PORT || 47213);
const items = [];

function parseEnvelope(body) {
  const lines = body.split('\n');
  const out = [];
  let header;
  try { header = JSON.parse(lines[0]); } catch { header = {}; }
  for (let i = 1; i < lines.length; i += 2) {
    if (!lines[i]) continue;
    let ih, payload;
    try { ih = JSON.parse(lines[i]); } catch { continue; }
    try { payload = JSON.parse(lines[i + 1]); } catch { payload = lines[i + 1]; }
    out.push({ envHeader: header, itemHeader: ih, payload });
  }
  return out;
}

function compact(entry) {
  const { itemHeader, payload } = entry;
  const t = itemHeader.type;
  if (t === 'event') {
    return {
      type: payload.type === 'transaction' ? 'transaction' : 'event',
      name: payload.transaction,
      message: payload.message?.formatted ?? payload.message,
      exception: payload.exception?.values?.[0]?.value,
      tags: payload.tags,
      url: payload.request?.url,
      trace: payload.contexts?.trace?.trace_id,
      spanId: payload.contexts?.trace?.span_id,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      spans: (payload.spans || []).map(s => `${s.op || ''} ${s.description || ''}`.trim()),
    };
  }
  if (t === 'transaction') {
    return {
      type: 'transaction', name: payload.transaction, tags: payload.tags,
      url: payload.request?.url, trace: payload.contexts?.trace?.trace_id,
      op: payload.contexts?.trace?.op, source: payload.transaction_info?.source,
      status: payload.contexts?.trace?.status,
      spans: (payload.spans || []).map(s => `${s.op || ''} ${s.description || ''}`.trim()),
    };
  }
  if (t === 'span') {
    const arr = Array.isArray(payload.items) ? payload.items : [payload];
    return { type: 'span', items: arr.map(s => ({ name: s.name, trace: s.trace_id, tags: undefined, attrs: Object.fromEntries(Object.entries(s.attributes || {}).filter(([k]) => k.startsWith('probe') || k === 'url.full' || k === 'sentry.op')) })) };
  }
  return { type: t };
}

const server = http.createServer((req, res) => {
  if (req.url === '/__items' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(items.map(compact)));
    return;
  }
  if (req.url === '/__raw' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(items));
    return;
  }
  if (req.url === '/__items' && req.method === 'DELETE') {
    items.length = 0;
    res.writeHead(200); res.end('ok'); return;
  }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let buf = Buffer.concat(chunks);
    const enc = req.headers['content-encoding'];
    try {
      if (enc === 'gzip') buf = zlib.gunzipSync(buf);
      else if (enc === 'deflate') buf = zlib.inflateSync(buf);
      else if (enc === 'br') buf = zlib.brotliDecompressSync(buf);
    } catch {}
    for (const e of parseEnvelope(buf.toString('utf8'))) items.push(e);
    res.writeHead(200, { 'access-control-allow-origin': '*' });
    res.end('{}');
  });
});
server.listen(PORT, '127.0.0.1', () => console.log('recorder on ' + PORT));
