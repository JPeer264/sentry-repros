import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url === '/__seen') { res.setHeader('content-type','application/json'); res.end(JSON.stringify(seen)); return; }
  seen.push({ url: req.url, headers: { 'sentry-trace': req.headers['sentry-trace'], baggage: req.headers['baggage'] } });
  res.end('recorded');
}).listen(43713, '127.0.0.1', () => console.log('recorder 43713'));
