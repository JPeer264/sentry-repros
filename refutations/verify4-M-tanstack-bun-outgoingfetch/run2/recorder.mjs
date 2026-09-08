import http from 'node:http';
const port = Number(process.env.RECORDER_PORT);
let seen = [];
http.createServer((req, res) => {
  if (req.url.startsWith('/__seen')) {
    if (req.method === 'DELETE') { seen = []; res.writeHead(200); res.end('[]'); return; }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(seen, null, 2));
    return;
  }
  const entry = { url: req.url, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null };
  seen.push(entry);
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify(entry));
}).listen(port, '127.0.0.1', () => console.log(`[recorder] listening on ${port}`));
