import './db.mjs';
if (process.env.GLOBALS_WHEN === 'before') await import('./globals-flex.mjs');
await import('./instrument.server.mjs');
if (process.env.GLOBALS_WHEN === 'after') await import('./globals-flex.mjs');
const http = (await import('node:http')).default;
const Sentry = await import('@sentry/remix');
const { createRequestHandler } = await import('@remix-run/server-runtime');

const build = await import('./build/server/index.js');
const handler = createRequestHandler(Sentry.instrumentBuild(build), 'production');
const port = Number(process.env.PORT);
const server = http.createServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host || `127.0.0.1:${port}`}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach(vv => headers.append(k, vv));
      else if (v != null) headers.set(k, v);
    }
    const request = new Request(url, { method: req.method, headers });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const reader = response.body.getReader();
      for (;;) { const { done, value } = await reader.read(); if (done) break; res.write(value); }
    }
    res.end();
  } catch (e) { console.error('adapter error', e); res.writeHead(500); res.end('adapter error'); }
});
server.listen(port, '127.0.0.1', () => console.log(`READY http://127.0.0.1:${port}`));
