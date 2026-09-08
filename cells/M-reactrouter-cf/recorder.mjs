import { createServer } from 'node:http';

const hits = [];
const port = Number(process.env.PORT);

createServer((req, res) => {
  if (req.url === '/__hits') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(hits));
    return;
  }
  hits.push({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  });
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('recorded');
}).listen(port, '127.0.0.1', () => console.log(`recorder on ${port}`));
