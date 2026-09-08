import { createServer } from 'node:http';

const seen = [];
const port = Number(process.env.PORT);

createServer((req, res) => {
  if (req.url === '/__seen') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({
    url: req.url,
    sentryTrace: req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
  });
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('recorded');
}).listen(port, '127.0.0.1', () => console.log(`recorder on ${port}`));
