import http from 'node:http';
const hits = [];
const port = Number(process.env.PORT || 41873);
http.createServer((req, res) => {
  if (req.url === '/__hits') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(hits, null, 1));
    return;
  }
  if (req.method === 'DELETE' && req.url === '/__hits') { hits.length = 0; res.end('ok'); return; }
  hits.push({ url: req.url, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null });
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}).listen(port, '127.0.0.1', () => console.log('recorder on', port));
