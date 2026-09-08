import http from 'node:http';
const Sentry = globalThis.__S__;
const MODE = process.env.MODE || 'stock';

// A fetch-style handler, like the TanStack Start / nitro server entry
async function handlerFetch(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/tag') {
    const tag = url.searchParams.get('tag');
    Sentry.setTag('probe_tag', tag);
    await new Promise(r => setTimeout(r, Number(url.searchParams.get('delay') || 100)));
    Sentry.captureException(new Error('tag error ' + tag));
    return new Response(JSON.stringify({ tag }), { headers: { 'content-type': 'application/json' } });
  }
  if (url.pathname === '/api/sentinel') {
    Sentry.captureMessage('sentinel');
    return new Response('sentinel');
  }
  return new Response('ok');
}

const wrapped = MODE === 'isoonly'
  ? request => Sentry.withIsolationScope(() => handlerFetch(request))
  : MODE === 'iso'
  ? request => Sentry.withIsolationScope(() => Sentry.continueTrace(
      { sentryTrace: request.headers.get('sentry-trace') || undefined, baggage: request.headers.get('baggage') || undefined },
      () => Sentry.startSpan({ name: `${request.method} ${new URL(request.url).pathname}`, op: 'http.server', forceTransaction: true }, () => handlerFetch(request))))
  : handlerFetch;

const server = http.createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`;
  const request = new Request(url, { method: req.method, headers: req.headers });
  const response = await wrapped(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});
server.listen(Number(process.env.PORT), () => console.log('app on ' + process.env.PORT));
