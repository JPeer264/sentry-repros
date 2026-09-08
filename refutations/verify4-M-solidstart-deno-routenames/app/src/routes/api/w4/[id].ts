import type { APIEvent } from '@solidjs/start/server';
import { getRequestEvent } from 'solid-js/web';

export function GET(event: APIEvent) {
  const re = getRequestEvent() as any;
  const native = re?.nativeEvent;
  const ctx = native?.context;
  return new Response(
    JSON.stringify({
      id: event.params.id,
      w: 4,
      nativeKeys: native ? Object.keys(native) : null,
      ctxKeys: ctx ? Object.keys(ctx) : null,
      matchedRoute: ctx?.matchedRoute ? { route: ctx.matchedRoute.route, keys: Object.keys(ctx.matchedRoute) } : null,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}
