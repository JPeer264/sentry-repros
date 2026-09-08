import * as Sentry from '@sentry/cloudflare';

export async function loader() {
  Sentry.logger.info('remix-cf log line', { where: 'loader' });
  return new Response(JSON.stringify({ logged: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
