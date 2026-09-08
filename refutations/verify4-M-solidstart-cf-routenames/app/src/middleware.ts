import { createMiddleware } from '@solidjs/start/middleware';
import { getActiveSpan, getRootSpan, spanToJSON, SENTRY_SEGMENT_NAME_SOURCE } from '@sentry/cloudflare';
import { createRouter } from 'radix3';
import fileRoutes from 'vinxi/routes';

function normalize(p: string): string {
  return p
    .replace(/\([^)/]+\)/g, '')
    .replace(/\/+/g, '/')
    .replace(/\*([^/]*)/g, (_m, m) => `**:${m}`);
}

const routeRouter = createRouter({
  routes: (fileRoutes as any[]).reduce((memo: any, route: any) => {
    const p = normalize(route.path) || '/';
    memo[p] = { pattern: p };
    return memo;
  }, {}),
});

function applyRoute(route: string): void {
  const active = getActiveSpan();
  if (!active) return;
  const root = getRootSpan(active);
  if (!root) return;
  const attrs = spanToJSON(root).attributes || {};
  if (attrs['sentry.op'] !== 'http.server') return;
  const method = (attrs['http.request.method'] as string) || 'GET';
  root.setAttribute('http.route', route);
  root.updateName(`${method} ${route}`);
  root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route');
}

function patternFromParams(pathname: string, params: Record<string, string>): string | undefined {
  const entries = Object.entries(params || {});
  if (!entries.length) return undefined;
  let out = pathname;
  for (const [key, value] of entries) {
    if (!value) continue;
    out = out.split(`/${value}`).join(`/:${key}`);
  }
  return out === pathname ? undefined : out;
}

export default createMiddleware({
  onRequest(event) {
    const mode = event.request.headers.get('x-route-mw');
    if (mode !== 'router') return;
    const pathname = new URL(event.request.url).pathname;
    const match: any = routeRouter.lookup(pathname);
    if (match?.pattern) applyRoute(match.pattern);
  },
  onBeforeResponse(event) {
    const mode = event.request.headers.get('x-route-mw');
    if (mode !== 'params') return;
    const pathname = new URL(event.request.url).pathname;
    const pattern = patternFromParams(pathname, (event as any).params || {});
    if (pattern) applyRoute(pattern);
  },
});
