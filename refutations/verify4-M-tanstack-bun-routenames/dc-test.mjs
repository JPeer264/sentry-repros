import { subscribe, channel } from 'node:diagnostics_channel';
import http from 'node:http';
let fired = [];
for (const name of ['http.server.request.start','http.server.response.finish','http.client.request.created']) {
  subscribe(name, () => { fired.push(name); });
}
const server = http.createServer((req,res)=>{res.end('ok')});
await new Promise(r=>server.listen(41777,r));
const res = await fetch('http://127.0.0.1:41777/x');
await res.text();
await new Promise(r=>setTimeout(r,100));
console.log('runtime', typeof Bun !== 'undefined' ? 'bun' : 'node', 'fired:', JSON.stringify(fired));
server.close();
process.exit(0);
