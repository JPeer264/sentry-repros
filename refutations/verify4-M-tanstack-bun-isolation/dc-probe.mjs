import dc from 'node:diagnostics_channel';
import http from 'node:http';
const names = ['http.server.request.start','http.server.response.finish','http.client.request.start'];
for (const n of names) {
  dc.subscribe(n, () => console.log('FIRED', n));
}
const srv = http.createServer((req,res)=>{res.end('ok')});
srv.listen(0, async () => {
  const port = srv.address().port;
  await fetch(`http://127.0.0.1:${port}/`).then(r=>r.text());
  setTimeout(()=>{ srv.close(); console.log('done'); }, 200);
});
