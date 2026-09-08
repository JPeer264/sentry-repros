import http from 'node:http';
const port = Number(process.env.PORT);
http.createServer((req, res) => {
  console.log(JSON.stringify({
    path: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  }));
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('recorded');
}).listen(port, '127.0.0.1', () => console.log('recorder on ' + port));
