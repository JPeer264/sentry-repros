import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';
subscribe('http.server.request.start', () => console.log('DC http.server.request.start FIRED'));
const srv = http.createServer((req, res) => { res.end('ok'); });
srv.listen(41871, async () => {
  const r = await fetch('http://127.0.0.1:41871/');
  console.log('status', r.status);
  srv.close();
});
