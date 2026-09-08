import * as Sentry from '@sentry/cloudflare';
export default defineEventHandler(() => {
  Sentry.captureMessage('sentinel');
  return { ok: true };
});
