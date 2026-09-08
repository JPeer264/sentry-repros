import { createServer } from 'node:http';
const hits = [];
createServer((req, res) => {
  if (req.url.startsWith('/__hits')) {
    if (req.method === 'DELETE') { hits.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits, null, 2));
    return;
  }
  hits.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  });
  res.end('recorded');
}).listen(Number(process.env.PORT || 47312), '127.0.0.1', () => console.log('rec on', process.env.PORT));
