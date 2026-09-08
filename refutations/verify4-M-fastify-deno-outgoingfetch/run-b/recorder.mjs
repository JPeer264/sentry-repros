import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__headers')) {
    if (req.method === 'DELETE') { seen.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({
    url: req.url,
    via: req.headers['x-via'] ?? null,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder listening', process.env.PORT));
