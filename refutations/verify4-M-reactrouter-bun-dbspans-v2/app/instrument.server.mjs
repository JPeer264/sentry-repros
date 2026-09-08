import * as dc from "node:diagnostics_channel";
import { bunHttpServerIntegration } from "@sentry/bun";
import * as Sentry from "@sentry/react-router";

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: process.env.SENTRY_TUNNEL,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.SENTRY_TRACE_LIFECYCLE || "static",
  debug: process.env.SENTRY_DEBUG === "1",
  integrations: process.env.BUN_HTTP === "0" ? [] : [bunHttpServerIntegration()],
});

if (process.env.SENTRY_PIN === "1") {
  globalThis.__sentryKeptChannels = [
    "mysql2:query",
    "mysql2:execute",
    "mysql2:connect",
    "mysql2:pool:connect",
  ].map(name => dc.tracingChannel(name));
}

if (process.env.SENTRY_KEEPALIVE === "driver") {
  await import("mysql2/promise");
}
