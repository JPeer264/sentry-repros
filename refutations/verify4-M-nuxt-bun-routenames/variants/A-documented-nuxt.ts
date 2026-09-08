// VARIANT A: documented wiring. bun preset + bun runtime -> ZERO spans, broken isolation.
import * as Sentry from '@sentry/nuxt'
Sentry.init({ dsn: 'https://public@dsn.ingest.sentry.io/1337', tunnel: 'http://127.0.0.1:47231/', tracesSampleRate: 1.0, debug: true })
