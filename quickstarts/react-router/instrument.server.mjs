// manual-setup.mdx:208-237 verbatim without the profiling option (off by default on the page).
// Repro-only: the DSN points at the local sink (the page's server snippet uses `dsn`, not `tunnel`)
// and `debug: true` prints the installed integrations.
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "http://public@localhost:4760/1",
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#tracesSampleRate
  tracesSampleRate: 1.0,
});
