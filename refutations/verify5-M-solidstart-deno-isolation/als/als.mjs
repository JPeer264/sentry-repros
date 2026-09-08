import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';

const als = new AsyncLocalStorage();
const port = Number(process.env.PORT);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const id = u.searchParams.get('id') || 'none';
  const mod = u.searchParams.get('mod');
  als.run({ id }, async () => {
    const before = als.getStore();
    let afterImport = 'skipped';
    if (mod) {
      await import(`./mod${mod}.mjs`);
      afterImport = JSON.stringify(als.getStore() ?? null);
    }
    await new Promise(r => setTimeout(r, 50));
    const afterTimer = als.getStore();
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      id,
      before: JSON.stringify(before ?? null),
      afterImport,
      afterTimer: JSON.stringify(afterTimer ?? null),
      outsideAtSameTick: JSON.stringify(null),
    }));
  });
});
server.listen(port, () => console.log(`als ready ${port}`));
