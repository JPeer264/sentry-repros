import type { APIEvent } from '@solidjs/start/server';

export function GET(event: APIEvent) {
  return new Response(JSON.stringify({ id: event.params.id }), {
    headers: { 'content-type': 'application/json' },
  });
}
