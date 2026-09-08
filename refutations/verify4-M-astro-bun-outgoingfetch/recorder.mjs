import http from 'node:http';
const port = Number(process.env.PORT || 47312);
http.createServer((req, res) => {
  console.log(JSON.stringify({ url: req.url, 'sentry-trace': req.headers['sentry-trace'] ?? null, baggage: req.headers['baggage'] ?? null, traceparent: req.headers['traceparent'] ?? null }));
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end('{"ok":true}');
}).listen(port, '127.0.0.1', () => console.log('recorder on ' + port));
