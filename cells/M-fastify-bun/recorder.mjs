import { createServer } from 'node:http';

const hits = [];

createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) {
    if (req.method === 'DELETE') { hits.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers.baggage });
  res.end('{"ok":true}');
}).listen(Number(process.env.PORT || 47312), '127.0.0.1', () => console.log('recorder listening', process.env.PORT || 47312));
