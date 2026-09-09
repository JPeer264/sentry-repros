// docs/platforms/javascript/guides/azure-functions/index.mdx:55,60-61,69-74,83 (Configure, performance option)
// and index.mdx:193-206 (Verify > Tracing), verbatim; the two repro-only init options are marked.
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
  await Sentry.startSpan({ name: "My Custom Span", op: "task" }, async () => {
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // Wait for the event to be sent before the function execution ends
  await Sentry.flush(2000);

  context.res = {
    status: 200,
    body: "Hello world!",
  };
};
