import * as Sentry from '@sentry/cloudflare';

interface Env {
  SINK_PORT: string;
  TRACE_LIFECYCLE?: string;
  SENTRY_DEBUG?: string;
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.com/1',
    tunnel: `http://127.0.0.1:${env.SINK_PORT}/`,
    tracesSampleRate: 1.0,
    traceLifecycle: env.TRACE_LIFECYCLE === 'static' ? 'static' : 'stream',
    debug: env.SENTRY_DEBUG === '1',
  }),
  {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/stream') {
        const encoder = new TextEncoder();
        const body = new ReadableStream({
          async start(controller) {
            for (let i = 1; i <= 3; i++) {
              controller.enqueue(encoder.encode(`chunk-${i} ${Date.now()}\n`));
              if (i < 3) {
                await sleep(300);
              }
            }
            controller.close();
          },
        });
        return new Response(body, { headers: { 'content-type': 'text/plain' } });
      }

      if (url.pathname === '/after') {
        ctx.waitUntil(
          Sentry.startSpan({ name: 'after' }, async () => {
            await sleep(500);
          }),
        );
        return new Response(`immediate ${Date.now()}\n`);
      }

      if (url.pathname === '/sentinel') {
        Sentry.captureMessage(url.searchParams.get('m') ?? 'sentinel');
        return new Response('sentinel\n');
      }

      return new Response('ok\n');
    },
  } satisfies ExportedHandler<Env>,
);
