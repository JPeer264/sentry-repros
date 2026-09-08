// Plain host server the Worker calls on /downstream. Logs the trace headers it receives.
import { createServer } from 'node:http';

const port = Number(process.argv[2] || 41501);

createServer((req, res) => {
  console.log(
    'API HIT',
    req.url,
    JSON.stringify({ 'sentry-trace': req.headers['sentry-trace'], baggage: req.headers.baggage }),
  );
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(port, '127.0.0.1', () => console.log('api listening', port));
