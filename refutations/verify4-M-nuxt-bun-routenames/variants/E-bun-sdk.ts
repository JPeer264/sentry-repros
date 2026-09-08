// VARIANT E: init from @sentry/bun entirely. Also works; sdk name becomes sentry.javascript.bun.
import * as Sentry from '@sentry/bun'
Sentry.init({ dsn: 'https://public@dsn.ingest.sentry.io/1337', tunnel: 'http://127.0.0.1:47231/', tracesSampleRate: 1.0, debug: true })
