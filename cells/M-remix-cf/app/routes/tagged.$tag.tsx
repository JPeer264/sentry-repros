import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import * as Sentry from '@sentry/cloudflare';

export async function loader({ params }: LoaderFunctionArgs) {
  Sentry.setTag('probe_tag', params.tag);
  await new Promise(r => setTimeout(r, 300));
  Sentry.captureException(new Error(`iso-${params.tag}`));
  return new Response(JSON.stringify({ tag: params.tag }), {
    headers: { 'content-type': 'application/json' },
  });
}
