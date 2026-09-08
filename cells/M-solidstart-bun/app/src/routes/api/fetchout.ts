import type { APIEvent } from '@solidjs/start/server';

export async function GET(event: APIEvent) {
  const target = new URL(event.request.url).searchParams.get('target') as string;
  const res = await fetch(target);
  return new Response(await res.text(), { headers: { 'content-type': 'application/json' } });
}
