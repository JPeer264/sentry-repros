// Plain node server, no Sentry. Records the trace headers of every request it gets.
import { createServer } from 'node:http';

const headers = [];

createServer((req, res) => {
  if (req.url?.startsWith('/__headers')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(headers));
    return;
  }
  headers.push({
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'],
    baggage: req.headers.baggage,
  });
  res.end('ok');
}).listen(Number(process.env.PORT || 9998), '127.0.0.1', () => console.log('downstream listening', process.env.PORT || 9998));
