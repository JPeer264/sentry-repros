import * as Sentry from "@sentry/react-router";

const integrations = [];

if (process.env.PROBE_VARIANT === "bunhttp") {
  const { bunHttpServerIntegration } = await import("@sentry/bun");
  integrations.push(bunHttpServerIntegration());
}

Sentry.init({
  dsn: "https://public@127.0.0.1/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: process.env.PROBE_LIFECYCLE || "static",
  debug: process.env.PROBE_DEBUG === "1",
  integrations,
});

console.log(
  `[probe] sentry init variant=${process.env.PROBE_VARIANT || "stock"} lifecycle=${process.env.PROBE_LIFECYCLE || "static"}`,
);
