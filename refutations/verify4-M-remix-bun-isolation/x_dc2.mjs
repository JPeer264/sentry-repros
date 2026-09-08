// Does Bun's node:http publish the diagnostics channel @sentry/node's httpServerIntegration needs?
import { subscribe, channel } from 'node:diagnostics_channel';
import http from 'node:http';
let fired = 0;
subscribe('http.server.request.start', () => { fired++; });
console.log('hasSubs=', channel('http.server.request.start').hasSubscribers);
const srv = http.createServer((req, res) => { res.end('ok'); });
srv.listen(52915, async () => {
  await fetch('http://127.0.0.1:52915/');
  await new Promise(r => setTimeout(r, 100));
  console.log('CHANNEL_FIRED=', fired);
  srv.close();
});
