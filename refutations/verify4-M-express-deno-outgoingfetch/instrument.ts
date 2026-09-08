import "@sentry/deno/import";
import "./jsonfix.ts";
import * as Sentry from "@sentry/deno";
import { denoFetchIntegration } from "./userland-fetch-integration.ts";

const variant = Deno.env.get("VARIANT") ?? "baseline";
const lifecycle = (Deno.env.get("TRACE_LIFECYCLE") ?? "stream") as "stream" | "static";

Sentry.init({
  dsn: "https://public@example.com/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: lifecycle,
  tracePropagationTargets: [/.*/],
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
  integrations: variant === "fetchint" ? [denoFetchIntegration()] : [],
});
console.log("sentry init", variant, lifecycle);
