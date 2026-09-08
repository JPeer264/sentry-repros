import './instrument.server.mjs';
import * as http from 'node:http';
import { createRequestHandler } from 'react-router';

const build = await import('./build/server/index.js');
const handler = createRequestHandler(build, 'production');

const port = Number(process.env.PORT || 41000);

http
  .createServer(async (req, res) => {
    const url = `http://${req.headers.host}${req.url}`;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers.set(k, v);
    }
    const request = new Request(url, { method: req.method, headers });
    try {
      const response = await handler(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      const text = await response.text();
      res.end(text);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  })
  .listen(port, () => console.log(`listening ${port}`));
