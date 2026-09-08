import type { APIEvent } from '@solidjs/start/server';
import { getRequestEvent } from 'solid-js/web';

export function GET(event: APIEvent) {
  const re = getRequestEvent() as any;
  const native = re?.nativeEvent;
  if (native) {
    native.context = native.context || {};
    native.context.matchedRoute = { route: '/api/w3/:id' };
    native.context.params = { id: event.params.id };
  }
  return new Response(JSON.stringify({ id: event.params.id, w: 3, hasNative: !!native, keys: Object.keys(re || {}) }));
}
