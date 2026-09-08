import './instrument.server.mjs';
import http from 'node:http';
import { createRequestHandler } from 'react-router';

const build = await import('./build/server/index.js');
const handler = createRequestHandler(build, 'production');
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
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (e) {
    console.error('adapter error', e);
    res.writeHead(500);
    res.end('adapter error');
  }
});

server.listen(port, '127.0.0.1', () => console.log(`READY http://127.0.0.1:${port}`));
