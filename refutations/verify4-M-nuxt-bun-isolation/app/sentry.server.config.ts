import { bunServerIntegration } from '@sentry/bun'
import * as Sentry from '@sentry/nuxt'

// bunServerIntegration() is the fix: the nitro `bun` preset serves through Bun.serve,
// which no @sentry/node instrumentation touches, so nothing opens a per-request
// isolation scope or propagation context. This integration does both.
Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: process.env.SENTRY_TUNNEL || 'http://127.0.0.1:52882/',
  tracesSampleRate: 1.0,
  integrations: [bunServerIntegration()],
  debug: true,
})
