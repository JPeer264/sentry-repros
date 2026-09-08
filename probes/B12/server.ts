import * as Sentry from '@sentry/bun';

/**
 * Shared server body for both entries. `gen` is the generation marker the entry
 * file carries, so an edit to the entry is visible in the log line and in the
 * route responses.
 */
export function startServer(gen: number): void {
  const g = globalThis as any;
  g.__appEvals = (g.__appEvals ?? 0) + 1;

  const sameBunServe = g.__bunServe === undefined || g.__bunServe === Bun.serve;
  const sameSentryNs = g.__sentryNs === undefined || g.__sentryNs === Sentry;
  g.__bunServe = Bun.serve;
  g.__sentryNs = Sentry;

  const PORT = Number(process.env.APP_PORT ?? 51812);

  Bun.serve({
    port: PORT,
    hostname: '127.0.0.1',
    routes: {
      '/hello/:name': (req: any) => new Response(`hello ${req.params.name} gen${gen}`),
      '/error': () => {
        throw new Error(`route boom gen${gen}`);
      },
      '/sentinel/:tag': (req: any) => {
        Sentry.captureException(new Error(req.params.tag));
        return new Response('ok');
      },
    },
  });

  console.log(
    `[app] PORT=${PORT} GEN=${gen} pid=${process.pid} appEvals=${g.__appEvals} ` +
      `sameBunServe=${sameBunServe} sameSentryNs=${sameSentryNs} ` +
      `uncaughtListeners=${process.listenerCount('uncaughtException')} ` +
      `rejectionListeners=${process.listenerCount('unhandledRejection')}`,
  );
}
