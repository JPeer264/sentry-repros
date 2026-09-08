import dc from 'node:diagnostics_channel';
import http from 'node:http';
let fired = [];
for (const n of ['http.server.request.start','http.server.response.finish','http.client.request.created']) {
  dc.subscribe(n, () => fired.push(n));
}
const port = 41733;
const s = http.createServer((req,res)=>{ res.end('ok'); });
s.listen(port, async () => {
  await fetch(`http://127.0.0.1:${port}/`);
  setTimeout(()=>{ console.log('RUNTIME', typeof Bun!=='undefined'?'bun':'node', 'fired=', JSON.stringify(fired)); s.close(); process.exit(0); }, 200);
});
