import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url === '/__seen') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({ url: req.url, 'sentry-trace': req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null });
  res.end(JSON.stringify({ ok: true, url: req.url }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder listening', process.env.PORT));
