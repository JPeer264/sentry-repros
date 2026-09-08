# Parameterized route names, SolidStart 1.3 on Cloudflare Workers (@sentry/cloudflare 10.67.0 / develop)

Verified 2026-09-06 with wrangler 4.129.0 dev, compatibility_date 2026-05-01, nodejs_compat,
both traceLifecycle 'static' and 'stream'.

Out of the box the root span is `GET /api/users/42` (source `url`) in static mode and `GET` in
stream mode: @sentry/cloudflare sees only the Request, and the h3 event that reaches the handler
has `event.context.matchedRoute === null` on this preset, so nitro's own parameterization
(packages/nitro/src/runtime/hooks/captureTracingEvents.ts:72) has nothing to read either.

Fix: a SolidStart middleware that matches the pathname against the vinxi file-route table and
renames the Cloudflare root span.

app.config.ts:
  export default defineConfig({
    middleware: './src/middleware.ts',
    server: { preset: 'cloudflare-module', rollupConfig: { external: ['@sentry/cloudflare'] } },
  });

src/middleware.ts:
  import { createMiddleware } from '@solidjs/start/middleware';
  import { getActiveSpan, getRootSpan, spanToJSON, SENTRY_SEGMENT_NAME_SOURCE } from '@sentry/cloudflare';
  import { createRouter } from 'radix3';
  import fileRoutes from 'vinxi/routes';

  const normalize = (p: string) =>
    p.replace(/\([^)/]+\)/g, '').replace(/\/+/g, '/').replace(/\*([^/]*)/g, (_m, m) => `**:${m}`);

  const router = createRouter({
    routes: (fileRoutes as any[]).reduce((memo: any, r: any) => {
      const pattern = normalize(r.path) || '/';
      memo[pattern] = { pattern };
      return memo;
    }, {}),
  });

  export default createMiddleware({
    onRequest(event) {
      const match: any = router.lookup(new URL(event.request.url).pathname);
      if (!match?.pattern) return;
      const active = getActiveSpan();
      const root = active && getRootSpan(active);
      if (!root) return;
      const attrs = spanToJSON(root).attributes || {};
      if (attrs['sentry.op'] !== 'http.server') return;
      root.setAttribute('http.route', match.pattern);
      root.updateName(`${attrs['http.request.method'] || 'GET'} ${match.pattern}`);
      root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route');
    },
  });

Leaving @sentry/cloudflare external in rollupConfig is required: otherwise the middleware and
worker.mjs get two module instances and getActiveSpan() returns undefined inside the middleware.
`radix3` is already present transitively via nitro; add it explicitly if you hoist strictly.
