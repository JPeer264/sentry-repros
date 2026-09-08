// Same page, reduced to what @sentry/opentelemetry@10.67.0 actually exports:
// the @sentry/node-core import is gone (no such package on the v11 line) and so are
// SentrySampler / SentrySpanProcessor / SentryContextManager. skipOpenTelemetrySetup is kept.
import * as Sentry from "@sentry/bun";
import { SentryPropagator } from "@sentry/opentelemetry";

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

const sentryClient = Sentry.init({
  dsn: "http://public@localhost/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  skipOpenTelemetrySetup: true,
  tracesSampleRate: 1.0,
});

console.log("[instrument] client after init:", !!sentryClient);

const provider = new NodeTracerProvider({
  spanProcessors: [],
});

provider.register({
  propagator: new SentryPropagator(),
});
