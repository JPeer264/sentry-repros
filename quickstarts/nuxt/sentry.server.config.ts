// getting-started-complete/javascript.nuxt.mdx:182-195, dsn pointed at the local sink, plus `debug`
// (repro-only, prints the installed integrations).
import * as Sentry from "@sentry/nuxt";

Sentry.init({
  dsn: "http://public@localhost:4752/1",
  debug: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
});
