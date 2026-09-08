import { getActiveSpan, getRootSpan, updateSpanName } from '@sentry/solidstart';
import type { APIEvent } from '@solidjs/start/server';

export function GET(event: APIEvent) {
  const active = getActiveSpan();
  const root = active ? getRootSpan(active) : undefined;
  if (root) {
    updateSpanName(root, 'GET /api/w2/:id');
    root.setAttribute('http.route', '/api/w2/:id');
  }
  return new Response(JSON.stringify({ id: event.params.id, w: 2 }));
}
