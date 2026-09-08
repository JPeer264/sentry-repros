export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config.js');
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
