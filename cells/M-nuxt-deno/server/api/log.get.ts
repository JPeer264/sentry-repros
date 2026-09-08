import * as Sentry from '@sentry/nuxt';

export default defineEventHandler(() => {
  Sentry.logger.info('hello-from-nuxt-deno', { where: 'handler' });
  return { logged: true };
});
