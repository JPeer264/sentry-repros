// docs: platform-includes/getting-started-complete/javascript.remix.mdx:158-196, copied verbatim with the
// "performance" option (the "profiling" lines are left out). The DSN points at the local sink, which is the
// only change besides the repro-only `debug: true`.
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: "http://public@localhost:4758/1",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,

  // Optionally capture action formData attributes with errors.
  // This requires `sendDefaultPii` set to true as well.
  captureActionFormDataKeys: {
    key_x: true,
    key_y: true,
  },

  // repro-only
  debug: true,
});
