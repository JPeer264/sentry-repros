import http from 'node:http';
const items = [];
const port = Number(process.env.PORT);
http.createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(items, null, 1));
    return;
  }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', c => body += c);
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{}');
    const lines = body.split('\n').filter(Boolean);
    let header = {};
    try { header = JSON.parse(lines[0]); } catch {}
    for (let i = 1; i < lines.length; i += 2) {
      let itemHeader, payload;
      try { itemHeader = JSON.parse(lines[i]); payload = JSON.parse(lines[i + 1]); } catch { continue; }
      const t = itemHeader.type;
      if (t === 'event') {
        items.push({ type: 'event', message: payload.message, exception: payload.exception?.values?.[0]?.value,
          mechanism: payload.exception?.values?.[0]?.mechanism?.type,
          tags: payload.tags, user: payload.user,
          trace_id: payload.contexts?.trace?.trace_id, span_id: payload.contexts?.trace?.span_id,
          url: payload.request?.url, transaction: payload.transaction });
      } else if (t === 'transaction') {
        items.push({ type: 'transaction', name: payload.transaction, op: payload.contexts?.trace?.op,
          tags: payload.tags, trace_id: payload.contexts?.trace?.trace_id,
          spans: (payload.spans || []).map(s => `${s.op || '-'} ${s.description}`) });
      } else if (t === 'span') {
        items.push({ type: 'span', items: (payload.items || []).map(s => `${s.attributes?.['sentry.op'] || '-'} ${s.name} trace=${s.trace_id}`) });
      } else if (t === 'log') {
        items.push({ type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body} trace=${l.trace_id}`) });
      } else {
        items.push({ type: t });
      }
    }
  });
}).listen(port, () => console.log('sink on ' + port));
