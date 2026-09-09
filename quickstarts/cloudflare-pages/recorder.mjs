// Records the propagation headers of every request to /recorder and serves them back on /__headers.
// Mounted inside sink.mjs on the sink port, so the harness opens exactly one port for both.
const received = [];

export function handleRecorder(req, res) {
  if (req.url?.startsWith('/recorder')) {
    received.push({
      url: req.url,
      'sentry-trace': req.headers['sentry-trace'] ?? null,
      baggage: req.headers['baggage'] ?? null,
      traceparent: req.headers['traceparent'] ?? null,
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return true;
  }
  if (req.url?.startsWith('/__headers')) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(received));
    return true;
  }
  return false;
}

export function resetRecorder() {
  received.length = 0;
}
