import http from 'node:http';
const hits = [];
http.createServer((req, res) => {
  if (req.url.startsWith('/__hits')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  });
  res.end('rec-ok');
}).listen(Number(process.env.PORT));
