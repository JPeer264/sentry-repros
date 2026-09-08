// VARIANT G: recommended snippet + traceLifecycle static
import * as Sentry from '@sentry/nuxt'
import { bunServerIntegration, bunHttpServerIntegration } from '@sentry/bun'

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:52411/',
  tracesSampleRate: 1.0,
  traceLifecycle: 'static',
  integrations: [bunServerIntegration(), bunHttpServerIntegration()],
  debug: true,
})
