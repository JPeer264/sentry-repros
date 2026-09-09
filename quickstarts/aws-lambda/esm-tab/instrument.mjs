// docs/platforms/javascript/guides/aws-lambda/install/npm.mdx:125-154 (ESM tab, error-monitoring + performance options), verbatim
// except the DSN placeholder (points at the local sink) and `debug: true` to print the installed integrations.
import * as Sentry from "@sentry/aws-serverless";

Sentry.init({
  dsn: "http://public@127.0.0.1:4741/1",
  debug: true,

  // Add Tracing by setting tracesSampleRate and adding integration
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
});
