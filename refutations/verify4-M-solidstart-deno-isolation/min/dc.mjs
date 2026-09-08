import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';

subscribe('http.server.request.start', (d) => {
  const server = d.server;
  console.log('[channel] http.server.request.start fired, url=', d.request?.url, 'hasServer=', !!server);
  if (!server || server.__sentryWrapped) return;
  server.__sentryWrapped = true;
  const orig = server.emit;
  server.emit = function (ev, ...a) {
    if (ev === 'request') console.log('[wrapped emit] ', a[0]?.url);
    return orig.apply(this, [ev, ...a]);
  };
  console.log('[channel] wrapped server.emit');
});

const server = http.createServer((req, res) => {
  console.log('[handler]', req.url);
  res.end('ok\n');
});
server.listen(Number(process.env.PORT), '127.0.0.1', () => console.log('listening', process.env.PORT));
