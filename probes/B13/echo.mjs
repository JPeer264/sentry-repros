import { createServer } from 'node:http';

createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  }));
}).listen(Number(process.env.PORT || 9998), '127.0.0.1', () => console.log('echo listening', process.env.PORT || 9998));
