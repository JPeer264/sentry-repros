import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__seen')) {
    if (req.method === 'DELETE') { seen.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({ url: req.url, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null });
  res.end('ok');
}).listen(Number(process.env.PORT || 34012), '127.0.0.1', () => console.log('recorder listening', process.env.PORT || 34012));
