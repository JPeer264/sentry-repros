import * as Sentry from '@sentry/cloudflare';
import { deepBoom } from './boom';

interface Env {
  SINK_URL: string;
  MARKER: string;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: 'https://public@example.invalid/1',
    tunnel: env.SINK_URL,
    tracesSampleRate: 1,
    release: 'n10-cf',
  }),
  {
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === '/error') deepBoom(env.MARKER);
      if (url.pathname === '/sentinel') {
        Sentry.captureMessage('sentinel');
        return new Response('sentinel\n');
      }
      return new Response('ok\n');
    },
  } satisfies ExportedHandler<Env>,
);
