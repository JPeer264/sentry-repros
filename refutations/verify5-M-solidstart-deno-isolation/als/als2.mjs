import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';

const als = new AsyncLocalStorage();
const port = Number(process.env.PORT);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id');
  res.setHeader('content-type', 'application/json');
  const ambient = als.getStore() ?? null;
  if (!id) {
    res.end(JSON.stringify({ mode: 'unwrapped', ambientAtHandlerEntry: ambient }));
    return;
  }
  als.run({ id }, async () => {
    await new Promise(r => setTimeout(r, 50));
    res.end(JSON.stringify({ mode: 'wrapped', id, ambientAtHandlerEntry: ambient, inside: als.getStore() ?? null }));
  });
});
server.listen(port, () => console.log(`als2 ready ${port}`));
