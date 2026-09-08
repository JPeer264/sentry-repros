import * as Sentry from '@sentry/solidstart';

export function GET() {
  Sentry.logger.info('solidstart-deno log line');
  return new Response('{"logged":true}', { headers: { 'content-type': 'application/json' } });
}
