import { createServer } from 'node:http';

const seen = [];
const port = Number(process.env.PORT || 37412);

createServer((req, res) => {
  if (req.url?.startsWith('/__seen')) {
    if (req.method === 'DELETE') { seen.length = 0; res.end('[]'); return; }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(seen));
    return;
  }
  seen.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers.baggage ?? null,
  });
  res.end('recorded');
}).listen(port, '127.0.0.1', () => console.log('recorder listening', port));
