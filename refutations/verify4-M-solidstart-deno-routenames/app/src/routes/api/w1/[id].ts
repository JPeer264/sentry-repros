import { setHttpServerSpanRouteAttribute } from '@sentry/server-utils';
import type { APIEvent } from '@solidjs/start/server';

export function GET(event: APIEvent) {
  setHttpServerSpanRouteAttribute('/api/w1/:id');
  return new Response(JSON.stringify({ id: event.params.id, w: 1 }));
}
