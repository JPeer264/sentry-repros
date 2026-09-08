import http from 'node:http';
import zlib from 'node:zlib';
const items = [];
function parse(body) {
  const lines = body.split('\n');
  let header;
  try { header = JSON.parse(lines[0]); } catch { header = {}; }
  for (let i = 1; i < lines.length; i += 2) {
    let it; try { it = JSON.parse(lines[i]); } catch { continue; }
    let payload; try { payload = JSON.parse(lines[i + 1]); } catch { payload = null; }
    if (!payload) continue;
    const type = it.type;
    if (type === 'event') {
      items.push({ type: 'event', message: payload.message, exception: payload.exception?.values?.[0]?.value,
        tags: payload.tags, user: payload.user?.id, transaction: payload.transaction,
        traceId: payload.contexts?.trace?.trace_id });
    } else if (type === 'transaction') {
      items.push({ type: 'transaction', name: payload.transaction, op: payload.contexts?.trace?.op,
        source: payload.transaction_info?.source, tags: payload.tags, traceId: payload.contexts?.trace?.trace_id,
        spans: (payload.spans || []).map(s => `${s.op} ${s.description}`) });
    } else if (type === 'span') {
      items.push({ type: 'span', items: (payload.items || []).map(s => `${s.attributes?.['sentry.op']?.value} ${s.name}`), traceId: payload.items?.[0]?.trace_id });
    } else { items.push({ type }); }
  }
}
http.createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(items, null, 0)); return;
  }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    let buf = Buffer.concat(chunks);
    const enc = req.headers['content-encoding'];
    try { if (enc === 'gzip') buf = zlib.gunzipSync(buf); else if (enc === 'deflate') buf = zlib.inflateSync(buf); } catch {}
    try { parse(buf.toString('utf8')); } catch (e) { console.error('parse fail', e.message); }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{}');
  });
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('sink on', process.env.PORT));
