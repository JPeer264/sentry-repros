import * as Sentry from "@sentry/react-router";
import { fetchIntegration as bunFetchIntegration, bunHttpServerIntegration } from "@sentry/bun";

const variant = process.env.PROBE_VARIANT || "baseline";
const lifecycle = process.env.PROBE_LIFECYCLE || "static";

const integrations = [];
if (variant === "bunfetch" || variant === "bunall") {
  integrations.push(bunFetchIntegration());
}
if (variant === "bunall") {
  integrations.push(bunHttpServerIntegration());
}

Sentry.init({
  dsn: "http://abc123@127.0.0.1:1/1",
  tunnel: `http://127.0.0.1:${process.env.SINK_PORT}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: lifecycle,
  integrations,
  debug: process.env.PROBE_DEBUG === "1",
});

console.log(`[probe] sentry init variant=${variant} lifecycle=${lifecycle}`);
