// src/middleware.ts  — parameterized route names for SolidStart on Cloudflare Workers.
// Register with `middleware: './src/middleware.ts'` in app.config.ts.
import { createMiddleware } from '@solidjs/start/middleware';
import { getActiveSpan, getRootSpan, spanToJSON, SENTRY_SEGMENT_NAME_SOURCE } from '@sentry/cloudflare';
import { createRouter } from 'radix3';
import fileRoutes from 'vinxi/routes';

// Same normalization SolidStart applies when it builds its own API router.
function normalize(p: string): string {
  return p
    .replace(/\([^)/]+\)/g, '')
    .replace(/\/+/g, '/')
    .replace(/\*([^/]*)/g, (_m, m) => `**:${m}`);
}

const routeRouter = createRouter({
  routes: (fileRoutes as any[]).reduce((memo: any, route: any) => {
    const pattern = normalize(route.path) || '/';
    memo[pattern] = { pattern };
    return memo;
  }, {}),
});

export default createMiddleware({
  onRequest(event) {
    const match: any = routeRouter.lookup(new URL(event.request.url).pathname);
    if (!match?.pattern) return;

    const active = getActiveSpan();
    const root = active && getRootSpan(active);
    if (!root) return;

    const attrs = spanToJSON(root).attributes || {};
    if (attrs['sentry.op'] !== 'http.server') return;

    const method = (attrs['http.request.method'] as string) || 'GET';
    root.setAttribute('http.route', match.pattern);
    root.updateName(`${method} ${match.pattern}`);
    root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route');
  },
});
