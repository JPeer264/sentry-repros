const Sentry = require("@sentry/google-cloud-serverless");

Sentry.init({
  dsn: "https://public@o0.ingest.sentry.io/0",
  tunnel: process.env.SENTRY_TUNNEL, // repro-only: envelopes go to the local sink
  debug: true, // repro-only
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.mysqlIntegration(),
    Sentry.mysql2Integration(),
    Sentry.pgIntegration(),
    Sentry.graphqlIntegration(),
    Sentry.mongoIntegration(),
    Sentry.mongooseIntegration(),
    Sentry.ioredisIntegration(),
  ],
});

exports.helloHttp = Sentry.wrapHttpFunction((req, res) => {
  throw new Error("oh, hello there!");
});

// --- repro-only, not part of the guide: a sentinel through the same client so the run never sleeps ---
process.on("SIGUSR2", () => {
  Sentry.captureMessage("sentinel");
  Sentry.startSpan({ op: "test", name: "sentinel" }, () => {});
  Sentry.logger.info("User example action completed");
  Sentry.flush(2000).then((ok) => console.log(`[repro] sentinel flushed ok=${ok}`));
});
