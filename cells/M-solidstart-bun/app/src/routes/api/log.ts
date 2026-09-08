import * as Sentry from '@sentry/solidstart';

export function GET() {
  Sentry.logger.info('probe-log-from-handler', { runtime: 'bun' });
  return new Response('{"logged":true}', { headers: { 'content-type': 'application/json' } });
}
