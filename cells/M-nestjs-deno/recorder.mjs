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
    baggage: req.headers.baggage ?? null,
  });
  res.end('{"ok":true}');
}).listen(Number(process.env.PORT || 41735), '127.0.0.1', () => console.log('recorder listening', process.env.PORT || 41735));
