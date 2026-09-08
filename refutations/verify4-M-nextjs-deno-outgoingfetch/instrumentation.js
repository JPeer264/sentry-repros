import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config.js');
  }
}

export const onRequestError = Sentry.captureRequestError;
