import { AsyncLocalStorage } from 'node:async_hooks';
import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';

const als = new AsyncLocalStorage();

subscribe('http.server.request.start', (d) => {
  const server = d.server;
  if (!server || server.__wrapped) return;
  server.__wrapped = true;
  const orig = server.emit;
  server.emit = function (ev, ...a) {
    if (ev !== 'request') return orig.apply(this, [ev, ...a]);
    const inherited = als.getStore();
    const store = { url: a[0].url, inheritedFrom: inherited ? inherited.url : null };
    console.log(`[emit] url=${store.url} inheritedContext=${JSON.stringify(inherited ?? null)}`);
    return als.run(store, () => orig.apply(this, [ev, ...a]));
  };
});

const server = http.createServer(async (req, res) => {
  await new Promise(r => setTimeout(r, 50));
  console.log(`[handler] url=${req.url} store=${JSON.stringify(als.getStore() ?? null)}`);
  res.end('ok\n');
});
server.listen(Number(process.env.PORT), '127.0.0.1', () => console.log('listening', process.env.PORT));
