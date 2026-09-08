import "@sentry/deno/import";
import * as Sentry from "@sentry/deno";
import { fetchTracingIntegration } from "./fetch-tracing.ts";

const extra = Deno.env.get("SENTRY_FETCH_TRACING") === "1"
  ? [fetchTracingIntegration()]
  : [];

Sentry.init({
  dsn: "https://public@example.invalid/1",
  tunnel: Deno.env.get("SENTRY_TUNNEL"),
  tracesSampleRate: 1.0,
  traceLifecycle: (Deno.env.get("SENTRY_LIFECYCLE") ?? "static") as
    | "static"
    | "stream",
  debug: Deno.env.get("SENTRY_DEBUG") === "1",
  integrations: extra,
});
