import { createServer } from 'node:http';
const hits = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] });
  res.end('recorded');
}).listen(Number(process.env.PORT || 52742), '127.0.0.1', () => console.log('recorder up'));
