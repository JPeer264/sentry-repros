import { httpServerHandler } from 'cloudflare:node';
import Fastify from 'fastify';

let booting;

function boot() {
  if (!booting) {
    booting = (async () => {
      const app = Fastify();
      app.get('/users/:id', async req => ({ id: req.params.id }));
      app.get('/ping', async () => ({ ok: true }));
      await app.listen({ port: 8080, host: '127.0.0.1' });
    })();
  }
  return booting;
}

const nodeHandler = httpServerHandler({ port: 8080 });

export default {
  async fetch(request, env, ctx) {
    await boot();
    return nodeHandler.fetch(request, env, ctx);
  },
};
