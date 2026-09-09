const Sentry = require("@sentry/google-cloud-serverless");

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

exports.helloEvents = Sentry.wrapEventFunction(
  (data, context, callback) => {
    throw new Error("oh, hello there!");
  }
);

// --- repro-only, not part of the guide: a sentinel through the same client so the run never sleeps ---
process.on("SIGUSR2", () => {
  Sentry.captureMessage("sentinel");
  Sentry.startSpan({ op: "test", name: "sentinel" }, () => {});
  Sentry.logger.info("User example action completed");
  Sentry.flush(2000).then((ok) => console.log(`[repro] sentinel flushed ok=${ok}`));
});
