// index.mdx:157-172 verbatim, DSN pointed at the local sink (the page uses `dsn` on the server,
// no tunnel), plus `debug: true` (repro addition).
import * as Sentry from "@sentry/solidstart";

Sentry.init({
  dsn: "http://public@localhost:4764/1",
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
});
