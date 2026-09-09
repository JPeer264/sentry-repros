// Not in the Elysia guide: the Sentry.init() call of index.mdx:109-119 moved into its own file for
// `node --import ./instrument.mjs app.mjs`, the install method the Node guides use.
import * as Sentry from "@sentry/elysia";

Sentry.init({
  dsn: "https://1234567890abcdef1234567890abcdef@o0.ingest.sentry.io/1337",
  tunnel: process.env.SENTRY_TUNNEL,
  debug: true,
  tracesSampleRate: 1.0,
});
