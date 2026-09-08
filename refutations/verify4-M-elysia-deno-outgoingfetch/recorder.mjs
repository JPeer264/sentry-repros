import { createServer } from 'node:http';
const seen = [];
createServer((req, res) => {
  if (req.url === '/__seen') { res.setHeader('content-type','application/json'); res.end(JSON.stringify(seen)); return; }
  if (req.method === 'DELETE') { seen.length = 0; res.end('cleared'); return; }
  seen.push({ url: req.url, headers: { 'sentry-trace': req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null } });
  res.end('recorded');
}).listen(51703, '127.0.0.1', () => console.log('recorder 51703'));
