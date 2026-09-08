import { Application, Router } from '@oak/oak';

const PORT = Number(Deno.env.get('APP_PORT'));
const router = new Router();
router.get('/users/:id', ctx => {
  ctx.response.body = { id: ctx.params.id };
});
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
