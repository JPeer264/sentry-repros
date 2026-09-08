import * as Sentry from '@sentry/bun'

Sentry.init({
  dsn: 'https://publickey@o0.ingest.sentry.io/0',
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT ?? 34118}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.SENTRY_LIFECYCLE === 'static' ? 'static' : 'stream',
  debug: true,
})
