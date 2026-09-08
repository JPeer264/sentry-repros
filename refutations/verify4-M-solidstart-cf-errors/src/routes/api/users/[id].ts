import type { APIEvent } from '@solidjs/start/server';

export function GET({ params }: APIEvent) {
  return new Response(JSON.stringify({ id: params.id }), { headers: { 'content-type': 'application/json' } });
}
