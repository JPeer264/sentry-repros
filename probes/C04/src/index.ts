import * as Sentry from '@sentry/cloudflare';

let runs = 0;

export default Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: 'https://public@example.ingest.sentry.io/1234',
    tunnel: env.SENTRY_TUNNEL ?? 'http://127.0.0.1:41237/',
    tracesSampleRate: 1.0,
    debug: false,
  }),
  {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === '/sentinel') {
        Sentry.captureMessage(`sentinel ${url.searchParams.get('n') ?? ''}`.trim());
        return new Response('sentinel\n');
      }
      return new Response('ok\n');
    },

    async scheduled(controller: ScheduledController): Promise<void> {
      runs += 1;
      const run = runs;
      await Sentry.withMonitor(
        'probe-cron',
        async () => {
          if (run === 2) {
            throw new Error(`cron boom run ${run}`);
          }
        },
        {
          schedule: { type: 'crontab', value: controller.cron || '* * * * *' },
        },
      );
    },
  },
) satisfies ExportedHandler;
