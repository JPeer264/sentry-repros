import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__seen')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({ url: req.url, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, sentryTrace: req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder on', process.env.PORT));
