import { handleErrorWithSentry, initCloudflareSentryHandle, sentryHandle } from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

export const handleError = handleErrorWithSentry();

export const handle = sequence(
  initCloudflareSentryHandle({
    dsn: 'https://public@o0.ingest.sentry.io/1234',
    tunnel: 'http://127.0.0.1:47311/',
    tracesSampleRate: 1.0,
    traceLifecycle: 'static',
    debug: true,
  }),
  sentryHandle(),
);
