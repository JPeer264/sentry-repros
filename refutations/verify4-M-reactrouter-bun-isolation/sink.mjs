import http from 'node:http';

const items = [];

function parseEnvelope(body) {
  const lines = body.split('\n').filter(Boolean);
  const header = JSON.parse(lines[0]);
  const out = [];
  for (let i = 1; i < lines.length; i += 2) {
    let itemHeader;
    try { itemHeader = JSON.parse(lines[i]); } catch { break; }
    let payload;
    try { payload = JSON.parse(lines[i + 1]); } catch { payload = { raw: lines[i + 1] }; }
    out.push({ envHeader: header, itemHeader, payload });
  }
  return out;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/__items')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(items.map(compact), null, 1));
    return;
  }
  if (req.method === 'GET' && req.url.startsWith('/__raw')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(items, null, 1));
    return;
  }
  if (req.method === 'DELETE') {
    items.length = 0;
    res.writeHead(200); res.end('ok');
    return;
  }
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    try { items.push(...parseEnvelope(body)); } catch (e) { console.error('parse fail', e.message); }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
});

function compact({ envHeader, itemHeader, payload }) {
  const type = itemHeader.type;
  if (type === 'event') {
    return {
      type: 'event',
      message: payload.message,
      exception: payload.exception?.values?.[0]?.value,
      tags: payload.tags,
      user: payload.user,
      transaction: payload.transaction,
      trace_id: payload.contexts?.trace?.trace_id,
      span_id: payload.contexts?.trace?.span_id,
      event_id: payload.event_id,
    };
  }
  if (type === 'transaction') {
    return {
      type: 'transaction',
      name: payload.transaction,
      op: payload.contexts?.trace?.op,
      source: payload.transaction_info?.source,
      route: payload.contexts?.trace?.data?.['http.route'],
      tags: payload.tags,
      user: payload.user,
      trace_id: payload.contexts?.trace?.trace_id,
      spans: (payload.spans || []).map(s => `${s.op || '-'} ${s.description}`),
    };
  }
  if (type === 'span') {
    return {
      type: 'span',
      items: (payload.items || []).map(s => `${s.attributes?.['sentry.op']?.value || '-'} ${s.name} trace=${s.trace_id}`),
    };
  }
  if (type === 'log') {
    return { type: 'log', items: (payload.items || []).map(l => `${l.level}: ${l.body} trace=${l.trace_id}`) };
  }
  return { type, keys: Object.keys(payload) };
}

server.listen(Number(process.env.PORT), '127.0.0.1', () => console.log('sink on', process.env.PORT));
