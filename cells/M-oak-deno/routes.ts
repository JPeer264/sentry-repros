import * as Sentry from '@sentry/deno';
import { Application, Router } from '@oak/oak';

const { default: mysql } = await import('mysql');

const SINK = Number(Deno.env.get('SINK'));

// MODULE scope on purpose: a driver first loaded inside a request is a known no-span case.
const db = mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', database: 'app' });

export function buildApp(): Application {
  const router = new Router();

  router.get('/users/:id', ctx => {
    ctx.response.body = { id: ctx.params.id };
  });

  router.get('/error', () => {
    throw new Error('oak route boom');
  });

  router.get('/db', async ctx => {
    const rows = await new Promise<unknown[]>((resolve, reject) =>
      db.query('SELECT id, name FROM users', (e: unknown, r: unknown[]) => (e ? reject(e) : resolve(r))),
    );
    ctx.response.body = { rows: rows.length };
  });

  router.get('/downstream', async ctx => {
    const r = await fetch(`http://127.0.0.1:${SINK}/rec/from-oak`);
    ctx.response.body = await r.text();
  });

  router.get('/log', ctx => {
    Sentry.logger.info('hello from oak', { route: '/log' });
    ctx.response.body = 'logged';
  });

  router.get('/iso/:tag', async ctx => {
    const tag = ctx.params.tag!;
    Sentry.setTag('who', tag);
    await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
    Sentry.captureException(new Error(`iso ${tag}`));
    ctx.response.body = tag;
  });

  router.get('/sentinel', ctx => {
    Sentry.captureMessage('sentinel');
    ctx.response.body = 's';
  });

  const app = new Application();

  // 1. error middleware (only needed for app.listen(); harmless with app.fetch)
  if (Deno.env.get('ERRMW') !== 'off') {
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        Sentry.captureException(e, { mechanism: { type: 'oak', handled: false } });
        throw e;
      }
    });
  }

  // 2. route-name middleware - nothing names the span after the Oak route automatically
  if (Deno.env.get('NAMING') !== 'off') {
    app.use(async (ctx, next) => {
      await next();
      const span = Sentry.getActiveSpan();
      const route = ctx.matched?.at(-1)?.path;
      if (span && route) {
        Sentry.updateSpanName(span, `${ctx.request.method} ${route}`);
        span.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
      }
    });
  }

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
