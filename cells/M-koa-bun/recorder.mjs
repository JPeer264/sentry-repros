import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__seen')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] });
  res.end('downstream-ok');
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('recorder', process.env.PORT));
