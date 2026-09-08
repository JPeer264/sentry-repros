import Koa from 'koa';
import Router from '@koa/router';

const PORT = Number(Deno.env.get('APP_PORT'));
const app = new Koa();
const router = new Router();
router.get('/users/:id', ctx => {
  ctx.body = { id: ctx.params.id };
});
app.use(router.routes());
app.listen(PORT, '127.0.0.1', () => console.log(`PORT=${PORT}`));
