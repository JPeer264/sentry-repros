import * as Sentry from '@sentry/nuxt'
import { bunServerIntegration } from '@sentry/bun'

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:51841/',
  tracesSampleRate: 1.0,
  integrations: [bunServerIntegration()],
  debug: true,
})
