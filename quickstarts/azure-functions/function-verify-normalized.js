// Repro-only: index.mdx:154-172 with the one line the guide gives for request data
// (scope.setSDKProcessingMetadata({ request: req }), index.mdx:160) replaced by the key the develop build reads
// (`normalizedRequest`, node_modules/@sentry/core/build/types/scope.d.ts:43). Everything else is verbatim.
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
    // This function does not exist, triggering an error
    await notExistFunction();
  } catch (e) {
    Sentry.withScope((scope) => {
      scope.setSDKProcessingMetadata({
        normalizedRequest: {
          url: req.url,
          method: req.method,
          headers: req.headers,
          query_string: new URL(req.url).search.slice(1),
          data: req.body,
        },
      });
      Sentry.captureException(e);
    });
  }

  // Wait for the event to be sent before the function execution ends
  await Sentry.flush(2000);

  context.res = {
    status: 500,
    body: "Test error sent to Sentry.",
  };
};
