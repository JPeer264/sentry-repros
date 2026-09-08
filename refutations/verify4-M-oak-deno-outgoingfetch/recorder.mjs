import { createServer } from 'node:http';
const recorded = [];
createServer((req, res) => {
  if (req.url === '/__recorded') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recorded));
    return;
  }
  recorded.push({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder listening', process.env.PORT));
