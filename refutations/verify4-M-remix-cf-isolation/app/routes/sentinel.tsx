import { captureMessage } from '@sentry/remix/cloudflare';

export async function loader() {
  captureMessage('sentinel');
  return new Response('sentinel');
}
