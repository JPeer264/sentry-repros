// Repro-only: the guide's Verify > Issues body (index.mdx:154-172) on the @azure/functions v4 programming
// model (app.http, (request, context) handler, returned response), which the guide never shows. The init is
// index.mdx:55,60-61,69-74,83 verbatim plus the two marked repro-only options.
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

const { app } = require("@azure/functions");

app.http("verify", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      // This function does not exist, triggering an error
      await notExistFunction();
    } catch (e) {
      Sentry.withScope((scope) => {
        scope.setSDKProcessingMetadata({ request });
        Sentry.captureException(e);
      });
    }

    // Wait for the event to be sent before the function execution ends
    await Sentry.flush(2000);

    return {
      status: 500,
      body: "Test error sent to Sentry.",
    };
  },
});
