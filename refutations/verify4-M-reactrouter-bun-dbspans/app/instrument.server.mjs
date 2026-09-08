import * as Sentry from "@sentry/react-router";
import { bunHttpServerIntegration } from "@sentry/bun";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: process.env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.SENTRY_TRACE_LIFECYCLE || "static",
  debug: process.env.SENTRY_DEBUG === "1",
  integrations: process.env.BUN_HTTP === "1" ? [bunHttpServerIntegration()] : [],
});

// Bun workaround: node:diagnostics_channel keeps channels weakly, so the stores the SDK binds are
// collected as soon as it drops its reference. Loading the driver here keeps them alive.
if (process.env.KEEPALIVE === "driver") {
  await import("mysql2/promise");
}
