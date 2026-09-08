import * as Sentry from '@sentry/cloudflare';
import type { APIEvent } from '@solidjs/start/server';

export async function GET(event: APIEvent) {
  const who = new URL(event.request.url).searchParams.get('who') || 'none';
  Sentry.setTag('who', who);
  await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 100)));
  Sentry.captureException(new Error(`iso-${who}`));
  return new Response(JSON.stringify({ who }), { headers: { 'content-type': 'application/json' } });
}
