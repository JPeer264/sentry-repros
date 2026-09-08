import http from 'node:http';
const items = [];
function parseEnvelope(body) {
  const lines = body.split('\n').filter(Boolean);
  if (!lines.length) return;
  let header = {};
  try { header = JSON.parse(lines[0]); } catch { return; }
  for (let i = 1; i < lines.length; i += 2) {
    let ih, payload;
    try { ih = JSON.parse(lines[i]); } catch { continue; }
    try { payload = JSON.parse(lines[i + 1]); } catch { payload = undefined; }
    const type = ih.type;
    if (type === 'event') {
      items.push({
        kind: 'event',
        message: payload?.message?.formatted ?? payload?.message,
        exception: payload?.exception?.values?.[0]?.value,
        transaction: payload?.transaction,
        tags: payload?.tags,
        trace_id: payload?.contexts?.trace?.trace_id,
        span_id: payload?.contexts?.trace?.span_id,
        url: payload?.request?.url,
        sdk: payload?.sdk?.name + '@' + payload?.sdk?.version,
        runtime: payload?.contexts?.runtime?.name,
      });
    } else if (type === 'transaction') {
      items.push({
        kind: 'transaction',
        name: payload?.transaction,
        op: payload?.contexts?.trace?.op,
        source: payload?.transaction_info?.source,
        trace_id: payload?.contexts?.trace?.trace_id,
        tags: payload?.tags,
        url: payload?.request?.url,
        sdk: payload?.sdk?.name,
        spans: (payload?.spans || []).map(s => `${s.op} ${s.description}`),
      });
    } else if (type === 'span') {
      const arr = Array.isArray(payload?.items) ? payload.items : [payload];
      for (const s of arr) {
        items.push({ kind: 'span', name: s?.name, op: s?.attributes?.['sentry.op'], trace_id: s?.trace_id, seg: s?.is_segment, sdk: header?.sdk?.name });
      }
    } else {
      items.push({ kind: type, sdk: header?.sdk?.name });
    }
  }
}
http.createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(items, null, 1));
    return;
  }
  let b = '';
  req.on('data', c => (b += c));
  req.on('end', () => { parseEnvelope(b); res.writeHead(200); res.end('{}'); });
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('sink on', process.env.PORT));
