import { bunServerIntegration } from '@sentry/bun'
import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:41318/',
  tracesSampleRate: 1.0,
  integrations: [bunServerIntegration()],
})
