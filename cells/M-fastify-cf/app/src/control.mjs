import { httpServerHandler } from 'cloudflare:node';
import http from 'node:http';

let booting;
function boot() {
  if (!booting) {
    booting = new Promise(resolve => {
      const server = http.createServer((req, res) => {
        let evalResult;
        try {
          evalResult = new Function('a', 'return a + 1')(1);
        } catch (e) {
          evalResult = `${e.name}: ${e.message}`;
        }
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ url: req.url, newFunction: evalResult }));
      });
      server.listen(8081, '127.0.0.1', resolve);
    });
  }
  return booting;
}

const nodeHandler = httpServerHandler({ port: 8081 });

export default {
  async fetch(request, env, ctx) {
    await boot();
    return nodeHandler.fetch(request, env, ctx);
  },
};
