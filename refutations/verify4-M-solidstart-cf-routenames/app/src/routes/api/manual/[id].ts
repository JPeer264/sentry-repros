import type { APIEvent } from '@solidjs/start/server';
import { getActiveSpan, getRootSpan, spanToJSON, SENTRY_SEGMENT_NAME_SOURCE } from '@sentry/cloudflare';

function setRoute(route: string) {
  const active = getActiveSpan();
  if (!active) return 'no-active-span';
  const root = getRootSpan(active);
  if (!root) return 'no-root-span';
  const attrs = spanToJSON(root).attributes || {};
  const method = (attrs['http.request.method'] as string) || 'GET';
  root.setAttribute('http.route', route);
  root.updateName(`${method} ${route}`);
  root.setAttribute(SENTRY_SEGMENT_NAME_SOURCE, 'route');
  return `renamed:${method} ${route}`;
}

export function GET(event: APIEvent) {
  const result = setRoute('/api/manual/:id');
  return new Response(JSON.stringify({ id: event.params.id, result }), {
    headers: { 'content-type': 'application/json' },
  });
}
