import * as Sentry from '@sentry/nuxt'
import { fetchIntegration, bunServerIntegration } from '@sentry/bun'

Sentry.init({
  dsn: 'https://abc123@o1.ingest.sentry.io/1',
  tunnel: 'http://127.0.0.1:41118/',
  tracesSampleRate: 1.0,
  debug: true,
  integrations: [fetchIntegration(), bunServerIntegration()],
})
