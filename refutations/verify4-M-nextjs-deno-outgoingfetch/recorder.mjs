import http from 'node:http';
const hits = [];
http
  .createServer((req, res) => {
    if (req.url === '/__hits') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(hits));
      return;
    }
    hits.push({
      url: req.url,
      'sentry-trace': req.headers['sentry-trace'] ?? null,
      baggage: req.headers['baggage'] ?? null,
      traceparent: req.headers['traceparent'] ?? null,
    });
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('recorded');
  })
  .listen(Number(process.env.PORT));
