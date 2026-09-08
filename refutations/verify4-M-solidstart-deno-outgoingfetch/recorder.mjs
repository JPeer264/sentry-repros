import { createServer } from 'node:http';
const hits = [];
createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) { res.setHeader('content-type','application/json'); res.end(JSON.stringify(hits)); return; }
  if (req.url?.startsWith('/__clear')) { hits.length = 0; res.end('ok'); return; }
  hits.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] });
  res.end('{"recorded":true}');
}).listen(41872, '127.0.0.1', () => console.log('recorder 41872'));
