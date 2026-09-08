// VARIANT D (THE FIX): keep @sentry/nuxt init, add the Bun.serve integration.
// Requires `npm install @sentry/bun`. Gives GET /users/:id, source=route, on bun.
import * as Sentry from '@sentry/nuxt'
import { bunServerIntegration } from '@sentry/bun'
Sentry.init({
  dsn: 'https://public@dsn.ingest.sentry.io/1337',
  tunnel: 'http://127.0.0.1:47231/',
  tracesSampleRate: 1.0,
  integrations: [bunServerIntegration()],
  debug: true,
})
