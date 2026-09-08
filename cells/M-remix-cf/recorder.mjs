import { createServer } from 'node:http';

const hits = [];
const port = Number(process.env.PORT || 45732);

createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) {
    if (req.method === 'DELETE') { hits.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers.baggage ?? null,
  });
  res.end('recorded');
}).listen(port, '127.0.0.1', () => console.log('recorder listening', port));
