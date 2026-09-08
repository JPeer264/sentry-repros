// THE FIX (verified, both nitro presets, stream and static lifecycle):
// keep the @sentry/nuxt init and add the two Bun server integrations.
// Requires `npm install @sentry/bun` alongside @sentry/nuxt.
import * as Sentry from '@sentry/nuxt'
import { bunServerIntegration, bunHttpServerIntegration } from '@sentry/bun'

Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:52411/',
  tracesSampleRate: 1.0,
  integrations: [bunServerIntegration(), bunHttpServerIntegration()],
  debug: true,
})
