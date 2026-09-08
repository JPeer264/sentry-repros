import { httpServerHandler } from 'cloudflare:node';
import * as Sentry from '@sentry/cloudflare';
import Koa from 'koa';
import Router from '@koa/router';

const app = new Koa();
const router = new Router();
router.get('/users/:id', ctx => { ctx.body = { id: ctx.params.id }; });
app.use(router.routes());
app.listen(8080);
export default Sentry.withSentry(
  () => ({ dsn: 'https://public@example.invalid/1', tunnel: 'http://127.0.0.1:41318/', tracesSampleRate: 1.0 }),
  httpServerHandler({ port: 8080 }),
);
