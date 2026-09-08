import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url === '/__seen') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  if (req.method === 'DELETE' && req.url === '/__seen') { seen.length = 0; res.end('ok'); return; }
  seen.push({ url: req.url, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null });
  res.end(JSON.stringify({ ok: true }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('RECORDER', process.env.PORT));
