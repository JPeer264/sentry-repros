import { createServer } from 'node:http';
const recs = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__recs')) {
    if (req.method === 'DELETE') { recs.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(recs));
    return;
  }
  recs.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'], traceparent: req.headers['traceparent'] });
  res.end('ok');
}).listen(Number(process.env.PORT || 9998), '127.0.0.1', () => console.log('recorder listening', process.env.PORT || 9998));
