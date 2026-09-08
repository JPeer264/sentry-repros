import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { captureMessage, setTag } from '@sentry/remix/cloudflare';

export async function loader({ params }: LoaderFunctionArgs) {
  const t = params.t as string;
  setTag('probe_tag', t);
  await new Promise(resolve => setTimeout(resolve, 400));
  captureMessage(`probe-msg-${t}`);
  return new Response(JSON.stringify({ t }), { headers: { 'content-type': 'application/json' } });
}
