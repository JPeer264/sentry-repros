import { httpServerHandler } from 'cloudflare:node';
import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();
router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
app.use(router.routes()).use(router.allowedMethods());
app.listen(8080);

export default httpServerHandler({ port: 8080 });
