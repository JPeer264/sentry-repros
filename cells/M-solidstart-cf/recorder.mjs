import { createServer } from 'node:http';

const seen = [];

createServer((req, res) => {
  if (req.url?.startsWith('/__seen')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ recorder: true }));
}).listen(53819, '127.0.0.1', () => console.log('recorder listening 53819'));
