import { createServer } from 'node:http';
const port = Number(process.env.REC_PORT);
createServer((req, res) => {
  console.log(JSON.stringify({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  }));
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(port, '127.0.0.1', () => console.log('recorder on ' + port));
