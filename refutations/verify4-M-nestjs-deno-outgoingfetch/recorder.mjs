import { createServer } from 'node:http';
const seen = [];
const server = createServer((req, res) => {
  if (req.url === '/__seen') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(seen, null, 2));
    return;
  }
  if (req.method === 'DELETE' && req.url === '/__seen') {
    seen.length = 0;
    res.end('cleared');
    return;
  }
  seen.push({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.end('recorded');
});
server.listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder on', process.env.PORT));
