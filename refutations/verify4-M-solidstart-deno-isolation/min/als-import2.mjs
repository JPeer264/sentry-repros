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
    console.log(`[emit] url=${a[0].url} inherited=${JSON.stringify(als.getStore() ?? null)}`);
    return als.run({ url: a[0].url }, () => orig.apply(this, [ev, ...a]));
  };
});
http.createServer(async (req, res) => {
  if (req.url === '/one') await import('./lazy.mjs');
  if (req.url === '/two') await import('./lazy2.mjs');
  await new Promise(r => setTimeout(r, 20));
  res.end('ok\n');
}).listen(Number(process.env.PORT), '127.0.0.1', () => console.log('listening', process.env.PORT));
