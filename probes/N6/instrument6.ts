import * as Sentry from '@sentry/bun';

Sentry.init({
  dsn: 'https://abc123@o0.ingest.sentry.io/0',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.captureConsoleIntegration(),
    Sentry.dedupeIntegration(),
    Sentry.extraErrorDataIntegration(),
    Sentry.rewriteFramesIntegration(),
    Sentry.contextLinesIntegration({ frameContextLines: 3 }),
    Sentry.featureFlagsIntegration(),
  ],
});
