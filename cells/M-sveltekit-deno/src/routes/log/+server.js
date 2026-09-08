import * as Sentry from '@sentry/sveltekit';
export function GET() {
  Sentry.logger.info('hello-from-sveltekit-route');
  return new Response('logged');
}
