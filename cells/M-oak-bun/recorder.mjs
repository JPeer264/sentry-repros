import { createServer } from 'node:http';
const hits = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({ url: req.url, 'sentry-trace': req.headers['sentry-trace'], baggage: req.headers['baggage'] });
  res.end('recorded');
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder', process.env.PORT));
