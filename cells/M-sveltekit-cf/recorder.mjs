import { createServer } from 'node:http';
const hits = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({ url: req.url, method: req.method, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(41325, '127.0.0.1', () => console.log('recorder 41325'));
