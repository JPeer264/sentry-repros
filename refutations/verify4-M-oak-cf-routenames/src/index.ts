import { Application, Router } from '@oak/oak';
import * as Sentry from '@sentry/cloudflare';

const SINK = 'http://127.0.0.1:52413';

const router = new Router();

router.get('/', ctx => {
  ctx.response.body = { ok: true };
});

router.get('/users/:id', ctx => {
  ctx.response.body = { id: ctx.params.id };
});

router.get('/error/:id', () => {
  throw new Error('oak-route-boom');
});

router.get('/sentinel', ctx => {
  Sentry.captureMessage('sentinel');
  ctx.response.body = { sentinel: true };
});

function rename(ctx: any): void {
  const matched = ctx.matched as Array<{ path: string }> | undefined;
  const path = matched?.[matched.length - 1]?.path;
  const span = Sentry.getActiveSpan();
  if (!path || !span) return;
  const root = Sentry.getRootSpan(span);
  const routeName = `${ctx.request.method} ${path}`;
  Sentry.updateSpanName(root, routeName);
  root.setAttribute(Sentry.SENTRY_SEGMENT_NAME_SOURCE, 'route');
  root.setAttribute('http.route', path);
  Sentry.getIsolationScope().setTransactionName(routeName);
}

const app = new Application();

// mode=off  -> no renaming at all (baseline)
// mode=after -> the previously reported middleware: after await next(), wrong attribute key
// anything else (default "fixed") -> try/finally + SENTRY_SEGMENT_NAME_SOURCE
app.use(async (ctx, next) => {
  const mode = ctx.request.url.searchParams.get('mode') ?? 'fixed';
  if (mode === 'off') {
    await next();
    return;
  }
  if (mode === 'after') {
    await next();
    const matched = ctx.matched as Array<{ path: string }> | undefined;
    const path = matched?.[matched.length - 1]?.path;
    const span = Sentry.getActiveSpan();
    if (path && span) {
      Sentry.updateSpanName(Sentry.getRootSpan(span), `${ctx.request.method} ${path}`);
      Sentry.getRootSpan(span).setAttribute('sentry.source', 'route');
    }
    return;
  }
  try {
    await next();
  } finally {
    rename(ctx);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

export default Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: `${SINK}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: (env.SENTRY_LIFECYCLE as 'stream' | 'static') ?? 'stream',
  }),
  {
    fetch(request: Request, env: unknown, ctx: ExecutionContext) {
      return app.fetch(request, env, ctx);
    },
  } satisfies ExportedHandler,
);
