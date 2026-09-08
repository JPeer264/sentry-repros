// The "NodeTracerProvider" tab of
// ~/dev/sentry-docs/platform-includes/performance/opentelemetry-setup/javascript.bun.mdx:3-44,
// verbatim except for the dsn/tunnel/traceLifecycle needed to point it at the local sink.
import * as Sentry from "@sentry/bun";
import { SentryContextManager, validateOpenTelemetrySetup } from "@sentry/node-core";
import { SentrySpanProcessor, SentryPropagator, SentrySampler } from "@sentry/opentelemetry";

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

const sentryClient = Sentry.init({
  dsn: "http://public@localhost/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  skipOpenTelemetrySetup: true,

  // The SentrySampler will use this to determine which traces to sample
  tracesSampleRate: 1.0,
  // Filter out the BunServer integration in case you want to avoid sending spans from there:
  // integrations: (integrations) =>
  //    integrations.filter((i) => i.name !== "BunServer")
});

// Note: This could be BasicTracerProvider or any other provider depending on
// how you are using the OpenTelemetry SDK
const provider = new NodeTracerProvider({
  // Ensure the correct subset of traces is sent to Sentry
  // This also ensures trace propagation works as expected
  sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
  spanProcessors: [
    // Ensure spans are correctly linked & sent to Sentry
    new SentrySpanProcessor(),
    // Add additional processors here
  ],
});

provider.register({
  // Ensure trace propagation works
  // This relies on the SentrySampler for correct propagation
  propagator: new SentryPropagator(),
  // Ensure context & request isolation are correctly managed
  contextManager: new SentryContextManager(),
});

// Validate that the setup is correct
validateOpenTelemetrySetup();
