import http from 'node:http';
const items = [];
const port = Number(process.env.PORT);
function parse(body) {
  const lines = body.split('\n');
  const header = JSON.parse(lines[0] || '{}');
  for (let i = 1; i < lines.length; i += 2) {
    if (!lines[i]) continue;
    let it, payload;
    try { it = JSON.parse(lines[i]); } catch { continue; }
    try { payload = JSON.parse(lines[i + 1] || '{}'); } catch { payload = {}; }
    const type = it.type;
    if (type === 'event') {
      items.push({
        type: 'event',
        message: payload.message || payload.exception?.values?.[0]?.value,
        tags: payload.tags,
        trace: payload.contexts?.trace?.trace_id || header.trace?.trace_id,
      });
    } else if (type === 'transaction') {
      items.push({ type: 'transaction', name: payload.transaction, tags: payload.tags, trace: payload.contexts?.trace?.trace_id });
    } else if (type === 'span') {
      for (const s of payload.items || []) {
        items.push({ type: 'span', name: s.name, trace: s.trace_id, attrs: Object.fromEntries(Object.entries(s.attributes || {}).filter(([k]) => k.startsWith('probe') || k === 'sentry.op')) });
      }
    } else {
      items.push({ type });
    }
  }
}
http.createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(items));
    return;
  }
  let b = '';
  req.on('data', c => (b += c));
  req.on('end', () => { try { parse(b); } catch (e) { console.error('parse', e); } res.end('{}'); });
}).listen(port, () => console.log('sink ready ' + port));
