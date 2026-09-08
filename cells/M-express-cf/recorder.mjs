import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url.startsWith('/__seen')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({ url: req.url, headers: { 'sentry-trace': req.headers['sentry-trace'], baggage: req.headers['baggage'] } });
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}).listen(41339, '127.0.0.1', () => console.log('recorder 41339'));
