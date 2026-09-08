import * as Sentry from '@sentry/cloudflare';

export function GET() {
  Sentry.logger.info('solidstart-cf log line', { where: 'route-handler' });
  return new Response('{"logged":true}', { headers: { 'content-type': 'application/json' } });
}
