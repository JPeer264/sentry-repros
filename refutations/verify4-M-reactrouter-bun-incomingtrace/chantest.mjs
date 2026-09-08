import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';
let got = [];
for (const ch of ['http.server.request.start','http.server.response.finish','http.client.request.created']) {
  try { subscribe(ch, () => { got.push(ch); }); } catch (e) { console.log('subscribe failed', ch, e.message); }
}
const srv = http.createServer((req,res)=>{res.end('ok')});
srv.listen(43117, async () => {
  await fetch('http://127.0.0.1:43117/');
  await new Promise(r=>setTimeout(r,200));
  console.log('CHANNELS_FIRED=' + JSON.stringify(got));
  srv.close();
  process.exit(0);
});
