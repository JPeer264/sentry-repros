import './instrument-nohook.ts';
import * as Sentry from '@sentry/deno';
import { Application, Router } from '@oak/oak';
import http from 'node:http';

const SINK = Deno.env.get('SINK_PORT') ?? '41417';
const PORT = Number(Deno.env.get('APP_PORT') ?? '41418');
const REC = `http://127.0.0.1:${SINK}/rec`;

const router = new Router();

router.get('/downstream', async ctx => {
  const r = await fetch(`${REC}/from-oak-fetch`);
  await r.text();
  ctx.response.body = { ok: true };
});

router.get('/downstream-http', async ctx => {
  await new Promise<void>(resolve => {
    http.get(`${REC}/from-oak-nodehttp`, res => {
      res.resume();
      res.on('end', () => resolve());
    });
  });
  ctx.response.body = { ok: true };
});

router.get('/downstream-manual', async ctx => {
  await Sentry.startSpan({ name: 'GET /rec/from-oak-manual', op: 'http.client' }, async () => {
    const r = await fetch(`${REC}/from-oak-manual`, { headers: Sentry.getTraceData() as Record<string, string> });
    await r.text();
  });
  ctx.response.body = { ok: true };
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.response.body = { ok: true };
});

const app = new Application();

app.use(async (ctx, next) => {
  await next();
  const span = Sentry.getActiveSpan();
  const route = ctx.matched?.at(-1)?.path;
  if (span && route) {
    Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
    span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, app.fetch);
