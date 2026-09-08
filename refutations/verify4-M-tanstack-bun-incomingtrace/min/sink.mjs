import http from 'node:http';
const items = [];
const port = Number(process.env.PORT || 41601);
http.createServer((req, res) => {
  if (req.url.startsWith('/__items')) {
    if (req.method === 'DELETE') { items.length = 0; res.end('[]'); return; }
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify(items, null, 2)); return;
  }
  let body = '';
  req.setEncoding('utf8');
  req.on('data', c => body += c);
  req.on('end', () => {
    const lines = body.split('\n').filter(Boolean);
    let header = {};
    try { header = JSON.parse(lines[0]); } catch {}
    for (let i = 1; i < lines.length; i += 2) {
      let it = {}, payload = {};
      try { it = JSON.parse(lines[i]); } catch {}
      try { payload = JSON.parse(lines[i+1]); } catch {}
      const type = it.type || 'unknown';
      if (type === 'event') {
        items.push({ type, msg: payload.message, exception: payload.exception?.values?.[0]?.value,
          mechanism: payload.exception?.values?.[0]?.mechanism?.type,
          trace_id: payload.contexts?.trace?.trace_id, parent_span_id: payload.contexts?.trace?.parent_span_id,
          span_id: payload.contexts?.trace?.span_id,
          dsc: header.trace });
      } else if (type === 'transaction') {
        items.push({ type, name: payload.transaction, op: payload.contexts?.trace?.op,
          trace_id: payload.contexts?.trace?.trace_id, parent_span_id: payload.contexts?.trace?.parent_span_id,
          dsc: header.trace });
      } else if (type === 'span') {
        const arr = Array.isArray(payload.items) ? payload.items : [payload];
        for (const s of arr) items.push({ type: 'span', name: s.name, trace_id: s.trace_id, parent_span_id: s.parent_span_id, span_id: s.span_id, is_segment: s.is_segment });
      } else {
        items.push({ type });
      }
    }
    res.writeHead(200, {'content-type':'application/json'}); res.end('{}');
  });
}).listen(port, () => console.log('sink on', port));
