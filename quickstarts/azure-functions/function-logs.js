// docs/platforms/javascript/guides/azure-functions/index.mdx:55,60-61,69-74,83 (Configure) plus the three
// logger calls of includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13-23 verbatim. The include
// shows bare statements; here they sit inside a function of the guide's shape (index.mdx:154, :166-171) so they
// run per invocation and the guide's flush applies. The init has no logs option (the guide offers none).
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://public@o0.ingest.sentry.io/0",
  tunnel: process.env.SENTRY_TUNNEL, // repro-only: envelopes go to the local sink
  debug: true, // repro-only

  // Add Performance Monitoring by setting tracesSampleRate
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
});

module.exports = async function (context, req) {
  Sentry.logger.info("User example action completed");

  Sentry.logger.warn("Slow operation detected", {
    operation: "data_fetch",
    duration: 3500,
  });

  Sentry.logger.error("Validation failed", {
    field: "email",
    reason: "Invalid email",
  });

  // Wait for the event to be sent before the function execution ends
  await Sentry.flush(2000);

  context.res = {
    status: 200,
    body: "Hello world!",
  };
};
