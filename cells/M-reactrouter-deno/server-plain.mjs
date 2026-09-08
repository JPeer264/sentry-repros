import http from 'node:http';
import { createRequestHandler } from 'react-router';

const build = await import('./build/server/index.js');
const handler = createRequestHandler(build, 'production');
const port = Number(process.env.PORT);

http
  .createServer(async (req, res) => {
    const url = `http://${req.headers.host || `127.0.0.1:${port}`}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, String(v));
    const response = await handler(new Request(url, { method: req.method, headers }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  })
  .listen(port, '127.0.0.1', () => console.log(`READY-PLAIN http://127.0.0.1:${port}`));
