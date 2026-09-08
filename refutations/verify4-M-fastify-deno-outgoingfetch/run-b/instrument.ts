import * as Sentry from "@sentry/deno";
import { denoFetchIntegration } from "./fetch-integration.ts";
import { winterCGFetchIntegration } from "@sentry/vercel-edge";

const variant = Deno.env.get("VARIANT") ?? "baseline";
const lifecycle = (Deno.env.get("TRACE_LIFECYCLE") ?? "stream") as "stream" | "static";

Sentry.init({
  dsn: "https://public@example.com/1",
  tunnel: `http://127.0.0.1:${Deno.env.get("SINK_PORT")}/`,
  tracesSampleRate: 1.0,
  traceLifecycle: lifecycle,
  tracePropagationTargets: [/.*/],
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
  integrations: variant === "fetchint" ? [denoFetchIntegration()] : variant === "wintercg" ? [winterCGFetchIntegration()] : [],
});
console.log("sentry init variant=" + variant + " lifecycle=" + lifecycle);
