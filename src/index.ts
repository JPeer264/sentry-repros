import * as Sentry from '@sentry/cloudflare';
import type { Fetcher } from '@cloudflare/workers-types';

interface Env {
  SENTRY_DSN: string;
  SLOW_UPSTREAM: Fetcher;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: true,
    // Workaround for https://github.com/getsentry/sentry-javascript/issues/18652
    // In multi-worker `wrangler dev`, Cloudflare proxies `console` to prefix log
    // lines with the worker name. Sentry's Console integration patches console too,
    // and the two wrappers infinitely recurse → "Maximum call stack size exceeded".
    // Fix is in cloudflare/workers-sdk#11784. Until released, disable Console here.
    integrations: integrations => integrations.filter(i => i.name !== 'Console'),
  }),
  {
    async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);
      const durationSec = url.searchParams.get('duration') || '45';

      console.log(`[main] proxying SSE from slow-upstream (duration=${durationSec}s)`);

      // Proxy upstream body — this matches the pattern from issue #20409:
      // handler returns immediately with upstream.body as the response stream.
      // Use the service binding (not a public-URL fetch) — Cloudflare blocks
      // Worker→Worker public fetches on the same zone with error code 1042
      // unless the `global_fetch_strictly_public` compat flag is set.
      const upstream = await env.SLOW_UPSTREAM.fetch(`https://slow-upstream/?duration=${durationSec}`);

      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    },
  },
);
