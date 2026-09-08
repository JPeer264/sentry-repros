import * as Sentry from '@sentry/cloudflare';

export async function loader() {
  Sentry.captureMessage('sentinel');
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
