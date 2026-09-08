import { captureMessage } from '@sentry/remix/cloudflare';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export const loader = ({ params, request }: LoaderFunctionArgs) => {
  const tag = new URL(request.url).searchParams.get('t') || 'x';
  captureMessage(`sentinel-${tag}`);
  return new Response('sentinel ok');
};
