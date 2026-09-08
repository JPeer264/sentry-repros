import { createServer } from 'node:http'
const port = Number(process.env.PORT || 41119)
const seen = []
createServer((req, res) => {
  if (req.url === '/__seen') {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(seen))
    return
  }
  const rec = {
    url: req.url,
    'sentry-trace': req.headers['sentry-trace'] ?? null,
    baggage: req.headers['baggage'] ?? null,
    traceparent: req.headers['traceparent'] ?? null,
  }
  seen.push(rec)
  console.log('REC', JSON.stringify(rec))
  res.end('ok')
}).listen(port, '127.0.0.1', () => console.log('recorder on', port))
