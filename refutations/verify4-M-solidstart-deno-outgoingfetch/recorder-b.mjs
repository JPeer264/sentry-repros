import { createServer } from 'node:http';
const hits = [];
const port = Number(process.env.REC_PORT || 52142);
createServer((req, res) => {
  if (req.url?.startsWith('/__hits')) { res.setHeader('content-type','application/json'); res.end(JSON.stringify(hits)); return; }
  hits.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers['baggage'] ? 'yes' : undefined, traceparent: req.headers['traceparent'] });
  res.end('{"recorded":true}');
}).listen(port, '127.0.0.1', () => console.log('recorder ' + port));
