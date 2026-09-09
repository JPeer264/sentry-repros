// manual-setup/index.mdx:199-214 verbatim, plus a DSN that points at the local sink and `debug: true`.
import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "http://public@localhost:4762/1",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  debug: true,
});
