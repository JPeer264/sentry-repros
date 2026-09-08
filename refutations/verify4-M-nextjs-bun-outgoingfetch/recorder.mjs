import { createServer } from 'node:http';

const hits = [];

createServer((req, res) => {
  if (req.url === '/__hits') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(hits, null, 2));
    return;
  }
  hits.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder on', process.env.PORT));
