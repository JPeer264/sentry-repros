// docs/platforms/javascript/guides/azure-functions/index.mdx:55,60-61,69-74,83 (Configure) and index.mdx:108-121
// (Capture Errors), verbatim: the try body is the guide's placeholder comment, so nothing throws.
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
  try {
    // Your function code
  } catch (e) {
    // use Sentry.withScope to enrich the event with request data
    Sentry.withScope((scope) => {
      // Attach request context (requires dataCollection: { userInfo: true })
      scope.setSDKProcessingMetadata({ request: req });
      Sentry.captureException(e);
    });
    await Sentry.flush(2000);
  }
  // ...
};
