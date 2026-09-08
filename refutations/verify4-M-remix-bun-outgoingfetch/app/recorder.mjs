import http from 'node:http';

const port = Number(process.env.REC_PORT);
const out = [];
http
  .createServer((req, res) => {
    if (req.url.startsWith('/__recorded')) {
      if (req.method === 'DELETE') { out.length = 0; res.end('[]'); return; }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(out));
      return;
    }
    out.push({ url: req.url, sentryTrace: req.headers['sentry-trace'], baggage: req.headers.baggage, traceparent: req.headers.traceparent });
    console.log(JSON.stringify(out[out.length - 1]));
    res.end('ok');
  })
  .listen(port, () => console.log(`[rec] listening on ${port}`));
