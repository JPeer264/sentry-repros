const LIFECYCLE = (Deno.env.get('LIFECYCLE') || 'static') as 'stream' | 'static';
const SINK = Deno.env.get('SINK')!;
const ECHO = Deno.env.get('ECHO')!;
const PORT = Number(Deno.env.get('PORT'));

const Sentry: any = await import('@sentry/elysia');
Sentry.init({ dsn: 'https://public@example.com/1', tunnel: SINK, tracesSampleRate: 1.0, traceLifecycle: LIFECYCLE });

const { Elysia } = await import('elysia');
const app = Sentry.withElysia(new Elysia())
  .get('/hello/:id', (ctx: any) => ({ ok: true, id: ctx.params.id }))
  .get('/down', async () => await (await fetch(ECHO + '/echo')).json())
  .get('/sentinel', () => { Sentry.captureMessage('sentinel'); return 'ok'; });

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, (request: Request) =>
  Sentry.withIsolationScope(() =>
    Sentry.continueTrace(
      { sentryTrace: request.headers.get('sentry-trace') || '', baggage: request.headers.get('baggage') },
      () => Sentry.startSpan(
        { name: request.method, attributes: { 'sentry.op': 'http.server', 'sentry.origin': 'manual', 'sentry.source': 'url', 'url.full': request.url } },
        () => app.fetch(request),
      ),
    ),
  ),
);
console.log('appc ready');
