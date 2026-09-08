import { createServer } from 'node:http';

const recorded = [];

createServer((req, res) => {
  if (req.url?.startsWith('/__recorded')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recorded));
    return;
  }
  recorded.push({
    path: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.end('recorded\n');
}).listen(Number(process.env.PORT || 9998), '127.0.0.1', () => console.log('recorder listening', process.env.PORT || 9998));
